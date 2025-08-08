import { PublicKey, type Connection, type Commitment } from '@solana/web3.js';
import { getBondingCurveAccount, getBondingCurvePDA } from '../trading/pumpfun/utils';
import { PUMPFUN_PROGRAM_ID, PUMPFUN_AMM_PROGRAM_ID } from '../infrastructure/consts';
import { DEFAULT_COMMITMENT } from '../infrastructure/consts';

/**
 * Check if a bonding curve is completed for a given token mint
 * @param connection - Solana connection
 * @param tokenMint - Token mint address
 * @param commitment - Transaction commitment level
 * @returns Object containing bonding curve status and appropriate program ID
 */
export async function checkBondingCurveStatus(
  connection: Connection,
  tokenMint: string,
  commitment: Commitment = DEFAULT_COMMITMENT
): Promise<{
  isCompleted: boolean;
  programId: string;
  bondingCurveExists: boolean;
}> {
  try {
    const mint = new PublicKey(tokenMint);
    const pumpFunProgramId = new PublicKey(PUMPFUN_PROGRAM_ID);
    
    // Get bonding curve PDA for PumpFun
    const bondingCurvePDA = getBondingCurvePDA(mint, pumpFunProgramId);
    
    // Try to fetch the bonding curve account
    const bondingAccount = await getBondingCurveAccount(
      connection,
      bondingCurvePDA,
      commitment
    );
    
    if (!bondingAccount) {
      // No bonding curve found, this might be a token that was never on PumpFun
      // or it's already graduated and the bonding curve was closed
      return {
        isCompleted: true, // Assume completed if no bonding curve exists
        programId: PUMPFUN_AMM_PROGRAM_ID, // Use AMM for tokens without bonding curves
        bondingCurveExists: false,
      };
    }
    
    // Check if the bonding curve is completed
    const isCompleted = bondingAccount.complete;
    
    return {
      isCompleted,
      programId: isCompleted ? PUMPFUN_AMM_PROGRAM_ID : PUMPFUN_PROGRAM_ID,
      bondingCurveExists: true,
    };
  } catch (error) {
    console.error('Error checking bonding curve status:', error);
    
    // In case of error, default to using PumpFun (safer option)
    return {
      isCompleted: false,
      programId: PUMPFUN_PROGRAM_ID,
      bondingCurveExists: false,
    };
  }
}

/**
 * Get the appropriate broker program ID based on bonding curve status
 * @param connection - Solana connection
 * @param tokenMint - Token mint address
 * @param commitment - Transaction commitment level
 * @returns Program ID to use for trading
 */
export async function getBrokerProgramId(
  connection: Connection,
  tokenMint: string,
  commitment: Commitment = DEFAULT_COMMITMENT
): Promise<string> {
  const status = await checkBondingCurveStatus(connection, tokenMint, commitment);
  return status.programId;
}