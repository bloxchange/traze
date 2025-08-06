import {
  BONDING_CURVE_SEED,
  DEFAULT_COMMITMENT,
  DEFAULT_FINALITY,
  GLOBAL_ACCOUNT_SEED,
  PUMPFUN_PROGRAM_ID,
} from '@/domain/infrastructure/consts';
import {
  ComputeBudgetProgram,
  Connection,
  Keypair,
  PublicKey,
  SendTransactionError,
  Transaction,
  TransactionMessage,
  VersionedTransaction,
  type Commitment,
  type Finality,
  type VersionedTransactionResponse,
} from '@solana/web3.js';
import { BondingCurveAccount } from './BondingCurveAccount';
import { GlobalAccount } from './GlobalAccount';
import type { PriorityFee, TransactionResult } from './types';
import { globalEventEmitter } from '../../infrastructure/events/EventEmitter';
import { EVENTS, type BondingCurveFetchedData } from '../../infrastructure/events/types';

export function getBondingCurvePDA(
  mint: PublicKey,
  programId: PublicKey
): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(BONDING_CURVE_SEED), mint.toBuffer()],
    programId
  )[0];
}

export async function getBondingCurveAccount(
  connection: Connection,
  bondingCurvePda: PublicKey,
  commitment: Commitment = DEFAULT_COMMITMENT
) {
  const tokenAccount = await connection.getAccountInfo(
    bondingCurvePda,
    commitment
  );

  if (!tokenAccount) {
    return null;
  }

  const bondingCurveAccount = BondingCurveAccount.fromBuffer(tokenAccount!.data);
  
  // Emit BondingCurveFetchedEvent
  const eventData: BondingCurveFetchedData = {
    virtualSolReserves: bondingCurveAccount.virtualSolReserves,
    complete: bondingCurveAccount.complete,
    realSolReserves: bondingCurveAccount.realSolReserves,
    virtualTokenReserves: bondingCurveAccount.virtualTokenReserves,
    realTokenReserves: bondingCurveAccount.realTokenReserves,
  };
  
  globalEventEmitter.emit(EVENTS.BondingCurveFetched, eventData);
  
  return bondingCurveAccount;
}

export async function getGlobalAccount(
  connection: Connection,
  commitment: Commitment
) {
  const [globalAccountPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from(GLOBAL_ACCOUNT_SEED)],
    new PublicKey(PUMPFUN_PROGRAM_ID)
  );

  const tokenAccount = await connection.getAccountInfo(
    globalAccountPDA,
    commitment
  );

  return GlobalAccount.fromBuffer(tokenAccount!.data);
}

export const calculateWithSlippageBuy = (
  amount: bigint,
  basisPoints: bigint
) => {
  return amount + (amount * basisPoints) / 10000n;
};

export function calculateWithSlippageSell(
  amount: bigint,
  slippageBasisPoints: bigint = 500n
): bigint {
  // Actually use the slippage basis points for calculation
  const reduction = Math.max(
    1,
    Number((amount * slippageBasisPoints) / 10000n)
  );

  return amount - BigInt(reduction);
}

export async function sendTransaction(
  connection: Connection,
  tx: Transaction,
  payer: PublicKey,
  signers: Keypair[],
  priorityFees?: PriorityFee,
  commitment: Commitment = DEFAULT_COMMITMENT
): Promise<string | null> {
  const newTx = new Transaction();

  if (priorityFees) {
    const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({
      units: priorityFees.unitLimit,
    });

    const addPriorityFee = ComputeBudgetProgram.setComputeUnitPrice({
      microLamports: priorityFees.unitPrice,
    });

    newTx.add(modifyComputeUnits);

    newTx.add(addPriorityFee);
  }

  newTx.add(tx);

  const versionedTx = await buildVersionedTx(
    connection,
    payer,
    newTx,
    commitment
  );

  versionedTx.sign(signers);

  try {
    const sig = await connection.sendTransaction(versionedTx, {
      skipPreflight: false,
    });

    const latestBlockHash = await connection.getLatestBlockhash();

    await connection.confirmTransaction(
      {
        blockhash: latestBlockHash.blockhash,
        lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
        signature: sig,
      },
      commitment
    );

    return sig;
  } catch (e) {
    if (e instanceof SendTransactionError) {
      const ste = e as SendTransactionError;

      console.log('SendTransactionError' + ste.logs);
    } else {
      console.error(e);
    }

    return null;
  }
}

export async function sendTx(
  connection: Connection,
  tx: Transaction,
  payer: PublicKey,
  signers: Keypair[],
  priorityFees?: PriorityFee,
  commitment: Commitment = DEFAULT_COMMITMENT,
  finality: Finality = DEFAULT_FINALITY
): Promise<TransactionResult> {
  const newTx = new Transaction();

  if (priorityFees) {
    const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({
      units: priorityFees.unitLimit,
    });

    const addPriorityFee = ComputeBudgetProgram.setComputeUnitPrice({
      microLamports: priorityFees.unitPrice,
    });

    newTx.add(modifyComputeUnits);

    newTx.add(addPriorityFee);
  }

  newTx.add(tx);

  const versionedTx = await buildVersionedTx(
    connection,
    payer,
    newTx,
    commitment
  );

  versionedTx.sign(signers);

  try {
    const sig = await connection.sendTransaction(versionedTx, {
      skipPreflight: false,
    });

    const txResult = await getTxDetails(connection, sig, commitment, finality);

    if (!txResult) {
      return {
        success: false,
        error: 'Transaction failed',
      };
    }

    return {
      success: true,
      signature: sig,
      results: txResult,
    };
  } catch (e) {
    if (e instanceof SendTransactionError) {
      const ste = e as SendTransactionError;

      console.log('SendTransactionError' + ste.logs);
    } else {
      console.error(e);
    }

    return {
      error: e,
      success: false,
    };
  }
}

export const buildVersionedTx = async (
  connection: Connection,
  payer: PublicKey,
  tx: Transaction,
  commitment: Commitment = DEFAULT_COMMITMENT
): Promise<VersionedTransaction> => {
  const blockHash = (await connection.getLatestBlockhash(commitment)).blockhash;

  const messageV0 = new TransactionMessage({
    payerKey: payer,
    recentBlockhash: blockHash,
    instructions: tx.instructions,
  }).compileToV0Message();

  return new VersionedTransaction(messageV0);
};

export const getTxDetails = async (
  connection: Connection,
  sig: string,
  commitment: Commitment = DEFAULT_COMMITMENT,
  finality: Finality = DEFAULT_FINALITY
): Promise<VersionedTransactionResponse | null> => {
  const latestBlockHash = await connection.getLatestBlockhash();

  await connection.confirmTransaction(
    {
      blockhash: latestBlockHash.blockhash,
      lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
      signature: sig,
    },
    commitment
  );

  return connection.getTransaction(sig, {
    maxSupportedTransactionVersion: 0,
    commitment: finality,
  });
};
