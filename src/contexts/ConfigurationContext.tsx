import { useState, useEffect, type ReactNode } from 'react';
import { type Configuration, defaultConfiguration } from '../models/configuration';
import { ConfigurationContext } from '../hooks';

export function ConfigurationProvider({ children }: { children: ReactNode }) {
  const [configuration, setConfiguration] = useState<Configuration>(() => {
    const savedConfig = localStorage.getItem('configuration');
    return savedConfig ? JSON.parse(savedConfig) : defaultConfiguration;
  });

  useEffect(() => {
    localStorage.setItem('configuration', JSON.stringify(configuration));
  }, [configuration]);

  const updateConfiguration = (newConfig: Configuration) => {
    setConfiguration(newConfig);
  };

  return (
    <ConfigurationContext.Provider value={{ configuration, updateConfiguration }}>
      {children}
    </ConfigurationContext.Provider>
  );
}
