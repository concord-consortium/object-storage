import { DemoObjectStorage } from '../demo-object-storage';
import { StoredObject, ObjectMetadataWithId, MonitorCallback } from '../types';

describe('DemoObjectStorage', () => {
  let storage: DemoObjectStorage;

  beforeEach(() => {
    storage = new DemoObjectStorage({ type: 'demo', version: 1 });
  });

  describe('constructor', () => {
    it('should create an instance with demo config', () => {
      expect(storage).toBeInstanceOf(DemoObjectStorage);
    });

    it('should throw an error if version is not 1', () => {
      expect(() => {
        new DemoObjectStorage({ type: 'demo', version: 2 } as any);
      }).toThrow('Unsupported config version: 2. Expected version 1.');
    });

    it('should throw an error if version is 0', () => {
      expect(() => {
        new DemoObjectStorage({ type: 'demo', version: 0 } as any);
      }).toThrow('Unsupported config version: 0. Expected version 1.');
    });
  });

  describe('add', () => {
    it('should add an object and return a unique ID', async () => {
      const object: StoredObject = {
        metadata: { name: 'test' },
        data: { value: 123 }
      };

      const id = await storage.add(object);

      expect(id).toBeDefined();
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });

    it('should generate unique IDs for multiple objects', async () => {
      const object1: StoredObject = {
        metadata: { name: 'test1' },
        data: { value: 1 }
      };
      const object2: StoredObject = {
        metadata: { name: 'test2' },
        data: { value: 2 }
      };

      const id1 = await storage.add(object1);
      const id2 = await storage.add(object2);

      expect(id1).not.toBe(id2);
    });

    it('should store the object so it can be retrieved', async () => {
      const object: StoredObject = {
        metadata: { name: 'test' },
        data: { value: 123 }
      };

      const id = await storage.add(object);
      const retrieved = await storage.read(id);

      expect(retrieved).toEqual(object);
    });

    it('should use provided ID when specified in options', async () => {
      const object: StoredObject = {
        metadata: { name: 'test' },
        data: { value: 123 }
      };
      const customId = 'custom-id-123';

      const id = await storage.add(object, { id: customId });

      expect(id).toBe(customId);
    });

    it('should store object with custom ID so it can be retrieved', async () => {
      const object: StoredObject = {
        metadata: { name: 'test' },
        data: { value: 456 }
      };
      const customId = 'my-custom-id';

      const id = await storage.add(object, { id: customId });
      const retrieved = await storage.read(id);

      expect(retrieved).toEqual(object);
    });

    it('should generate ID when options is empty object', async () => {
      const object: StoredObject = {
        metadata: { name: 'test' },
        data: { value: 789 }
      };

      const id = await storage.add(object, {});

      expect(id).toBeDefined();
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });
  });

  describe('read', () => {
    it('should return the stored object', async () => {
      const object: StoredObject = {
        metadata: { name: 'test' },
        data: { value: 123 }
      };

      const id = await storage.add(object);
      const result = await storage.read(id);

      expect(result).toEqual(object);
    });

    it('should return undefined for non-existent object', async () => {
      const result = await storage.read('non-existent-id');

      expect(result).toBeUndefined();
    });
  });

  describe('readMetadata', () => {
    it('should return only the metadata', async () => {
      const object: StoredObject = {
        metadata: { name: 'test', type: 'demo' },
        data: { value: 123 }
      };

      const id = await storage.add(object);
      const metadata = await storage.readMetadata(id);

      expect(metadata).toEqual(object.metadata);
      expect(metadata).not.toHaveProperty('data');
    });

    it('should return undefined for non-existent object', async () => {
      const result = await storage.readMetadata('non-existent-id');

      expect(result).toBeUndefined();
    });
  });

  describe('readData', () => {
    it('should return only the data', async () => {
      const object: StoredObject = {
        metadata: { name: 'test' },
        data: { value: 123, nested: { prop: 'value' } }
      };

      const id = await storage.add(object);
      const data = await storage.readData(id);

      expect(data).toEqual(object.data);
    });

    it('should return undefined for non-existent object', async () => {
      const result = await storage.readData('non-existent-id');

      expect(result).toBeUndefined();
    });
  });

  describe('list', () => {
    it('should return an empty array when no objects exist', async () => {
      const result = await storage.list('q1');

      expect(result).toEqual([]);
    });

    it('should return metadata for all stored objects with IDs', async () => {
      const object1: StoredObject = {
        metadata: { name: 'test1' },
        data: { value: 1 }
      };
      const object2: StoredObject = {
        metadata: { name: 'test2' },
        data: { value: 2 }
      };

      const id1 = await storage.add(object1);
      const id2 = await storage.add(object2);

      const result = await storage.list('q1');

      expect(result).toHaveLength(2);
      expect(result).toEqual(
        expect.arrayContaining([
          { id: id1, metadata: object1.metadata },
          { id: id2, metadata: object2.metadata }
        ])
      );
    });
  });

  describe('list with different question IDs', () => {
    it('should return all objects regardless of question ID in demo mode', async () => {
      const object1: StoredObject = {
        metadata: { name: 'test1' },
        data: { value: 1 }
      };
      const object2: StoredObject = {
        metadata: { name: 'test2' },
        data: { value: 2 }
      };

      await storage.add(object1);
      await storage.add(object2);

      const result = await storage.list('q1');

      expect(result).toHaveLength(2);
    });
  });



  describe('monitor', () => {
    it('should invoke callback immediately with current state', async () => {
      const object: StoredObject = {
        metadata: { name: 'test' },
        data: { value: 123 }
      };
      const id = await storage.add(object);

      const callback = jest.fn<void, [ObjectMetadataWithId[]]>();
      storage.monitor('q1', callback);

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id,
            metadata: object.metadata
          })
        ])
      );
    });

    it('should invoke callback when new objects are added', async () => {
      const callback = jest.fn<void, [ObjectMetadataWithId[]]>();
      storage.monitor('q1', callback);

      expect(callback).toHaveBeenCalledTimes(1);

      const object: StoredObject = {
        metadata: { name: 'test' },
        data: { value: 123 }
      };
      await storage.add(object);

      expect(callback).toHaveBeenCalledTimes(2);
    });

    it('should stop monitoring when demonitor function is called', async () => {
      const callback = jest.fn<void, [ObjectMetadataWithId[]]>();
      const demonitor = storage.monitor('q1', callback);

      expect(callback).toHaveBeenCalledTimes(1);

      demonitor();

      const object: StoredObject = {
        metadata: { name: 'test' },
        data: { value: 123 }
      };
      await storage.add(object);

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should support different question IDs as separate monitors', async () => {
      const callback1 = jest.fn<void, [ObjectMetadataWithId[]]>();
      const callback2 = jest.fn<void, [ObjectMetadataWithId[]]>();

      storage.monitor('q1', callback1);
      storage.monitor('q2', callback2);

      const object: StoredObject = {
        metadata: { name: 'test' },
        data: { value: 123 }
      };
      await storage.add(object);

      expect(callback1).toHaveBeenCalledTimes(2);
      expect(callback2).toHaveBeenCalledTimes(2);
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

    it('should generate IDs that can be used with add method', async () => {
      const customId = storage.genId();
      const object: StoredObject = {
        metadata: { name: 'test' },
        data: { value: 123 }
      };

      const id = await storage.add(object, { id: customId });
      const retrieved = await storage.read(id);

      expect(id).toBe(customId);
      expect(retrieved).toEqual(object);
    });
  });

  describe('integration tests', () => {
    it('should handle complete workflow', async () => {
      // Start monitoring
      const callback = jest.fn<void, [ObjectMetadataWithId[]]>();
      const demonitor = storage.monitor('q1', callback);

      // Add objects
      const obj1: StoredObject = {
        metadata: { type: 'image', name: 'photo1' },
        data: { url: 'http://example.com/photo1.jpg' }
      };
      const obj2: StoredObject = {
        metadata: { type: 'text', name: 'note1' },
        data: { content: 'Hello world' }
      };

      const id1 = await storage.add(obj1);
      const id2 = await storage.add(obj2);

      // List all
      const allObjects = await storage.list('q1');
      expect(allObjects).toHaveLength(2);

      // Read individual objects
      const retrieved1 = await storage.read(id1);
      expect(retrieved1).toEqual(obj1);

      const metadata2 = await storage.readMetadata(id2);
      expect(metadata2).toEqual(obj2.metadata);

      const data2 = await storage.readData(id2);
      expect(data2).toEqual(obj2.data);

      // Verify monitor was called
      expect(callback).toHaveBeenCalledTimes(3); // Initial + 2 adds

      // Stop monitoring
      demonitor();

      // Add another object - should not trigger callback
      await storage.add({ metadata: {}, data: {} });
      expect(callback).toHaveBeenCalledTimes(3);
    });

    it('should handle empty metadata and data', async () => {
      const object: StoredObject = {
        metadata: {},
        data: {}
      };

      const id = await storage.add(object);
      const retrieved = await storage.read(id);

      expect(retrieved).toEqual(object);
    });

    it('should handle complex nested objects', async () => {
      const object: StoredObject = {
        metadata: {
          name: 'complex',
          tags: ['tag1', 'tag2'],
          properties: {
            nested: {
              deep: {
                value: 'test'
              }
            }
          }
        },
        data: {
          items: [1, 2, 3],
          map: {
            key1: { value: 'a' },
            key2: { value: 'b' }
          }
        }
      };

      const id = await storage.add(object);
      const retrieved = await storage.read(id);

      expect(retrieved).toEqual(object);
    });
  });
});
