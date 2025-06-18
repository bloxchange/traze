export interface Configuration {
  rpcUrl: string;
}

export const defaultConfiguration: Configuration = {
  rpcUrl: 'https://api.mainnet-beta.solana.com',
};
