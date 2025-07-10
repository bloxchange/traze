import { createContext, useContext } from 'react';
import type { RpcConnectionState } from '../models';

export interface RpcConnectionContextType {
  connectionState: RpcConnectionState;
  updateConnection: (rpcUrl: string) => void;
  resetConnection: () => void;
}

export const RpcConnectionContext = createContext<RpcConnectionContextType>(
  {} as RpcConnectionContextType
);

export const useRpcConnection = () => {
  const context = useContext(RpcConnectionContext);

  if (!context) {
    throw new Error(
      'useRpcConnection must be used within a RpcConnectionProvider'
    );
  }

  return context;
};
