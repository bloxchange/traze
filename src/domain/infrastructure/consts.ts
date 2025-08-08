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

  export const PUMPFUN_AMM_PROGRAM_ID = 'pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA';

  export const WRAPPED_SOL_MINT = 'So11111111111111111111111111111111111111112';
  export const SOL_MINT = 'So11111111111111111111111111111111111111111';

  // PumpFun AMM instruction discriminators
  export const BUY_DISCRIMINATOR = new Uint8Array([102, 6, 61, 18, 1, 218, 235, 234]);
  export const SELL_DISCRIMINATOR = new Uint8Array([51, 230, 133, 164, 1, 127, 131, 173]);
  
  // Token decimals
  export const TOKEN_DECIMALS = 1000000; // 10^6 for 6 decimal places
  
  // Fee recipient (placeholder - should be updated with actual value)
  export const FEE_RECIPIENT = 'CebN5WGQ4jvEPvsVU4EoHEpgzq1VV2AbicfhtW4xC9iM';
  
  // Global config (placeholder - should be updated with actual value)
  export const GLOBAL = '4wTV1YmiEkRvAtNtsSGPtUrqRYQMe5SKy2uB4Jjaxnjf';
  
  // Event authority (placeholder - should be updated with actual value)
  export const EVENT_AUTHORITY = 'Ce6TQqeHC9p8KetsN6JsjHK7UTZk7nasjjnr7XxXp9F1';
