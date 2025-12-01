import { TypedObject } from "../typed-object";
import { StoredObject } from "../types";

describe("TypedObject", () => {
  describe("constructor", () => {
    it("should create a TypedObject with a generated id when no id is provided", () => {
      const obj = new TypedObject();

      expect(obj.id).toBeDefined();
      expect(typeof obj.id).toBe("string");
      expect(obj.id.length).toBeGreaterThan(0);
    });

    it("should create a TypedObject with the provided id", () => {
      const customId = "custom-id-123";
      const obj = new TypedObject({ id: customId });

      expect(obj.id).toBe(customId);
    });

    it("should initialize with default metadata structure", () => {
      const obj = new TypedObject();

      expect(obj.metadata).toEqual({
        version: 1,
        type: "typed",
        items: {},
      });
    });

    it("should include name in metadata when provided", () => {
      const obj = new TypedObject({ name: "Test Object" });

      expect(obj.metadata.name).toBe("Test Object");
    });

    it("should include description in metadata when provided", () => {
      const obj = new TypedObject({ description: "Test description" });

      expect(obj.metadata.description).toBe("Test description");
    });

    it("should include both name and description when provided", () => {
      const obj = new TypedObject({
        name: "Test Object",
        description: "Test description"
      });

      expect(obj.metadata.name).toBe("Test Object");
      expect(obj.metadata.description).toBe("Test description");
    });

    it("should initialize with empty data object", () => {
      const obj = new TypedObject();

      expect(obj.data).toEqual({});
    });
  });

  describe("FromStoredObject", () => {
    it("should create a TypedObject from a valid StoredObject", () => {
      const storedObject: StoredObject = {
        metadata: {
          version: 1,
          type: "typed",
          items: {},
        } as const,
        data: {},
      };

      const obj = TypedObject.FromStoredObject("test-id", storedObject);

      expect(obj).toBeInstanceOf(TypedObject);
      expect(obj.id).toBe("test-id");
      expect(obj.metadata).toEqual(storedObject.metadata);
      expect(obj.data).toEqual(storedObject.data);
    });

    it("should restore a TypedObject with all item types", () => {
      const storedObject: StoredObject = {
        metadata: {
          version: 1,
          type: "typed",
          name: "Test Object",
          description: "A complex test object",
          items: {
            "img-1": {
              type: "image",
              name: "Test Image",
              width: 800,
              height: 600,
            },
            "table-1": {
              type: "dataTable",
              name: "Test Table",
              cols: ["A", "B"],
            },
            "text-1": {
              type: "text",
              name: "Test Text",
            },
            "obj-1": {
              type: "object",
              name: "Test Object",
              keys: ["x", "y"],
            },
          },
        } as const,
        data: {
          "img-1": { url: "https://example.com/image.jpg" },
          "table-1": { rows: [[1, 2], [3, 4]] },
          "text-1": { text: "Hello, world!" },
          "obj-1": { x: 10, y: 20 },
        },
      };

      const obj = TypedObject.FromStoredObject("complex-id", storedObject);

      expect(obj.id).toBe("complex-id");
      expect(obj.metadata.name).toBe("Test Object");
      expect(obj.metadata.description).toBe("A complex test object");
      expect(Object.keys(obj.metadata.items).length).toBe(4);
      expect(obj.metadata.items["img-1"]).toEqual(storedObject.metadata.items["img-1"]);
      expect(obj.metadata.items["table-1"]).toEqual(storedObject.metadata.items["table-1"]);
      expect(obj.metadata.items["text-1"]).toEqual(storedObject.metadata.items["text-1"]);
      expect(obj.metadata.items["obj-1"]).toEqual(storedObject.metadata.items["obj-1"]);
      expect(obj.data).toEqual(storedObject.data);
    });

    it("should throw an error if metadata is missing", () => {
      const storedObject: Omit<StoredObject, "metadata"> = {
        data: {},
      };

      expect(() => {
        TypedObject.FromStoredObject("test-id", storedObject as any);
      }).toThrow("Invalid or unsupported TypedObject");
    });

    it("should throw an error if metadata type is not 'typed'", () => {
      const storedObject: StoredObject = {
        metadata: {
          version: 1,
          type: "other",
          items: {},
        },
        data: {},
      };

      expect(() => {
        TypedObject.FromStoredObject("test-id", storedObject as any);
      }).toThrow("Invalid or unsupported TypedObject");
    });

    it("should throw an error if metadata version is greater than 1", () => {
      const storedObject: StoredObject = {
        metadata: {
          version: 2,
          type: "typed",
          items: {},
        },
        data: {},
      };

      expect(() => {
        TypedObject.FromStoredObject("test-id", storedObject as any);
      }).toThrow("Invalid or unsupported TypedObject");
    });

    it("should handle version 1 metadata", () => {
      const storedObject: StoredObject = {
        metadata: {
          version: 1,
          type: "typed",
          items: {},
        } as const,
        data: {},
      };

      const obj = TypedObject.FromStoredObject("test-id", storedObject);

      expect(obj.metadata.version).toBe(1);
    });

    it("should preserve all optional metadata fields", () => {
      const storedObject: StoredObject = {
        metadata: {
          version: 1,
          type: "typed",
          name: "My Object",
          description: "My Description",
          items: {
            "item-1": {
              type: "text",
              name: "Text Item",
              description: "Item description",
              subType: "markdown",
            },
          },
        } as const,
        data: {
          "item-1": { text: "Content" },
        },
      };

      const obj = TypedObject.FromStoredObject("test-id", storedObject);

      expect(obj.metadata.name).toBe("My Object");
      expect(obj.metadata.description).toBe("My Description");
      const item = obj.metadata.items["item-1"];
      if (item.type === "text") {
        expect(item.description).toBe("Item description");
        expect(item.subType).toBe("markdown");
      }
    });

    it("should restore data references correctly", () => {
      const dataObject = { nested: { value: 123 }, array: [1, 2, 3] };
      const storedObject: StoredObject = {
        metadata: {
          version: 1,
          type: "typed",
          items: {
            "obj-1": {
              type: "object",
              name: "Complex Object",
              keys: ["nested", "array"],
            },
          },
        } as const,
        data: {
          "obj-1": dataObject,
        },
      };

      const obj = TypedObject.FromStoredObject("test-id", storedObject);

      expect(obj.data["obj-1"]).toEqual(dataObject);
      expect(obj.data["obj-1"].nested.value).toBe(123);
      expect(obj.data["obj-1"].array).toEqual([1, 2, 3]);
    });
  });

  describe("IsSupportedTypedObject", () => {
    it("should return true for a valid typed object with version 1", () => {
      const storedObject: StoredObject = {
        metadata: {
          version: 1,
          type: "typed",
          items: {},
        },
        data: {},
      };

      expect(TypedObject.IsSupportedTypedObject(storedObject)).toBe(true);
    });

    it("should return false if metadata is undefined", () => {
      const storedObject = {
        data: {},
      } as StoredObject;

      expect(TypedObject.IsSupportedTypedObject(storedObject)).toBe(false);
    });

    it("should return false if metadata type is not 'typed'", () => {
      const storedObject: StoredObject = {
        metadata: {
          version: 1,
          type: "other",
          items: {},
        } as any,
        data: {},
      };

      expect(TypedObject.IsSupportedTypedObject(storedObject)).toBe(false);
    });

    it("should return false if metadata version is greater than 1", () => {
      const storedObject: StoredObject = {
        metadata: {
          version: 2,
          type: "typed",
          items: {},
        } as any,
        data: {},
      };

      expect(TypedObject.IsSupportedTypedObject(storedObject)).toBe(false);
    });

    it("should return false if metadata version is missing", () => {
      const storedObject: StoredObject = {
        metadata: {
          type: "typed",
          items: {},
        } as any,
        data: {},
      };

      expect(TypedObject.IsSupportedTypedObject(storedObject)).toBe(false);
    });

    it("should return false if metadata version is not a number", () => {
      const storedObject: StoredObject = {
        metadata: {
          version: "1" as any,
          type: "typed",
          items: {},
        } as any,
        data: {},
      };

      expect(TypedObject.IsSupportedTypedObject(storedObject)).toBe(false);
    });

    it("should return false for version 0", () => {
      const storedObject: StoredObject = {
        metadata: {
          version: 0,
          type: "typed",
          items: {},
        } as any,
        data: {},
      };

      expect(TypedObject.IsSupportedTypedObject(storedObject)).toBe(false);
    });

    it("should return false for negative version numbers", () => {
      const storedObject: StoredObject = {
        metadata: {
          version: -1,
          type: "typed",
          items: {},
        } as any,
        data: {},
      };

      expect(TypedObject.IsSupportedTypedObject(storedObject)).toBe(false);
    });

    it("should return false for version 1.5", () => {
      const storedObject: StoredObject = {
        metadata: {
          version: 1.5,
          type: "typed",
          items: {},
        } as any,
        data: {},
      };

      expect(TypedObject.IsSupportedTypedObject(storedObject)).toBe(false);
    });

    it("should return false when all conditions fail", () => {
      const storedObject: StoredObject = {
        metadata: {
          version: 100,
          type: "wrong-type",
        } as any,
        data: {},
      };

      expect(TypedObject.IsSupportedTypedObject(storedObject)).toBe(false);
    });
  });

  describe("IsSupportedTypedObjectMetadata", () => {
    it("should return true for valid typed metadata with version 1", () => {
      const metadata = {
        version: 1,
        type: "typed",
        items: {},
      } as const;

      expect(TypedObject.IsSupportedTypedObjectMetadata(metadata)).toBe(true);
    });

    it("should return true for typed metadata with items and optional fields", () => {
      const metadata = {
        version: 1,
        type: "typed",
        name: "Test Object",
        description: "Test description",
        items: {
          "item-1": {
            type: "text",
            name: "Text Item",
          },
        },
      } as const;

      expect(TypedObject.IsSupportedTypedObjectMetadata(metadata)).toBe(true);
    });

    it("should return false if metadata is undefined", () => {
      expect(TypedObject.IsSupportedTypedObjectMetadata(undefined)).toBe(false);
    });

    it("should return false if metadata type is not 'typed'", () => {
      const metadata = {
        version: 1,
        type: "other",
        items: {},
      } as any;

      expect(TypedObject.IsSupportedTypedObjectMetadata(metadata)).toBe(false);
    });

    it("should return false if metadata version is greater than 1", () => {
      const metadata = {
        version: 2,
        type: "typed",
        items: {},
      } as any;

      expect(TypedObject.IsSupportedTypedObjectMetadata(metadata)).toBe(false);
    });

    it("should return false if metadata version is missing", () => {
      const metadata = {
        type: "typed",
        items: {},
      } as any;

      expect(TypedObject.IsSupportedTypedObjectMetadata(metadata)).toBe(false);
    });

    it("should return false if metadata version is not a number", () => {
      const metadata = {
        version: "1",
        type: "typed",
        items: {},
      } as any;

      expect(TypedObject.IsSupportedTypedObjectMetadata(metadata)).toBe(false);
    });

    it("should return false for version 0", () => {
      const metadata = {
        version: 0,
        type: "typed",
        items: {},
      } as any;

      expect(TypedObject.IsSupportedTypedObjectMetadata(metadata)).toBe(false);
    });

    it("should return false for negative version numbers", () => {
      const metadata = {
        version: -1,
        type: "typed",
        items: {},
      } as any;

      expect(TypedObject.IsSupportedTypedObjectMetadata(metadata)).toBe(false);
    });

    it("should return false for version 1.5", () => {
      const metadata = {
        version: 1.5,
        type: "typed",
        items: {},
      } as any;

      expect(TypedObject.IsSupportedTypedObjectMetadata(metadata)).toBe(false);
    });

    it("should return false when type is missing", () => {
      const metadata = {
        version: 1,
        items: {},
      } as any;

      expect(TypedObject.IsSupportedTypedObjectMetadata(metadata)).toBe(false);
    });

    it("should return false for empty object", () => {
      const metadata = {} as any;

      expect(TypedObject.IsSupportedTypedObjectMetadata(metadata)).toBe(false);
    });

    it("should return false when all conditions fail", () => {
      const metadata = {
        version: 100,
        type: "wrong-type",
      } as any;

      expect(TypedObject.IsSupportedTypedObjectMetadata(metadata)).toBe(false);
    });
  });

  describe("addImage", () => {
    it("should add an image with required fields only", () => {
      const obj = new TypedObject();

      obj.addImage({
        name: "Test Image",
        url: "https://example.com/image.jpg"
      });

      const itemId = Object.keys(obj.metadata.items)[0];
      expect(itemId).toBeDefined();
      expect(obj.metadata.items[itemId]).toEqual({
        type: "image",
        name: "Test Image"
      });
      expect(obj.data[itemId]).toEqual({
        url: "https://example.com/image.jpg"
      });
    });

    it("should add an image with custom id", () => {
      const obj = new TypedObject();
      const customId = "image-1";

      obj.addImage({
        id: customId,
        name: "Test Image",
        url: "https://example.com/image.jpg"
      });

      expect(obj.metadata.items[customId]).toBeDefined();
      expect(obj.data[customId]).toBeDefined();
    });

    it("should add an image with all optional fields", () => {
      const obj = new TypedObject();

      obj.addImage({
        name: "Test Image",
        url: "https://example.com/image.jpg",
        width: 800,
        height: 600,
        description: "A test image",
        subType: "photo"
      });

      const itemId = Object.keys(obj.metadata.items)[0];
      expect(obj.metadata.items[itemId]).toEqual({
        type: "image",
        name: "Test Image",
        width: 800,
        height: 600,
        description: "A test image",
        subType: "photo"
      });
    });

    it("should add multiple images", () => {
      const obj = new TypedObject();

      obj.addImage({
        name: "Image 1",
        url: "https://example.com/image1.jpg"
      });

      obj.addImage({
        name: "Image 2",
        url: "https://example.com/image2.jpg"
      });

      expect(Object.keys(obj.metadata.items).length).toBe(2);
      expect(Object.keys(obj.data).length).toBe(2);
    });
  });

  describe("addDataTable", () => {
    it("should add a data table with required fields only", () => {
      const obj = new TypedObject();
      const cols = ["Name", "Age"];
      const rows = [["Alice", 30], ["Bob", 25]];

      obj.addDataTable({
        name: "Test Table",
        cols,
        rows
      });

      const itemId = Object.keys(obj.metadata.items)[0];
      expect(obj.metadata.items[itemId]).toEqual({
        type: "dataTable",
        name: "Test Table",
        cols
      });
      expect(obj.data[itemId]).toEqual({
        rows
      });
    });

    it("should add a data table with custom id", () => {
      const obj = new TypedObject();
      const customId = "table-1";

      obj.addDataTable({
        id: customId,
        name: "Test Table",
        cols: ["A", "B"],
        rows: [[1, 2]]
      });

      expect(obj.metadata.items[customId]).toBeDefined();
      expect(obj.data[customId]).toBeDefined();
    });

    it("should add a data table with all optional fields", () => {
      const obj = new TypedObject();

      obj.addDataTable({
        name: "Test Table",
        cols: ["X", "Y"],
        rows: [[1, 2], [3, 4]],
        description: "A test table",
        subType: "matrix"
      });

      const itemId = Object.keys(obj.metadata.items)[0];
      expect(obj.metadata.items[itemId]).toEqual({
        type: "dataTable",
        name: "Test Table",
        cols: ["X", "Y"],
        description: "A test table",
        subType: "matrix"
      });
    });

    it("should handle empty rows array", () => {
      const obj = new TypedObject();

      obj.addDataTable({
        name: "Empty Table",
        cols: ["A", "B", "C"],
        rows: []
      });

      const itemId = Object.keys(obj.metadata.items)[0];
      expect(obj.data[itemId].rows).toEqual([]);
    });

    it("should add multiple data tables", () => {
      const obj = new TypedObject();

      obj.addDataTable({
        name: "Table 1",
        cols: ["A"],
        rows: [[1]]
      });

      obj.addDataTable({
        name: "Table 2",
        cols: ["B"],
        rows: [[2]]
      });

      expect(Object.keys(obj.metadata.items).length).toBe(2);
      expect(Object.keys(obj.data).length).toBe(2);
    });
  });

  describe("addText", () => {
    it("should add text with required fields only", () => {
      const obj = new TypedObject();

      obj.addText({
        name: "Test Text",
        text: "Hello, world!"
      });

      const itemId = Object.keys(obj.metadata.items)[0];
      expect(obj.metadata.items[itemId]).toEqual({
        type: "text",
        name: "Test Text"
      });
      expect(obj.data[itemId]).toEqual({
        text: "Hello, world!"
      });
    });

    it("should add text with custom id", () => {
      const obj = new TypedObject();
      const customId = "text-1";

      obj.addText({
        id: customId,
        name: "Test Text",
        text: "Custom ID text"
      });

      expect(obj.metadata.items[customId]).toBeDefined();
      expect(obj.data[customId]).toBeDefined();
    });

    it("should add text with all optional fields", () => {
      const obj = new TypedObject();

      obj.addText({
        name: "Test Text",
        text: "Hello, world!",
        description: "A test text",
        subType: "markdown"
      });

      const itemId = Object.keys(obj.metadata.items)[0];
      expect(obj.metadata.items[itemId]).toEqual({
        type: "text",
        name: "Test Text",
        description: "A test text",
        subType: "markdown"
      });
    });

    it("should handle empty text", () => {
      const obj = new TypedObject();

      obj.addText({
        name: "Empty Text",
        text: ""
      });

      const itemId = Object.keys(obj.metadata.items)[0];
      expect(obj.data[itemId].text).toBe("");
    });

    it("should add multiple text items", () => {
      const obj = new TypedObject();

      obj.addText({
        name: "Text 1",
        text: "First text"
      });

      obj.addText({
        name: "Text 2",
        text: "Second text"
      });

      expect(Object.keys(obj.metadata.items).length).toBe(2);
      expect(Object.keys(obj.data).length).toBe(2);
    });
  });

  describe("addObject", () => {
    it("should add an object with required fields only", () => {
      const obj = new TypedObject();
      const data = { foo: "bar", baz: 42 };

      obj.addObject({
        name: "Test Object",
        data
      });

      const itemId = Object.keys(obj.metadata.items)[0];
      expect(obj.metadata.items[itemId]).toEqual({
        type: "object",
        name: "Test Object",
        keys: ["foo", "baz"]
      });
      expect(obj.data[itemId]).toEqual(data);
    });

    it("should add an object with custom id", () => {
      const obj = new TypedObject();
      const customId = "object-1";

      obj.addObject({
        id: customId,
        name: "Test Object",
        data: { test: true }
      });

      expect(obj.metadata.items[customId]).toBeDefined();
      expect(obj.data[customId]).toBeDefined();
    });

    it("should add an object with all optional fields", () => {
      const obj = new TypedObject();
      const data = { x: 1, y: 2 };

      obj.addObject({
        name: "Test Object",
        data,
        description: "A test object",
        subType: "point"
      });

      const itemId = Object.keys(obj.metadata.items)[0];
      expect(obj.metadata.items[itemId]).toEqual({
        type: "object",
        name: "Test Object",
        keys: ["x", "y"],
        description: "A test object",
        subType: "point"
      });
    });

    it("should handle empty object", () => {
      const obj = new TypedObject();

      obj.addObject({
        name: "Empty Object",
        data: {}
      });

      const itemId = Object.keys(obj.metadata.items)[0];
      const metadata = obj.metadata.items[itemId];
      expect(metadata.type).toBe("object");
      if (metadata.type === "object") {
        expect(metadata.keys).toEqual([]);
      }
      expect(obj.data[itemId]).toEqual({});
    });

    it("should preserve object structure", () => {
      const obj = new TypedObject();
      const data = {
        nested: { value: 123 },
        array: [1, 2, 3],
        string: "test",
        number: 42,
        boolean: true,
        null: null
      };

      obj.addObject({
        name: "Complex Object",
        data
      });

      const itemId = Object.keys(obj.metadata.items)[0];
      expect(obj.data[itemId]).toEqual(data);
      const metadata = obj.metadata.items[itemId];
      if (metadata.type === "object") {
        expect(metadata.keys).toEqual(Object.keys(data));
      }
    });

    it("should add multiple objects", () => {
      const obj = new TypedObject();

      obj.addObject({
        name: "Object 1",
        data: { a: 1 }
      });

      obj.addObject({
        name: "Object 2",
        data: { b: 2 }
      });

      expect(Object.keys(obj.metadata.items).length).toBe(2);
      expect(Object.keys(obj.data).length).toBe(2);
    });
  });

  describe("mixed content", () => {
    it("should handle multiple different types of items", () => {
      const obj = new TypedObject({
        name: "Mixed Content",
        description: "Contains various types"
      });

      obj.addImage({
        name: "Image",
        url: "https://example.com/image.jpg"
      });

      obj.addDataTable({
        name: "Table",
        cols: ["A", "B"],
        rows: [[1, 2]]
      });

      obj.addText({
        name: "Text",
        text: "Some text"
      });

      obj.addObject({
        name: "Object",
        data: { key: "value" }
      });

      expect(Object.keys(obj.metadata.items).length).toBe(4);
      expect(Object.keys(obj.data).length).toBe(4);

      const items = Object.values(obj.metadata.items);
      const types = items.map(item => item.type);
      expect(types).toContain("image");
      expect(types).toContain("dataTable");
      expect(types).toContain("text");
      expect(types).toContain("object");
    });

    it("should maintain separate data for each item", () => {
      const obj = new TypedObject();

      obj.addImage({
        id: "img-1",
        name: "Image",
        url: "https://example.com/image.jpg"
      });

      obj.addText({
        id: "txt-1",
        name: "Text",
        text: "Some text"
      });

      expect(obj.data["img-1"]).toEqual({ url: "https://example.com/image.jpg" });
      expect(obj.data["txt-1"]).toEqual({ text: "Some text" });
    });
  });

  describe("metadata integrity", () => {
    it("should maintain correct metadata version", () => {
      const obj = new TypedObject();

      obj.addImage({
        name: "Image",
        url: "https://example.com/image.jpg"
      });

      expect(obj.metadata.version).toBe(1);
    });

    it("should maintain correct metadata type", () => {
      const obj = new TypedObject();

      obj.addText({
        name: "Text",
        text: "Content"
      });

      expect(obj.metadata.type).toBe("typed");
    });

    it("should preserve metadata name and description after adding items", () => {
      const obj = new TypedObject({
        name: "Test",
        description: "Description"
      });

      obj.addImage({
        name: "Image",
        url: "https://example.com/image.jpg"
      });

      expect(obj.metadata.name).toBe("Test");
      expect(obj.metadata.description).toBe("Description");
    });
  });

  describe("id generation", () => {
    it("should generate unique ids for multiple items without custom ids", () => {
      const obj = new TypedObject();

      obj.addImage({
        name: "Image 1",
        url: "https://example.com/1.jpg"
      });

      obj.addImage({
        name: "Image 2",
        url: "https://example.com/2.jpg"
      });

      obj.addText({
        name: "Text",
        text: "Content"
      });

      const ids = Object.keys(obj.metadata.items);
      const uniqueIds = new Set(ids);

      expect(ids.length).toBe(3);
      expect(uniqueIds.size).toBe(3);
    });

    it("should allow custom ids to override generated ids", () => {
      const obj = new TypedObject();

      obj.addImage({
        id: "custom-1",
        name: "Image",
        url: "https://example.com/image.jpg"
      });

      expect(obj.metadata.items["custom-1"]).toBeDefined();
    });
  });
});
