import type { AssetResponsePayload, RpcResponse } from "../models/rpc";

export async function getAsset(rpcUrl: string, tokenMint: string) {
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
        id: tokenMint
      },
    }),
  });

  return await response.json() as RpcResponse<AssetResponsePayload>;
}
