import { createContext, useContext } from 'react';
import type { Configuration } from '../models';

export interface ConfigurationContextType {
  configuration: Configuration;
  updateConfiguration: (newConfig: Configuration) => void;
}

export const ConfigurationContext = createContext<
  ConfigurationContextType | undefined
>(undefined);

export function useConfiguration() {
  const context = useContext(ConfigurationContext);

  if (context === undefined) {
    throw new Error(
      'useConfiguration must be used within a ConfigurationProvider'
    );
  }

  return context;
}
