export interface DemoObjectStorageConfig {
  version: 1;
  type: "demo";
}

export interface AuthenticatedUser {
  type: "authenticated";
  jwt: string;
  contextId: string;
  platformId: string;
  resourceLinkId: string;
  platformUserId: string;
}

export interface AnonymousUser {
  type: "anonymous";
  runKey: string;
}

export type FirebaseObjectStorageUser = AuthenticatedUser | AnonymousUser;

export interface FirebaseObjectStorageConfig {
  version: 1;
  type: "firebase";
  app: Object;
  root: string;
  user: FirebaseObjectStorageUser;
  questionId: string;
};

export type ObjectStorageConfig = DemoObjectStorageConfig | FirebaseObjectStorageConfig;

export interface AddOptions {
  id?: string;
}

export interface IObjectStorage {
  list(questionOrRefId: string): Promise<ObjectMetadataWithId[]>;
  monitor(questionOrRefId: string, callback: MonitorCallback): DemonitorFunction;
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

export interface ObjectMetadataWithId {
  id: string;
  metadata: ObjectMetadata;
}

export interface ObjectDataWithId {
  id: string;
  data: ObjectData;
}

export interface ObjectWithId {
  id: string;
  metadata: ObjectMetadata;
  data: ObjectData;
}

export type MonitorCallback = (objects: ObjectMetadataWithId[]) => void;

export type DemonitorFunction = () => void;
