import { nanoid } from "nanoid";
import { StoredObject } from "./types";

export type AddImageOptions = {
  id?: string;
  name: string;
  url: string;
  width?: number;
  height?: number;
  description?: string;
  subType?: string;
}

export type AddDataTableOptions = {
  id?: string;
  name: string;
  cols: string[];
  rows: any[][];
  description?: string;
  subType?: string;
}

export type AddTypedTextOptions = {
  id?: string;
  name: string;
  text: string;
  description?: string;
  subType?: string;
}

export type AddTypedObjectOptions = {
  id?: string;
  name: string;
  data: Record<string, any>;
  description?: string;
  subType?: string;
}

export type TypedImageMetadata = {
  type: "image";
} & Omit<AddImageOptions, "id"|"url">;

export type TypedDataTableMetadata = {
  type: "dataTable";
} & Omit<AddDataTableOptions, "id"|"rows">;

export type TypedTextMetadata = {
  type: "text";
} & Omit<AddTypedTextOptions, "id"|"text">;

export type TypedObjectMetadata = {
  type: "object";
  keys: string[];
} & Omit<AddTypedObjectOptions, "id"|"data">;

export type TypedMetadataItem = TypedImageMetadata | TypedDataTableMetadata | TypedTextMetadata | TypedObjectMetadata;
export type TypedMetadataItems = Record<string, TypedMetadataItem>;

export type TypedMetadata = {
  version: 1;
  type: "typed";
  items: TypedMetadataItems;
  name?: string;
  description?: string;
}

export type TypedData = Record<string, any>;

export type TypedObjectOptions = {
  id?: string;
  name?: string;
  description?: string;
}

export class TypedObject implements StoredObject {
  id: string;
  metadata: TypedMetadata;
  data: TypedData;

  constructor(options?: TypedObjectOptions) {
    this.id = options?.id || nanoid();
    this.metadata = {
      version: 1,
      type: "typed",
      items: {},
    };
    if (options?.name !== undefined) {
      this.metadata.name = options.name;
    }
    if (options?.description !== undefined) {
      this.metadata.description = options.description;
    }
    this.data = {};
  }

  static IsSupportedTypedObject(storedObject: StoredObject): boolean {
    return TypedObject.IsSupportedTypedObjectMetadata(storedObject.metadata);
  }

  static IsSupportedTypedObjectMetadata(storedObjectMetadata?: StoredObject["metadata"]): storedObjectMetadata is TypedMetadata {
    const metadata = storedObjectMetadata as TypedMetadata|undefined;
    return metadata !== undefined && metadata.type === "typed" && typeof metadata.version === "number" && metadata.version == 1;
  }

  static FromStoredObject(id: string, storedObject: StoredObject): TypedObject {
    if (!TypedObject.IsSupportedTypedObject(storedObject)) {
      throw new Error("Invalid or unsupported TypedObject");
    }

    const typedObject = new TypedObject({id});
    typedObject.metadata = storedObject.metadata as TypedMetadata;
    typedObject.data = storedObject.data;
    return typedObject;
  }

  addImage(options: AddImageOptions): void {
    const id = options.id || nanoid();
    this.metadata.items[id] = {
      type: "image",
      name: options.name
    }
    if (options.subType !== undefined) {
      this.metadata.items[id].subType = options.subType;
    }
    if (options.width !== undefined) {
      this.metadata.items[id].width = options.width;
    }
    if (options.height !== undefined) {
      this.metadata.items[id].height = options.height;
    }
    if (options.description !== undefined) {
      this.metadata.items[id].description = options.description;
    }

    this.data[id] = {
      url: options.url
    };
  }

  addDataTable(options: AddDataTableOptions): void {
    const id = options.id || nanoid();
    this.metadata.items[id] = {
      type: "dataTable",
      name: options.name,
      cols: options.cols,
    }
    if (options.subType !== undefined) {
      this.metadata.items[id].subType = options.subType;
    }
    if (options.description !== undefined) {
      this.metadata.items[id].description = options.description;
    }

    // firebase does not support nested arrays well, so we store rows as an object with numeric keys
    const rowsObj: Record<string, any[]> = {};
    options.rows.forEach((row, index) => {
      rowsObj[index.toString()] = row;
    });

    this.data[id] = {
      rows: rowsObj
    };
  }

  addText(options: AddTypedTextOptions): void {
    const id = options.id || nanoid();
    this.metadata.items[id] = {
      type: "text",
      name: options.name,
    }
    if (options.subType !== undefined) {
      this.metadata.items[id].subType = options.subType;
    }
    if (options.description !== undefined) {
      this.metadata.items[id].description = options.description;
    }

    this.data[id] = {
      text: options.text
    };
  }

  addObject(options: AddTypedObjectOptions): void {
    const id = options.id || nanoid();
    this.metadata.items[id] = {
      type: "object",
      name: options.name,
      keys: Object.keys(options.data),
    }
    if (options.subType !== undefined) {
      this.metadata.items[id].subType = options.subType;
    }
    if (options.description !== undefined) {
      this.metadata.items[id].description = options.description;
    }

    this.data[id] = options.data;
  }
}