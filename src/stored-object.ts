import { nanoid } from "nanoid";

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

export type AddTextOptions = {
  id?: string;
  name: string;
  text: string;
  description?: string;
  subType?: string;
}

export type AddStoredObjectOptions = {
  id?: string;
  name: string;
  data: Record<string, any>;
  description?: string;
  subType?: string;
}

export type StoredImageMetadata = {
  type: "image";
} & Omit<AddImageOptions, "id"|"url">;

export type StoredObjectDataTableMetadata = {
  type: "dataTable";
} & Omit<AddDataTableOptions, "id"|"rows">;

export type StoredTextMetadata = {
  type: "text";
} & Omit<AddTextOptions, "id"|"text">;

export type StoredObjectItemMetadata = {
  type: "object";
  keys: string[];
} & Omit<AddStoredObjectOptions, "id"|"data">;

export type StoredMetadataItem = StoredImageMetadata | StoredObjectDataTableMetadata | StoredTextMetadata | StoredObjectItemMetadata;
export type StoredMetadataItems = Record<string, StoredMetadataItem>;

export type StoredObjectType = "simulation-recording" | "untyped"

export type StoredObjectMetadata = {
  version: 1;
  type: StoredObjectType;
  subType?: string;
  items: StoredMetadataItems;
  name?: string;
  description?: string;
}

export type StoredObjectData = Record<string, any>;

export type StoredObjectOptions = {
  id?: string;
  name?: string;
  description?: string;
  type?: StoredObjectType;
  subType?: string;
}

export class StoredObject {
  id: string;
  metadata: StoredObjectMetadata;
  data: StoredObjectData;

  constructor(options?: StoredObjectOptions) {
    this.id = options?.id || nanoid();
    this.metadata = {
      version: 1,
      type: options?.type || "untyped",
      items: {},
    };
    if (options?.name !== undefined) {
      this.metadata.name = options.name;
    }
    if (options?.description !== undefined) {
      this.metadata.description = options.description;
    }
    if (options?.subType !== undefined) {
      this.metadata.subType = options.subType;
    }
    this.data = {};
  }

  static FromParts(id: string, metadata: StoredObjectMetadata, data: StoredObjectData): StoredObject {
    const typedObject = new StoredObject({id});
    typedObject.metadata = metadata;
    typedObject.data = data;
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

  addText(options: AddTextOptions): void {
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

  addObject(options: AddStoredObjectOptions): void {
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