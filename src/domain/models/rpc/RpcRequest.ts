export interface RpcRequest<T> {
  jsonrpc: string;
  id: number;
  method: string;
  params: T;
}
