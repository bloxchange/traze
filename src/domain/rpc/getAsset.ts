import { ConnectionManager } from '../infrastructure/ConnectionManager';
import type { RpcResponse } from '../models/rpc';
import type { AssetResponsePayload } from '../models/rpc/AssetResponsePayload';

export async function getAsset(tokenMint: string) {
  // Get the current connection from the round-robin manager
  const connection = ConnectionManager.getInstance().getConnection();
  const rpcUrl = connection.rpcEndpoint;

  const response = await fetch(rpcUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'getAsset',
      params: {
        id: tokenMint,
      },
    }),
  });

  return (await response.json()) as RpcResponse<AssetResponsePayload>;
}
