import {
  ObjectStorageConfig,
  IObjectStorage
} from './types';
import { DemoObjectStorage } from './demo-object-storage';
import { FirebaseObjectStorage } from './firebase-object-storage';

/**
 * Factory function to create the appropriate ObjectStorage instance based on config type
 */
export function createObjectStorage(config?: ObjectStorageConfig): IObjectStorage {
  if (!config) {
    throw new Error('ObjectStorageConfig is required to create an ObjectStorage instance');
  }

  switch (config.type) {
    case "demo":
      return new DemoObjectStorage(config);
    case "firebase":
      return new FirebaseObjectStorage(config);
    default:
      // TypeScript exhaustiveness check
      const _exhaustive: never = config;
      throw new Error(`Unknown config type: ${(_exhaustive as any).type}`);
  }
}
