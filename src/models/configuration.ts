export interface Configuration {
  rpcUrls: string[];
  rpcWebsocketUrl: string;
  jitoEndpoint: string;
  balanceUpdateMode: 'rpc' | 'calculate';
}

export const defaultConfiguration: Configuration = {
  rpcUrls: ['https://api.mainnet-beta.solana.com'],
  rpcWebsocketUrl: 'wss://api.mainnet-beta.solana.com',
  jitoEndpoint: 'https://jito-api.mainnet-beta.solana.com',
  balanceUpdateMode: 'calculate',
};
