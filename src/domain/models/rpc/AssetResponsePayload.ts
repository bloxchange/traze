export interface TokenFile {
  uri: string;
  type: string;
  cdn?: boolean;
}

export interface TokenMetadata {
  name: string;
  symbol: string;
  token_standard: 'Fungible' | 'NonFungible';
}

export interface TokenAuthority {
  address: string;
  scopes: Array<'full' | 'limited'>;
}

export interface TokenCompression {
  eligible: boolean;
  compressed: boolean;
  data_hash: string;
  creator_hash: string;
  asset_hash: string;
  tree: string;
  seq: number;
  leaf_id: number;
}

export interface TokenRoyalty {
  royalty_model: 'creators' | 'fanout' | 'single';
  target: null | string;
  percent: number;
  basis_points: number;
  primary_sale_happened: boolean;
  locked: boolean;
}

export interface TokenCreator {
  address: string;
  share: number;
  verified: boolean;
}

export interface TokenOwnership {
  frozen: boolean;
  delegated: boolean;
  delegate: null | string;
  ownership_model: 'single' | 'token';
}

export interface TokenInfo {
  supply: number;
  decimals: number;
  token_program: string;
}

export interface MintExtionions {
  transfer_hook: {
    authority: string,
    program_id: string
  },
  metadata_pointer: {
    metadata_address: string
  }
}

export interface AssetResponsePayload {
  interface: 'FungibleToken' | 'NonFungibleToken';
  id: string;
  content: {
    $schema: string;
    json_uri: string;
    files: TokenFile[];
    metadata: TokenMetadata;
    links: Record<string, string>;
  };
  authorities: TokenAuthority[];
  compression: TokenCompression;
  grouping: string[];
  royalty: TokenRoyalty;
  creators: TokenCreator[];
  ownership: TokenOwnership;
  mutable: boolean;
  burnt: boolean;
  token_info: TokenInfo;
  mint_extensions: MintExtionions;
}
