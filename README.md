# @concord-consortium/object-storage

A TypeScript library for object storage.

## Installation

```bash
npm install @concord-consortium/object-storage
```

## Usage

### Basic Usage

```typescript
import { createObjectStorage, ObjectStorageConfig } from '@concord-consortium/object-storage';

const config: ObjectStorageConfig = { type: "demo", version: 1 };
const storage = createObjectStorage(config);
```

### React Context Usage

```typescript
import { ObjectStorageProvider, useObjectStorage } from '@concord-consortium/object-storage';

function App() {
  const config = { type: "demo", version: 1 } as const;

  return (
    <ObjectStorageProvider config={config}>
      <YourComponent />
    </ObjectStorageProvider>
  );
}

function YourComponent() {
  const storage = useObjectStorage();

  // Use storage methods
  const handleAdd = async () => {
    const object = new StoredObject();
    const result = await storage.add(object);
    console.log('Added object with id:', result.id);
  };

  return <div>Your component</div>;
}
```

## Development

```bash
# Install dependencies
npm install

# Build the library
npm run build

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## License

MIT
