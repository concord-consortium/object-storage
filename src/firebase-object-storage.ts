import { nanoid } from 'nanoid';
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";

import {
  FirebaseObjectStorageConfig,
  IObjectStorage,
  MonitorCallback,
  DemonitorFunction,
  StoredObjectMetadataWithId
} from './types';
import { StoredObject, StoredObjectMetadata, StoredObjectData } from './stored-object';

export class FirebaseObjectStorage implements IObjectStorage {
  private config: FirebaseObjectStorageConfig;
  private initPromise: Promise<void>;
  private initialized = false;
  private app: firebase.app.App;

  constructor(config: FirebaseObjectStorageConfig) {
    if (config.version !== 1) {
      throw new Error(`Unsupported config version: ${config.version}. Expected version 1.`);
    }
    this.config = {...config};

    // ensure the question id is in the correct format
    this.config.questionId = this.ensureIdIsQuestionId(this.config.questionId);

    this.app = firebase.initializeApp(this.config.app);
    this.app.firestore().settings({
      ignoreUndefinedProperties: true,
    });

    // Start initialization immediately in constructor
    this.initPromise = this.initialize();
  }

  private async initialize(): Promise<void> {
    if (this.initialized) return;

    if (this.config.user.type === "authenticated") {
      // ensure any previous auth state is cleared before signing in
      await this.app.auth().signOut();
      await this.app.auth().signInWithCustomToken(this.config.user.jwt);
    }

    this.initialized = true;
  }

  private async ensureInitialized(): Promise<void> {
    await this.initPromise;
  }

  private createDocument(contents: any): Partial<firebase.firestore.DocumentData> {
    const { questionId } = this.config;
    if (this.config.user.type === "authenticated") {
      const {contextId, platformId, platformUserId, resourceLinkId} = this.config.user;
      return {
        created_at: firebase.firestore.FieldValue.serverTimestamp(),
        context_id: contextId,
        platform_id: platformId,
        platform_user_id: platformUserId,
        resource_link_id: resourceLinkId,
        run_key: "",
        question_id: questionId,
        ...contents
      };
    } else {
      const { runKey } = this.config.user;
      return {
        created_at: firebase.firestore.FieldValue.serverTimestamp(),
        run_key: runKey,
        platform_user_id: runKey,
        question_id: questionId,
        ...contents
      };
    }
  }

  private getPaths(objectId?: string): {metadataPath: string, dataPath: string} {
    const metadataPath = `${this.config.root}/object_store_metadata${objectId ? `/${objectId}` : ''}`;
    const dataPath = `${this.config.root}/object_store_data${objectId ? `/${objectId}` : ''}`;
    return {metadataPath, dataPath};
  }

  private getRefs(objectId: string): {metadataRef: firebase.firestore.DocumentReference, dataRef: firebase.firestore.DocumentReference} {
    const { metadataPath, dataPath } = this.getPaths(objectId);
    const metadataRef = this.app.firestore().doc(metadataPath);
    const dataRef = this.app.firestore().doc(dataPath);
    return {metadataRef, dataRef};
  }

  private getMetadataQuery(questionOrRefId: string): firebase.firestore.Query {
    const questionId = this.ensureIdIsQuestionId(questionOrRefId);

    const { metadataPath } = this.getPaths();
    let query: firebase.firestore.Query = this.app.firestore().collection(metadataPath)
      .where("question_id", "==", questionId);

    if (this.config.user.type === "authenticated") {    // logged in user
      const { contextId, platformId, resourceLinkId, platformUserId } = this.config.user;
      query = query
        .where("context_id", "==", contextId)
        .where("platform_id", "==", platformId)
        .where("platform_user_id", "==", platformUserId.toString())
        .where("resource_link_id", "==", resourceLinkId);
    } else {
      query = query.where("run_key", "==", this.config.user.runKey);
    }

    query = query.orderBy("created_at", "asc");

    return query;
  }

