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

// Import StoredObject types
import { StoredObject, StoredObjectMetadata, StoredObjectData } from './stored-object';

export interface IObjectStorage {
  list(questionOrRefId: string): Promise<ObjectMetadataWithId[]>;
  monitor(questionOrRefId: string, callback: MonitorCallback): DemonitorFunction;
  add(object: StoredObject, options?: AddOptions): Promise<string>;
  read(objectId: string): Promise<StoredObject | undefined>;
  readMetadata(objectId: string): Promise<StoredObjectMetadata | undefined>;
  readData(objectId: string): Promise<StoredObjectData | undefined>;
  genId(): string;
}

export interface ObjectMetadataWithId {
  id: string;
  metadata: StoredObjectMetadata;
}

export interface ObjectDataWithId {
  id: string;
  data: StoredObjectData;
}

export interface ObjectWithId {
  id: string;
  metadata: StoredObjectMetadata;
  data: StoredObjectData;
}

export type MonitorCallback = (objects: ObjectMetadataWithId[]) => void;

export type DemonitorFunction = () => void;
