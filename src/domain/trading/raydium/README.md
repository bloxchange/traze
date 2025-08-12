# Raydium Trading Brokers

This directory contains broker implementations for trading on Raydium DEX and LaunchLab.

## RaydiumBroker

The standard Raydium broker for trading on existing AMM pools.

```typescript
import { RaydiumBroker } from './RaydiumBroker';
import { Connection } from '@solana/web3.js';

const connection = new Connection('https://api.mainnet-beta.solana.com');
const broker = new RaydiumBroker({ connection });
```

## RaydiumLaunchPadBroker

Specialized broker for trading on Raydium LaunchLab bonding curves. <mcreference link="https://docs.raydium.io/raydium/pool-creation/launchlab/launchlab-typescript-sdk" index="1">1</mcreference>

### Features
- Buy and sell tokens on LaunchLab bonding curves
- Automatic slippage protection
- Event emission for balance changes
- Support for both mainnet and devnet

### Usage

```typescript
import { RaydiumLaunchPadBroker } from './RaydiumLaunchPadBroker';
import { Connection, PublicKey } from '@solana/web3.js';

const connection = new Connection('https://api.mainnet-beta.solana.com');
const platformId = new PublicKey('your-platform-id'); // Optional

const broker = new RaydiumLaunchPadBroker({
  connection,
  isDevnet: false, // Set to true for devnet
  platformId, // Optional: your platform configuration
});

// Buy tokens
const buyResult = await broker.buy({
  buyer: buyerKeypair,
  amountInSol: 1.0,
  tokenMint: 'token-mint-address',
  slippageBasisPoints: 500, // 5%
  priorityFeeInSol: 0.001,
  maxCurrentPriorityFee: 0.01,
});

// Sell tokens
const sellResult = await broker.sell({
  seller: sellerKeypair,
  mint: tokenMintPublicKey,
  sellTokenAmount: BigInt(1000000), // Amount in token's smallest unit
  slippageBasisPoints: BigInt(500), // 5%
  priorityFeeInSol: 0.001,
  maxCurrentPriorityFee: 0.01,
});
```

### Configuration

- `connection`: Solana RPC connection
- `isDevnet`: Boolean flag for devnet/mainnet (default: false)
- `platformId`: Optional platform configuration ID for custom fee structures

### Program IDs

- **Mainnet**: `LanMV9sAd7wArD4vJFi2qDdfnVhFxYSUg6eAqKxYDiNP` <mcreference link="https://docs.raydium.io/raydium/pool-creation/launchlab/launchlab-typescript-sdk" index="1">1</mcreference>
- **Devnet**: `LanD8FpTBBvzZFXjTxsAoipkFsxPUCDB4qAqKxYDiNP` <mcreference link="https://docs.raydium.io/raydium/pool-creation/launchlab/launchlab-typescript-sdk" index="1">1</mcreference>

### Events

Both brokers emit balance change events through the global event emitter:

```typescript
import { globalEventEmitter, EVENTS } from '../../infrastructure/events/EventEmitter';

globalEventEmitter.on(EVENTS.BalanceChanged, (data) => {
  console.log('Balance changed:', data);
});
```

## Dependencies

- `@raydium-io/raydium-sdk`: For standard AMM operations
- `@raydium-io/raydium-sdk-v2`: For LaunchLab operations <mcreference link="https://docs.raydium.io/raydium/pool-creation/launchlab/launchlab-typescript-sdk" index="1">1</mcreference>
- `@solana/web3.js`: Solana blockchain interaction
- `bn.js`: Big number arithmetic

## Notes

- The LaunchLab broker currently contains placeholder implementations for transaction building
- Full implementation requires proper integration with Raydium SDK v2 transaction builders
- Pool data decoding needs to be implemented based on the LaunchLab account layout
- Error handling and retry logic should be enhanced for production use