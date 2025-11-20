import React, { createContext, useContext, useMemo, ReactNode } from "react";
import { ObjectStorageConfig, IObjectStorage } from './types';
import { createObjectStorage } from './object-storage';

interface ObjectStorageProviderProps {
  config?: ObjectStorageConfig;
  children: ReactNode;
}

const ObjectStorageContext = createContext<IObjectStorage | null>(null);

/**
 * Provider component that creates and provides an ObjectStorage instance
 * based on the supplied configuration
 */
export function ObjectStorageProvider({ config, children }: ObjectStorageProviderProps) {
  const objectStorage = useMemo(() => createObjectStorage(config), [config]);

  return (
    <ObjectStorageContext.Provider value={objectStorage}>
      {children}
    </ObjectStorageContext.Provider>
  );
}

/**
 * Hook to access the ObjectStorage instance from context
 * Must be used within an ObjectStorageProvider
 */
export function useObjectStorage(): IObjectStorage {
  const context = useContext(ObjectStorageContext);

  if (!context) {
    throw new Error('useObjectStorage must be used within an ObjectStorageProvider');
  }

  return context;
}
