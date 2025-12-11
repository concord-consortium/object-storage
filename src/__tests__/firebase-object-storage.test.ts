import { FirebaseObjectStorage } from '../firebase-object-storage';
import { FirebaseObjectStorageConfig } from '../types';

// Mock firebase before importing
jest.mock('firebase/compat/app', () => {
  const mockFirestore = jest.fn(() => ({
    settings: jest.fn(),
    collection: jest.fn(),
    doc: jest.fn(),
  }));

  const mockAuth = jest.fn(() => ({
    signOut: jest.fn().mockResolvedValue(undefined),
    signInWithCustomToken: jest.fn().mockResolvedValue(undefined),
  }));

  const mockApp = {
    firestore: mockFirestore,
    auth: mockAuth,
  };

  return {
    __esModule: true,
    default: {
      initializeApp: jest.fn(() => mockApp),
    },
  };
});

describe('FirebaseObjectStorage', () => {
  let storage: FirebaseObjectStorage;
  let mockConfig: FirebaseObjectStorageConfig;

  beforeEach(() => {
    mockConfig = {
      type: 'firebase',
      version: 1,
      app: { projectId: 'test-project' },
      root: '/test',
      questionId: 'test_question_1',
      user: {
        type: 'anonymous',
        runKey: 'test-run-key'
      }
    };
    storage = new FirebaseObjectStorage(mockConfig);
  });

  describe('constructor', () => {
    it('should create an instance with firebase config', () => {
      const storage = new FirebaseObjectStorage(mockConfig);
      expect(storage).toBeInstanceOf(FirebaseObjectStorage);
    });

    it('should throw an error if version is not 1', () => {
      expect(() => {
        new FirebaseObjectStorage({ ...mockConfig, version: 2 } as any);
      }).toThrow('Unsupported config version: 2. Expected version 1.');
    });

    it('should throw an error if version is 0', () => {
      expect(() => {
        new FirebaseObjectStorage({ ...mockConfig, version: 0 } as any);
      }).toThrow('Unsupported config version: 0. Expected version 1.');
    });
  });
});
