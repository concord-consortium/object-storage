import { FirebaseObjectStorage } from '../firebase-object-storage';

describe('FirebaseObjectStorage', () => {
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
});
