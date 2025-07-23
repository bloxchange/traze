import React, { useState, useEffect } from 'react';
import { ConnectionManager } from '../domain/infrastructure/ConnectionManager';
import { RpcConnectionContext } from '../hooks/useRpcConnection';
import { useConfiguration } from '../hooks';
import type { RpcConnectionState } from '../models';

export const RpcConnectionProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { configuration } = useConfiguration();
  const [connectionState, setConnectionState] = useState<RpcConnectionState>({
    connectionManager: null as ConnectionManager | null,
    isConnected: false,
    error: null as string | null,
  });

  useEffect(() => {
    updateConnection();
  }, [configuration.rpcUrls]);

  const updateConnection = (specificRpcUrl?: string) => {
    try {
      const connectionManager = ConnectionManager.getInstance();

      // If a specific RPC URL is provided, use only that one, otherwise use all configured URLs
      const rpcUrls = specificRpcUrl ? [specificRpcUrl] : configuration.rpcUrls;

      connectionManager.initialize(
        rpcUrls,
        configuration.rpcWebsocketUrl
      );

      setConnectionState({
        connectionManager,
        isConnected: true,
        error: null,
      });
    } catch (error) {
      setConnectionState({
        connectionManager: null,
        isConnected: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to establish connection',
      });
    }
  };

  const resetConnection = () => {
    try {
      const connectionManager = ConnectionManager.getInstance();

      connectionManager.unsubscribeAll();

      updateConnection();
    } catch (error) {
      setConnectionState((prev) => ({
        ...prev,
        error:
          error instanceof Error ? error.message : 'Failed to reset connection',
      }));
    }
  };

  return (
    <RpcConnectionContext.Provider
      value={{ connectionState, updateConnection, resetConnection }}
    >
      {children}
    </RpcConnectionContext.Provider>
  );
};
