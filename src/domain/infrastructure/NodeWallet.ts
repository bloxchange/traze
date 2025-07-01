import {
  Keypair,
  PublicKey,
  Transaction,
  VersionedTransaction,
} from "@solana/web3.js";
import { type Wallet } from "@coral-xyz/anchor/dist/esm/provider";
import { isVersionedTransaction } from "@coral-xyz/anchor/dist/cjs/utils/common";

/**
 * Node only wallet.
 */
export default class NodeWallet implements Wallet {
  payer?: Keypair | undefined;

  constructor(payer: Keypair) {
    this.payer = payer;
  }

  async signTransaction<T extends Transaction | VersionedTransaction>(
    tx: T
  ): Promise<T> {
    if (isVersionedTransaction(tx)) {
      tx.sign([this.payer!]);
    } else {
      tx.partialSign(this.payer!);
    }

    return tx;
  }

  async signAllTransactions<T extends Transaction | VersionedTransaction>(
    txs: T[]
  ): Promise<T[]> {
    return txs.map((t) => {
      if (isVersionedTransaction(t)) {
        t.sign([this.payer!]);
      } else {
        t.partialSign(this.payer!);
      }
      return t;
    });
  }

  get publicKey(): PublicKey {
    return this.payer!.publicKey;
  }
}