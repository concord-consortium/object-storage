import { nanoid } from 'nanoid';
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

  constructor(config: FirebaseObjectStorageConfig) {
    if (config.version !== 1) {
      throw new Error(`Unsupported config version: ${config.version}. Expected version 1.`);
    }
    this.config = config;
  }

  /**
   * Lists metadata documents for objects owned by the current user
   */
  async listMine(): Promise<ObjectWithId[]> {
    // TODO: Implement Firebase query for user's own objects
    return [];
  }

  /**
   * Lists metadata documents for objects linked to the current user
   */
  async listLinked(): Promise<ObjectWithId[]> {
    // TODO: Implement Firebase query for linked objects
    return [];
  }

  /**
   * Lists metadata documents for objects associated with specific question IDs
   */
  async list(questionIds: string[]): Promise<ObjectWithId[]> {
    // TODO: Implement Firebase query for objects by question IDs
    return [];
  }

  /**
   * Monitors metadata documents for objects owned by the current user
   * Invokes callback at start and on any change
   * Returns a function to stop monitoring
   */
  monitorMine(callback: MonitorCallback): DemonitorFunction {
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
    // TODO: Generate nanoid if not provided in options
    // TODO: Add metadata document to Firebase
    // TODO: Add data document to Firebase
    const newObjectId = options?.id ?? 'placeholder-id';
    return newObjectId;
  }

  /**
   * Reads both metadata and data documents for an object
   */
  async read(objectId: string): Promise<StoredObject | undefined> {
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
    // TODO: Read metadata document from Firebase
    return {};
  }

  /**
   * Reads only the data document for an object
   */
  async readData(objectId: string): Promise<ObjectData | undefined> {
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
