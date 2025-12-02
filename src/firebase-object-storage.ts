import { nanoid } from 'nanoid';
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";

import {
  FirebaseObjectStorageConfig,
  IObjectStorage,
  ObjectMetadata,
  ObjectData,
  StoredObject,
  ObjectWithId,
  MonitorCallback,
  DemonitorFunction,
  AddOptions
} from './types';

export class FirebaseObjectStorage implements IObjectStorage {
  private config: FirebaseObjectStorageConfig;
  private initPromise: Promise<void>;
  private initialized = false;
  private app: firebase.app.App;

  constructor(config: FirebaseObjectStorageConfig) {
    if (config.version !== 1) {
      throw new Error(`Unsupported config version: ${config.version}. Expected version 1.`);
    }
    this.config = config;

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
    if (this.config.user.type === "authenticated") {
      const {contextId, platformId, platformUserId, resourceLinkId} = this.config.user;
      return {
        created_at: firebase.firestore.FieldValue.serverTimestamp(),
        platform_id: platformId,
        platform_user_id: platformUserId.toString(),
        context_id: contextId,
        resource_link_id: resourceLinkId,
        run_key: "",
        ...contents
      };
    } else {
      const { runKey } = this.config.user;
      return {
        created_at: firebase.firestore.FieldValue.serverTimestamp(),
        run_key: runKey,
        platform_user_id: runKey,
        ...contents
      };
    }
  }

  private getPaths(objectId: string): {metadataPath: string, dataPath: string} {
    const metadataPath = `${this.config.root}/object_store_metadata/${objectId}`;
    const dataPath = `${this.config.root}/object_store_data/${objectId}`;
    return {metadataPath, dataPath};
  }

  private getRefs(objectId: string): {metadataRef: firebase.firestore.DocumentReference, dataRef: firebase.firestore.DocumentReference} {
    const { metadataPath, dataPath } = this.getPaths(objectId);
    const metadataRef = this.app.firestore().doc(metadataPath);
    const dataRef = this.app.firestore().doc(dataPath);
    return {metadataRef, dataRef};
  }

  /**
   * Lists metadata documents for objects owned by the current user
   */
  async listMine(): Promise<ObjectWithId[]> {
    await this.ensureInitialized();

    // TODO: Implement Firebase query for user's own objects
    return [];
  }

  /**
   * Lists metadata documents for objects linked to the current user
   */
  async listLinked(): Promise<ObjectWithId[]> {
    await this.ensureInitialized();

    // TODO: Implement Firebase query for linked objects
    return [];
  }

  /**
   * Lists metadata documents for objects associated with specific question IDs
   */
  async list(questionIds: string[]): Promise<ObjectWithId[]> {
    await this.ensureInitialized();
    // TODO: Implement Firebase query for objects by question IDs
    return [];
  }

  /**
   * Monitors metadata documents for objects owned by the current user
   * Invokes callback at start and on any change
   * Returns a function to stop monitoring
   */
  monitorMine(callback: MonitorCallback): DemonitorFunction {
    // await this.ensureInitialized();

    // TODO: Implement Firebase realtime listener for user's own objects
    callback([]);
    return () => {
      // TODO: Implement cleanup
    };
  }

  /**
   * Monitors metadata documents for objects linked to the current user
   * Invokes callback at start and on any change
   * Returns a function to stop monitoring
   */
  monitorLinked(callback: MonitorCallback): DemonitorFunction {
    // await this.ensureInitialized();

    // TODO: Implement Firebase realtime listener for linked objects
    callback([]);
    return () => {
      // TODO: Implement cleanup
    };
  }

  /**
   * Monitors metadata documents for objects associated with specific question IDs
   * Invokes callback at start and on any change
   * Returns a function to stop monitoring
   */
  monitor(questionIds: string[], callback: MonitorCallback): DemonitorFunction {
    // await this.ensureInitialized();

    // TODO: Implement Firebase realtime listener for objects by question IDs
    callback([]);
    return () => {
      // TODO: Implement cleanup
    };
  }

  /**
   * Adds both metadata and data documents for a new object
   * Returns the generated object ID (nanoid) or the provided ID if specified in options
   */
  async add(object: StoredObject, options?: AddOptions): Promise<string> {
    await this.ensureInitialized();

    const newObjectId = options?.id ?? nanoid();
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

    // TODO: Read metadata document from Firebase
    // TODO: Read data document from Firebase
    return {
      metadata: {},
      data: {}
    };
  }

  /**
   * Reads only the metadata document for an object
   */
  async readMetadata(objectId: string): Promise<ObjectMetadata | undefined> {
    await this.ensureInitialized();

    // TODO: Read metadata document from Firebase
    return {};
  }

  /**
   * Reads only the data document for an object
   */
  async readData(objectId: string): Promise<ObjectData | undefined> {
    await this.ensureInitialized();

    // TODO: Read data document from Firebase
    return {};
  }

  /**
   * Generates a new unique ID using nanoid
   */
  genId(): string {
    return nanoid();
  }
}
