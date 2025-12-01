import { FirebaseObjectStorage } from '../firebase-object-storage';

describe('FirebaseObjectStorage', () => {
  let storage: FirebaseObjectStorage;

  beforeEach(() => {
    storage = new FirebaseObjectStorage({ type: 'firebase', version: 1 });
  });

  describe('constructor', () => {
    it('should create an instance with firebase config', () => {
      const storage = new FirebaseObjectStorage({ type: 'firebase', version: 1 });
      expect(storage).toBeInstanceOf(FirebaseObjectStorage);
    });

    it('should throw an error if version is not 1', () => {
      expect(() => {
        new FirebaseObjectStorage({ type: 'firebase', version: 2 } as any);
      }).toThrow('Unsupported config version: 2. Expected version 1.');
    });

    it('should throw an error if version is 0', () => {
      expect(() => {
        new FirebaseObjectStorage({ type: 'firebase', version: 0 } as any);
      }).toThrow('Unsupported config version: 0. Expected version 1.');
    });
  });

  describe('genId', () => {
    it('should generate a unique ID', () => {
      const id = storage.genId();

      expect(id).toBeDefined();
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });

    it('should generate different IDs on subsequent calls', () => {
      const id1 = storage.genId();
      const id2 = storage.genId();
      const id3 = storage.genId();

      expect(id1).not.toBe(id2);
      expect(id2).not.toBe(id3);
      expect(id1).not.toBe(id3);
    });
  });
});
