export interface DemoObjectStorageConfig {
  version: 1;
  type: "demo";
}

export interface AuthenticatedUser {
  type: "authenticated";
  jwt: string;
  contextId: string;
  platformId: string;
  platformUserId: string;
  resourceLinkId: string;
}

export interface AnonymousUser {
  type: "anonymous";
  runKey: string;
}

export type FirebaseObjectStorageUser = AuthenticatedUser | AnonymousUser;

export interface FirebaseObjectStorageConfig {
  version: 1;
  type: "firebase";
  app: any; // TODO: replace with Firebase App type
  root: string;
  user: FirebaseObjectStorageUser;
};

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
