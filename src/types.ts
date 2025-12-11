import { StoredObject, StoredObjectMetadata, StoredObjectData } from './stored-object';
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

export interface IObjectStorage {
  list(questionOrRefId: string): Promise<StoredObjectMetadataWithId[]>;
  monitor(questionOrRefId: string, callback: MonitorCallback): DemonitorFunction;
  add(object: StoredObject): Promise<StoredObject>;
  read(objectId: string): Promise<StoredObject | undefined>;
  readMetadata(objectId: string): Promise<StoredObjectMetadata | undefined>;
  readData(objectId: string): Promise<StoredObjectData | undefined>;
  readDataItem(objectId: string, itemId: string): Promise<any | undefined>;
}

export interface StoredObjectMetadataWithId {
  id: string;
  metadata: StoredObjectMetadata;
}

export interface StoredObjectDataWithId {
  id: string;
  data: StoredObjectData;
}

export interface StoredObjectWithId {
  id: string;
  metadata: StoredObjectMetadata;
  data: StoredObjectData;
}

export type MonitorCallback = (objects: StoredObjectMetadataWithId[]) => void;

export type DemonitorFunction = () => void;
