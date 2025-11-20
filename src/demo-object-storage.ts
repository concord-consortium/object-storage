import { nanoid } from 'nanoid';
import {
  DemoObjectStorageConfig,
  IObjectStorage,
  ObjectMetadata,
  ObjectData,
  StoredObject,
  ObjectWithId,
  MonitorCallback,
  DemonitorFunction
} from './types';

export class DemoObjectStorage implements IObjectStorage {
  private config: DemoObjectStorageConfig;
  private objects: Map<string, ObjectWithId>;
  private monitors: Map<string, MonitorCallback[]>;

  constructor(config: DemoObjectStorageConfig) {
    if (config.version !== 1) {
      throw new Error(`Unsupported config version: ${config.version}. Expected version 1.`);
    }
    this.config = config;
    this.objects = new Map();
    this.monitors = new Map();
  }

  /**
   * Lists metadata documents for objects owned by the current user
   */
  async listMine(): Promise<ObjectWithId[]> {
    return Array.from(this.objects.values());
  }

  /**
   * Lists metadata documents for objects linked to the current user
   */
  async listLinked(): Promise<ObjectWithId[]> {
    // not applicable in demo storage
    return [];
  }

  /**
   * Lists metadata documents for objects associated with specific question IDs
   */
  async list(questionIds: string[]): Promise<ObjectWithId[]> {
    // In demo mode, just return all objects
    return Array.from(this.objects.values());
  }

  /**
   * Monitors metadata documents for objects owned by the current user
   * Invokes callback at start and on any change
   * Returns a function to stop monitoring
   */
  monitorMine(callback: MonitorCallback): DemonitorFunction {
    const key = 'mine';
    if (!this.monitors.has(key)) {
      this.monitors.set(key, []);
    }
    this.monitors.get(key)!.push(callback);

    // Invoke callback immediately with current state
    callback(Array.from(this.objects.values()));

    return () => {
      const callbacks = this.monitors.get(key);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  /**
   * Monitors metadata documents for objects linked to the current user
   * Invokes callback at start and on any change
   * Returns a function to stop monitoring
   */
  monitorLinked(callback: MonitorCallback): DemonitorFunction {
    // not applicable in demo storage
    callback([]);
    return () => {
      // no-op
    };
  }

  /**
   * Monitors metadata documents for objects associated with specific question IDs
   * Invokes callback at start and on any change
   * Returns a function to stop monitoring
   */
  monitor(questionIds: string[], callback: MonitorCallback): DemonitorFunction {
    const key = `monitor-${questionIds.join(',')}`;
    if (!this.monitors.has(key)) {
      this.monitors.set(key, []);
    }
    this.monitors.get(key)!.push(callback);

    // Invoke callback immediately with current state
    callback(Array.from(this.objects.values()));

    return () => {
      const callbacks = this.monitors.get(key);
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
   * Returns the generated object ID (nanoid)
   */
  async add(object: StoredObject): Promise<string> {
    const id = nanoid();
    const objectWithId: ObjectWithId = {
      id,
      metadata: object.metadata,
      data: object.data
    };

    this.objects.set(id, objectWithId);

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
   * Notifies all active monitors of changes
   */
  private notifyMonitors(): void {
    const allObjects = Array.from(this.objects.values());
    this.monitors.forEach(callbacks => {
      callbacks.forEach(callback => callback(allObjects));
    });
  }
}
