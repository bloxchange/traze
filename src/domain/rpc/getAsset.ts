import { ConnectionManager } from '../infrastructure/ConnectionManager';
import type { AssetResponsePayload, RpcResponse } from '../models/rpc';

export async function getAsset(tokenMint: string) {
  const rpcUrl = ConnectionManager.getInstance().getConnection().rpcEndpoint;
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
