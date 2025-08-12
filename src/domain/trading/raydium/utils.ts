import {
  Connection,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
  type Keypair,
  type Commitment,
} from '@solana/web3.js';
import { Token, TokenAmount, Percent } from '@raydium-io/raydium-sdk';
import type { RaydiumPoolInfo } from './types';

/**
 * Calculate minimum amount out with slippage for buy operations
 */
export function calculateMinAmountOutWithSlippage(
  expectedAmountOut: bigint,
  slippageBasisPoints: number
): bigint {
  const slippageMultiplier = BigInt(10000 - slippageBasisPoints);
  return (expectedAmountOut * slippageMultiplier) / BigInt(10000);
}

/**
 * Calculate maximum amount in with slippage for sell operations
 */
export function calculateMaxAmountInWithSlippage(
  expectedAmountIn: bigint,
  slippageBasisPoints: number
): bigint {
  const slippageMultiplier = BigInt(10000 + slippageBasisPoints);
  return (expectedAmountIn * slippageMultiplier) / BigInt(10000);
}

/**
 * Send transaction with retry logic
 */
export async function sendTransaction(
  connection: Connection,
  transaction: Transaction,
  signers: Keypair[],
  commitment: Commitment = 'confirmed',
  maxRetries: number = 3
): Promise<string> {
  let attempt = 0;
  let lastError: Error;

  while (attempt < maxRetries) {
    try {
      const signature = await sendAndConfirmTransaction(
        connection,
        transaction,
        signers,
        {
          commitment,
          maxRetries: 1,
        }
      );
      return signature;
    } catch (error) {
      lastError = error as Error;
      attempt++;
      console.warn(`Transaction attempt ${attempt} failed:`, error);

      if (attempt < maxRetries) {
        // Wait before retry
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  throw lastError!;
}

/**
 * Get Raydium pool information by token mint
 * This is a placeholder - in a real implementation, you would fetch from Raydium's API
 */
export async function getPoolInfoByTokenMint(
  connection: Connection,
  tokenMint: PublicKey
): Promise<RaydiumPoolInfo | null> {
  try {
    // TODO: Implement actual pool fetching logic
    // This would typically involve:
    // 1. Querying Raydium's pool registry
    // 2. Finding pools that contain the specified token
    // 3. Returning the most liquid pool

    console.warn(
      'getPoolInfoByTokenMint not fully implemented - returning null'
    );
    return null;
  } catch (error) {
    console.error('Error fetching pool info:', error);
    return null;
  }
}

/**
 * Validate that a pool exists and is active
 */
export function validatePool(poolInfo: RaydiumPoolInfo | null): boolean {
  if (!poolInfo) {
    return false;
  }

  // Add additional validation logic here
  // e.g., check if pool is not paused, has sufficient liquidity, etc.

  return true;
}

/**
 * Format token amount for display
 */
export function formatTokenAmount(amount: bigint, decimals: number): string {
  const divisor = BigInt(10 ** decimals);
  const wholePart = amount / divisor;
  const fractionalPart = amount % divisor;

  if (fractionalPart === BigInt(0)) {
    return wholePart.toString();
  }

  const fractionalStr = fractionalPart.toString().padStart(decimals, '0');
  const trimmedFractional = fractionalStr.replace(/0+$/, '');

  return `${wholePart}.${trimmedFractional}`;
}
