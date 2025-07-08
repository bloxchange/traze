import type { ConnectionManager } from '@/domain/infrastructure/ConnectionManager';

export interface RpcConnectionState {
  connectionManager: ConnectionManager | null;
  isConnected: boolean;
  error: string | null;
}
