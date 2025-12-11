import { DemoObjectStorage } from '../demo-object-storage';
import { StoredObjectMetadataWithId, MonitorCallback } from '../types';
import { StoredObject } from '../stored-object';

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
    it('should add a StoredObject and return a unique ID', async () => {
      const object = new StoredObject({ name: 'Test Object' });
      object.addText({ name: 'note', text: 'Hello world' });

      const result = await storage.add(object);

      expect(result.id).toBeDefined();
      expect(typeof result.id).toBe('string');
      expect(result.id.length).toBeGreaterThan(0);
    });

    it('should generate unique IDs for multiple objects', async () => {
      const object1 = new StoredObject({ name: 'Object 1' });
      object1.addText({ name: 'text1', text: 'First' });

      const object2 = new StoredObject({ name: 'Object 2' });
      object2.addText({ name: 'text2', text: 'Second' });

      const result1 = await storage.add(object1);
      const result2 = await storage.add(object2);

      expect(result1.id).not.toBe(result2.id);
    });

    it('should store the object so it can be retrieved', async () => {
      const object = new StoredObject({ name: 'Test' });
      object.addImage({ id: 'photo', name: 'photo', url: 'https://example.com/photo.jpg', width: 800, height: 600 });

      const result = await storage.add(object);
      const retrieved = await storage.read(result.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.metadata.name).toBe('Test');
      expect(retrieved?.metadata.items['photo']).toBeDefined();
    });

    it('should use object.id from the stored object', async () => {
      const customId = 'custom-id-123';
      const object = new StoredObject({ id: customId });
      object.addText({ name: 'test', text: 'content' });

      const result = await storage.add(object);

      expect(result.id).toBe(customId);
    });

    it('should use object.id when specified in constructor', async () => {
      const object = new StoredObject({ id: 'object-generated-id' });
      object.addText({ name: 'test', text: 'content' });

      const result = await storage.add(object);

      expect(result.id).toBe('object-generated-id');
    });
  });

  describe('read', () => {
    it('should return the stored StoredObject', async () => {
      const object = new StoredObject({ name: 'Test Object', description: 'A test' });
      object.addText({ name: 'note', text: 'Test content' });

      const result = await storage.add(object);
      const retrieved = await storage.read(result.id);

      expect(retrieved).toBeInstanceOf(StoredObject);
      expect(retrieved?.id).toBe(result.id);
      expect(retrieved?.metadata.name).toBe('Test Object');
      expect(retrieved?.metadata.description).toBe('A test');
    });

    it('should return undefined for non-existent object', async () => {
      const result = await storage.read('non-existent-id');

      expect(result).toBeUndefined();
    });

    it('should preserve all stored items', async () => {
      const object = new StoredObject({ name: 'Multi-item Object' });
      object.addImage({ id: 'photo', name: 'photo', url: 'https://example.com/photo.jpg' });
      object.addText({ id: 'caption', name: 'caption', text: 'A beautiful photo' });
      object.addDataTable({ id: 'data', name: 'data', cols: ['A', 'B'], rows: [[1, 2], [3, 4]] });

      const result = await storage.add(object);
      const retrieved = await storage.read(result.id);

      expect(Object.keys(retrieved?.metadata.items || {})).toHaveLength(3);
      expect(retrieved?.metadata.items['photo']).toBeDefined();
      expect(retrieved?.metadata.items['caption']).toBeDefined();
      expect(retrieved?.metadata.items['data']).toBeDefined();
    });
  });

  describe('readMetadata', () => {
    it('should return only the metadata', async () => {
      const object = new StoredObject({ name: 'Test', description: 'Description', type: 'simulation-recording', subType: 'test-subtype' });
      object.addText({ name: 'text', text: 'content' });

      const result = await storage.add(object);
      const metadata = await storage.readMetadata(result.id);

      expect(metadata).toBeDefined();
      expect(metadata?.version).toBe(1);
      expect(metadata?.type).toBe('simulation-recording');
      expect(metadata?.name).toBe('Test');
      expect(metadata?.description).toBe('Description');
      expect(metadata?.subType).toBe('test-subtype');
    });

    it('should return undefined for non-existent object', async () => {
      const result = await storage.readMetadata('non-existent-id');

      expect(result).toBeUndefined();
    });

    it('should include all metadata items', async () => {
      const object = new StoredObject();
      object.addImage({ name: 'img1', url: 'url1', width: 100, height: 100 });
      object.addImage({ name: 'img2', url: 'url2', width: 200, height: 200 });

      const result = await storage.add(object);
      const metadata = await storage.readMetadata(result.id);

      expect(metadata?.items).toBeDefined();
      expect(Object.keys(metadata?.items || {})).toHaveLength(2);
    });
  });

  describe('readData', () => {
    it('should return only the data', async () => {
      const object = new StoredObject();
      object.addText({ id: 'note', name: 'note', text: 'My note content' });
      object.addImage({ id: 'photo', name: 'photo', url: 'https://example.com/photo.jpg' });

      const result = await storage.add(object);
      const data = await storage.readData(result.id);

      expect(data).toBeDefined();
      expect(data?.['note']).toEqual({ text: 'My note content' });
      expect(data?.['photo']).toEqual({ url: 'https://example.com/photo.jpg' });
    });

    it('should return undefined for non-existent object', async () => {
      const result = await storage.readData('non-existent-id');

      expect(result).toBeUndefined();
    });

    it('should handle complex data structures', async () => {
      const object = new StoredObject();
      object.addDataTable({
        id: 'table',
        name: 'table',
        cols: ['X', 'Y', 'Z'],
        rows: [[1, 2, 3], [4, 5, 6], [7, 8, 9]]
      });

      const result = await storage.add(object);
      const data = await storage.readData(result.id);

      expect(data?.['table'].rows).toBeDefined();
      expect(Object.keys(data?.['table'].rows || {})).toHaveLength(3);
    });
  });

  describe('list', () => {
    it('should return an empty array when no objects exist', async () => {
      const result = await storage.list('q1');

      expect(result).toEqual([]);
    });

    it('should return metadata for all stored objects with IDs', async () => {
      const object1 = new StoredObject({ name: 'Object 1' });
      object1.addText({ name: 'text', text: 'First' });

      const object2 = new StoredObject({ name: 'Object 2' });
      object2.addText({ name: 'text', text: 'Second' });

      const result1 = await storage.add(object1);
      const result2 = await storage.add(object2);

      const result = await storage.list('q1');

      expect(result).toHaveLength(2);
      expect(result.map(r => r.id)).toContain(result1.id);
      expect(result.map(r => r.id)).toContain(result2.id);
      expect(result[0].metadata.name).toBeDefined();
    });

    it('should return all objects regardless of question ID in demo mode', async () => {
      const object1 = new StoredObject();
      object1.addText({ name: 'text1', text: 'Content 1' });

      const object2 = new StoredObject();
      object2.addText({ name: 'text2', text: 'Content 2' });

      await storage.add(object1);
      await storage.add(object2);

      const resultQ1 = await storage.list('q1');
      const resultQ2 = await storage.list('q2');

      expect(resultQ1).toHaveLength(2);
      expect(resultQ2).toHaveLength(2);
    });
  });

  describe('monitor', () => {
    it('should invoke callback immediately with current state', async () => {
      const object = new StoredObject({ name: 'Test' });
      object.addText({ name: 'note', text: 'content' });
      const result = await storage.add(object);

      const callback = jest.fn<void, [StoredObjectMetadataWithId[]]>();
      storage.monitor('q1', callback);

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: result.id,
            metadata: expect.objectContaining({
              version: 1,
              type: 'untyped'
            })
          })
        ])
      );
    });

    it('should invoke callback when new objects are added', async () => {
      const callback = jest.fn<void, [StoredObjectMetadataWithId[]]>();
      storage.monitor('q1', callback);

      expect(callback).toHaveBeenCalledTimes(1);

      const object = new StoredObject();
      object.addText({ name: 'test', text: 'content' });
      await storage.add(object);

      expect(callback).toHaveBeenCalledTimes(2);
    });

    it('should stop monitoring when demonitor function is called', async () => {
      const callback = jest.fn<void, [StoredObjectMetadataWithId[]]>();
      const demonitor = storage.monitor('q1', callback);

      expect(callback).toHaveBeenCalledTimes(1);

      demonitor();

      const object = new StoredObject();
      object.addText({ name: 'test', text: 'content' });
      await storage.add(object);

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should notify all monitors when objects are added', async () => {
      const callback1 = jest.fn<void, [StoredObjectMetadataWithId[]]>();
      const callback2 = jest.fn<void, [StoredObjectMetadataWithId[]]>();

      storage.monitor('q1', callback1);
      storage.monitor('q2', callback2);

      const object = new StoredObject();
      object.addText({ name: 'test', text: 'content' });
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
      const object = new StoredObject({ id: customId });
      object.addText({ name: 'test', text: 'content' });

      const result = await storage.add(object);
      const retrieved = await storage.read(result.id);

      expect(result.id).toBe(customId);
      expect(retrieved).toBeDefined();
    });
  });

  describe('StoredObject integration', () => {
    it('should store and retrieve objects with images', async () => {
      const object = new StoredObject({ name: 'Photo Album' });
      object.addImage({
        id: 'photo1',
        name: 'photo1',
        url: 'https://example.com/photo1.jpg',
        width: 1920,
        height: 1080,
        description: 'A landscape photo'
      });
      object.addImage({
        id: 'photo2',
        name: 'photo2',
        url: 'https://example.com/photo2.jpg',
        width: 800,
        height: 600
      });

      const result = await storage.add(object);
      const retrieved = await storage.read(result.id);

      expect(retrieved?.metadata.items['photo1']).toEqual({
        type: 'image',
        name: 'photo1',
        width: 1920,
        height: 1080,
        description: 'A landscape photo'
      });
      expect(retrieved?.data['photo1']).toEqual({
        url: 'https://example.com/photo1.jpg'
      });
    });

    it('should store and retrieve objects with data tables', async () => {
      const object = new StoredObject({ name: 'Experiment Results' });
      object.addDataTable({
        id: 'results',
        name: 'results',
        cols: ['Trial', 'Value', 'Success'],
        rows: [
          [1, 42, true],
          [2, 38, false],
          [3, 45, true]
        ],
        description: 'Trial results'
      });

      const result = await storage.add(object);
      const retrieved = await storage.read(result.id);

      expect(retrieved?.metadata.items['results']).toEqual({
        type: 'dataTable',
        name: 'results',
        cols: ['Trial', 'Value', 'Success'],
        description: 'Trial results'
      });
      expect(retrieved?.data['results'].rows).toBeDefined();
    });

    it('should store and retrieve objects with text', async () => {
      const object = new StoredObject({ name: 'Notes' });
      object.addText({
        id: 'summary',
        name: 'summary',
        text: 'This is a summary of the findings.',
        description: 'Summary section',
        subType: 'markdown'
      });

      const result = await storage.add(object);
      const retrieved = await storage.read(result.id);

      expect(retrieved?.metadata.items['summary']).toEqual({
        type: 'text',
        name: 'summary',
        description: 'Summary section',
        subType: 'markdown'
      });
      expect(retrieved?.data['summary']).toEqual({
        text: 'This is a summary of the findings.'
      });
    });

    it('should store and retrieve objects with custom objects', async () => {
      const object = new StoredObject({ name: 'Settings' });
      object.addObject({
        id: 'config',
        name: 'config',
        data: {
          theme: 'dark',
          fontSize: 14,
          enabled: true,
          features: ['feature1', 'feature2']
        },
        description: 'User configuration'
      });

      const result = await storage.add(object);
      const retrieved = await storage.read(result.id);

      expect(retrieved?.metadata.items['config']).toEqual({
        type: 'object',
        name: 'config',
        keys: ['theme', 'fontSize', 'enabled', 'features'],
        description: 'User configuration'
      });
      expect(retrieved?.data['config']).toEqual({
        theme: 'dark',
        fontSize: 14,
        enabled: true,
        features: ['feature1', 'feature2']
      });
    });

    it('should handle mixed content types in one object', async () => {
      const object = new StoredObject({ name: 'Complete Report', description: 'Full report with all data' });

      object.addText({ id: 'title', name: 'title', text: 'Annual Report 2024' });
      object.addImage({ id: 'logo', name: 'logo', url: 'https://example.com/logo.png', width: 200, height: 100 });
      object.addDataTable({
        id: 'financials',
        name: 'financials',
        cols: ['Quarter', 'Revenue', 'Profit'],
        rows: [['Q1', 100000, 25000], ['Q2', 120000, 30000]]
      });
      object.addObject({ id: 'metadata', name: 'metadata', data: { author: 'John Doe', date: '2024-12-31' } });

      const result = await storage.add(object);
      const retrieved = await storage.read(result.id);

      expect(Object.keys(retrieved?.metadata.items || {})).toHaveLength(4);
      expect(retrieved?.metadata.items['title']?.type).toBe('text');
      expect(retrieved?.metadata.items['logo']?.type).toBe('image');
      expect(retrieved?.metadata.items['financials']?.type).toBe('dataTable');
      expect(retrieved?.metadata.items['metadata']?.type).toBe('object');
    });

    it('should handle empty StoredObjects', async () => {
      const object = new StoredObject({ name: 'Empty' });

      const result = await storage.add(object);
      const retrieved = await storage.read(result.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.metadata.version).toBe(1);
      expect(retrieved?.metadata.type).toBe('untyped');
      expect(Object.keys(retrieved?.metadata.items || {})).toHaveLength(0);
      expect(Object.keys(retrieved?.data || {})).toHaveLength(0);
    });
  });
});
