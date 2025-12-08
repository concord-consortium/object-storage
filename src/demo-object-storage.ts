import { nanoid } from 'nanoid';
import {
  DemoObjectStorageConfig,
  IObjectStorage,
  ObjectMetadata,
  ObjectData,
  StoredObject,
  ObjectWithId,
  MonitorCallback,
  DemonitorFunction,
  AddOptions,
  ObjectMetadataWithId
} from './types';

export class DemoObjectStorage implements IObjectStorage {
  private config: DemoObjectStorageConfig;
  private objects: Map<string, StoredObject>;
  private monitors: Map<string, MonitorCallback[]>;

  constructor(config: DemoObjectStorageConfig) {
    if (config.version !== 1) {
      throw new Error(`Unsupported config version: ${config.version}. Expected version 1.`);
    }
    this.config = config;
    this.objects = new Map();
    this.monitors = new Map();
  }

  private getQuestionMetadata(): ObjectMetadataWithId[] {
    // In demo mode, just return all objects since there are no other questions
    // that can use this storage instance
    return Array.from(this.objects.entries()).map(([id, obj]) => {
      return { id, metadata: obj.metadata };
    });
  }

  /**
   * Lists metadata documents for objects associated with specific question IDs
   */
  async list(questionId: string): Promise<ObjectMetadataWithId[]> {
    return this.getQuestionMetadata();
  }

  /**
   * Monitors metadata documents for objects associated with specific question IDs
   * Invokes callback at start and on any change
   * Returns a function to stop monitoring
   */
  monitor(questionId: string, callback: MonitorCallback): DemonitorFunction {
    if (!this.monitors.has(questionId)) {
      this.monitors.set(questionId, []);
    }
    this.monitors.get(questionId)!.push(callback);

    // Invoke callback immediately with current state
    callback(this.getQuestionMetadata());

    return () => {
      const callbacks = this.monitors.get(questionId);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  /**
   * Adds both metadata and data documents for a new object
   * Returns the generated object ID (nanoid) or the provided ID if specified in options
   */
  async add(object: StoredObject, options?: AddOptions): Promise<string> {
    const id = options?.id ?? nanoid();
    this.objects.set(id, object);

    // Notify all monitors
    this.notifyMonitors();

    return id;
  }

  /**
   * Reads both metadata and data documents for an object
   * Returns undefined if the object is not found
   */
  async read(objectId: string): Promise<StoredObject | undefined> {
    const obj = this.objects.get(objectId);
    if (!obj) {
      return undefined;
    }
    return {
      metadata: obj.metadata,
      data: obj.data
    };
  }

  /**
   * Reads only the metadata document for an object
   * Returns undefined if the object is not found
   */
  async readMetadata(objectId: string): Promise<ObjectMetadata | undefined> {
    const obj = this.objects.get(objectId);
    if (!obj) {
      return undefined;
    }
    return obj.metadata;
  }

  /**
   * Reads only the data document for an object
   * Returns undefined if the object is not found
   */
  async readData(objectId: string): Promise<ObjectData | undefined> {
    const obj = this.objects.get(objectId);
    if (!obj) {
      return undefined;
    }
    return obj.data;
  }

  /**
   * Generates a new unique ID using nanoid
   */
  genId(): string {
    return nanoid();
  }

  /**
   * Notifies all active monitors of changes
   */
  private notifyMonitors(): void {
    const allObjects = this.getQuestionMetadata();
    this.monitors.forEach(callbacks => {
      callbacks.forEach(callback => callback(allObjects));
    });
  }
}
