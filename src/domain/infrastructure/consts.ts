import type { Commitment, Finality } from '@solana/web3.js';

export const DB_NAME = 'traze_token_cache';
export const STORE_NAME = 'token_informations';
export const PUMPFUN_PROGRAM_ID = '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P';
export const ASSOCIATED_TOKEN_PROGRAM_ID =
  'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL';
export const GLOBAL_ACCOUNT_SEED = 'global';
export const MINT_AUTHORITY_SEED = 'mint-authority';
export const BONDING_CURVE_SEED = 'bonding-curve';
export const METADATA_SEED = 'metadata';
export const EVENT_AUTHORITY_SEED = '__event_authority';

export const DEFAULT_DECIMALS = 6;
export const DEFAULT_COMMITMENT: Commitment = 'confirmed';
export const DEFAULT_FINALITY: Finality = 'confirmed';
export const DEFAULT_GAS_FEE = 50000;

export const RAYDIUM_LAUNCHPAD_PROGRAM_ID =
  'LanMV9sAd7wArD4vJFi2qDdfnVhFxYSUg6eADduJ3uj';
