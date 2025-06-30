export interface Configuration {
  rpcUrl: string;
  jitoEndpoint: string;
  balanceUpdateMode: 'rpc' | 'calculate';
}

export const defaultConfiguration: Configuration = {
  rpcUrl: 'https://api.mainnet-beta.solana.com',
  jitoEndpoint: 'https://jito-api.mainnet-beta.solana.com',
  balanceUpdateMode: 'calculate',
};
