export interface DemoObjectStorageConfig {
  type: "demo";
  version: 1;
}

export interface FirebaseObjectStorageConfig {
  type: "firebase";
  version: 1;
}

export type ObjectStorageConfig = DemoObjectStorageConfig | FirebaseObjectStorageConfig;

export interface AddOptions {
  id?: string;
}

export interface IObjectStorage {
  listMine(): Promise<ObjectWithId[]>;
  listLinked(): Promise<ObjectWithId[]>;
  list(questionIds: string[]): Promise<ObjectWithId[]>;
  monitorMine(callback: MonitorCallback): DemonitorFunction;
  monitorLinked(callback: MonitorCallback): DemonitorFunction;
  monitor(questionIds: string[], callback: MonitorCallback): DemonitorFunction;
  add(object: StoredObject, options?: AddOptions): Promise<string>;
  read(objectId: string): Promise<StoredObject | undefined>;
  readMetadata(objectId: string): Promise<ObjectMetadata | undefined>;
  readData(objectId: string): Promise<ObjectData | undefined>;
  genId(): string;
}

export interface ObjectMetadata {
  [key: string]: any;
}

export interface ObjectData {
  [key: string]: any;
}

export interface StoredObject {
  metadata: ObjectMetadata;
  data: ObjectData;
}

export interface ObjectWithId extends StoredObject {
  id: string;
}

export type MonitorCallback = (objects: ObjectWithId[]) => void;

export type DemonitorFunction = () => void;