  /**
   * Ensures the provided ID is in question ID format as opposed to reference ID format
   *
   * eg: "404-MWInteractive" transforms to "mw_interactive_404"
   *
   * @param questionOrRefId
   * @returns
   */
  private ensureIdIsQuestionId(questionOrRefId: string) {
    const refIdRegEx = /(\d*)-(\D*)/g;
    const parsed = refIdRegEx.exec(questionOrRefId);
    if (parsed?.length) {
      const [ , embeddableId, embeddableType] = parsed;
      const snakeCased = embeddableType.replace(/(?!^)([A-Z])/g, "_$1").toLowerCase();
      return `${snakeCased}_${embeddableId}`;
    }
    return questionOrRefId;
  }

  /**
   * Lists metadata documents for objects associated with specific question IDs
   */
  async list(questionOrRefId: string): Promise<StoredObjectMetadataWithId[]> {
    await this.ensureInitialized();

    const query = this.getMetadataQuery(questionOrRefId);
    const querySnapshot = await query.get();

    const results: StoredObjectMetadataWithId[] = [];
    querySnapshot.forEach(doc => {
      results.push({ id: doc.id, metadata: doc.data().metadata });
    });

    return results;
  }

  /**
   * Monitors metadata documents for objects associated with specific question IDs
   * Invokes callback at start and on any change
   * Returns a function to stop monitoring
   */
  monitor(questionOrRefId: string, callback: MonitorCallback): DemonitorFunction {
    // await this.ensureInitialized();

    const query = this.getMetadataQuery(questionOrRefId);

    const unsub = query.onSnapshot(snapshot => {
      const results: StoredObjectMetadataWithId[] = [];
      snapshot.forEach(doc => {
        results.push({ id: doc.id, metadata: doc.data().metadata });
      });
      callback(results);
    });

    return () => {
      unsub();
    };
  }

  /**
   * Adds both metadata and data documents for a new object
   * Returns the object ID from the StoredObject
   */
  async add(object: StoredObject): Promise<string> {
    await this.ensureInitialized();

    const newObjectId = object.id;
    const { data, metadata } = object;
    const { metadataRef, dataRef } = this.getRefs(newObjectId);

    const dataDoc = this.createDocument({ data });
    const metadataDoc = this.createDocument({ metadata });

    const batch = this.app.firestore().batch();
    batch.set(dataRef, dataDoc);
    batch.set(metadataRef, metadataDoc);
    await batch.commit();

    return newObjectId;
  }

  /**
   * Reads both metadata and data documents for an object
   */
  async read(objectId: string): Promise<StoredObject | undefined> {
    await this.ensureInitialized();

    const metadata = await this.readMetadata(objectId);
    if (!metadata) {
      return undefined;
    }

    const data = await this.readData(objectId);
    if (!data) {
      return undefined;
    }

    return StoredObject.FromParts(objectId, metadata, data);
  }

  /**
   * Reads only the metadata document for an object
   */
  async readMetadata(objectId: string): Promise<StoredObjectMetadata | undefined> {
    await this.ensureInitialized();

    const { metadataRef } = this.getRefs(objectId);
    const metadataSnapshot = await metadataRef.get();

    if (!metadataSnapshot.exists) {
      return undefined;
    }

    return metadataSnapshot.data()?.metadata as StoredObjectMetadata | undefined;
  }

  /**
   * Reads only the data document for an object
   */
  async readData(objectId: string): Promise<StoredObjectData | undefined> {
    await this.ensureInitialized();

    const { dataRef } = this.getRefs(objectId);
    const dataSnapshot = await dataRef.get();

    if (!dataSnapshot.exists) {
      return undefined;
    }

    return dataSnapshot.data()?.data as StoredObjectData | undefined;
  }

  /**
   * Generates a new unique ID using nanoid
   */
  genId(): string {
    return nanoid();
  }
}
