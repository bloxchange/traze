import type { WalletInfo } from '@/models';
import type { IBroker } from '../trading/IBroker';
import type { ISellParameters } from '../trading/ISellParameters';
import { BrokerFactory } from '../infrastructure/BrokerFactory';
import { PUMPFUN_PROGRAM_ID } from '../infrastructure/consts';
import { PublicKey } from '@solana/web3.js';
import { ConnectionManager } from '../infrastructure/ConnectionManager';
import { AnchorProvider } from '@coral-xyz/anchor';
import NodeWallet from '../infrastructure/NodeWallet';
import { getTokenBalance } from '../rpc/getTokenBalance';
import { globalEventEmitter } from '../infrastructure/events/EventEmitter';
import { EVENTS } from '../infrastructure/events/types';

export class SwarmFlushCommand {
  private wallets: WalletInfo[];
  private tokenMint: string;
  private slippageBasisPoints: bigint;
  private priorityFeeInSol: number;
  private broker: IBroker;

  constructor(
    wallets: WalletInfo[],
    tokenMint: string,
    slippageBasisPoints: bigint,
    priorityFeeInSol: number
  ) {
    this.wallets = wallets;
    this.tokenMint = tokenMint;
    this.slippageBasisPoints = slippageBasisPoints;
    this.priorityFeeInSol = priorityFeeInSol;

    const provider: AnchorProvider = new AnchorProvider(
      ConnectionManager.getInstance().getConnection(),
      new NodeWallet(this.wallets[0].keypair),
      {
        commitment: 'finalized',
      }
    );

    const broker = BrokerFactory.create(PUMPFUN_PROGRAM_ID, provider);

    if (!broker) {
      throw new Error('Failed to create broker');
    }

    this.broker = broker;
  }

  private async calculateSellAmount(wallet: WalletInfo): Promise<bigint> {
    return BigInt(await getTokenBalance(wallet.publicKey, this.tokenMint));
  }

  async execute(): Promise<void> {
    const selectedWallets = this.wallets.filter((wallet) => wallet.selected);

    if (selectedWallets.length === 0) {
      throw new Error('No wallets selected');
    }

    const prioritizationFees = await ConnectionManager.getInstance()
      .getConnection()
      .getRecentPrioritizationFees({
        lockedWritableAccounts: [new PublicKey(this.tokenMint)],
      });

    let maxCurrentPriorityUnitPrice = 0;

    prioritizationFees.forEach(({ prioritizationFee }) => {
      if (prioritizationFee > maxCurrentPriorityUnitPrice) {
        maxCurrentPriorityUnitPrice = prioritizationFee;
      }
    });

    for (const wallet of selectedWallets) {
      const sellAmount = await this.calculateSellAmount(wallet);

      if (sellAmount <= 0) {
        continue;
      }

      const sellParameters: ISellParameters = {
        seller: wallet.keypair,
        mint: new PublicKey(this.tokenMint),
        sellTokenAmount: sellAmount,
        slippageBasisPoints: this.slippageBasisPoints,
        priorityFeeInSol: this.priorityFeeInSol,
        maxCurrentPriorityFee: maxCurrentPriorityUnitPrice,
      };

      const signature = await this.broker.sell(sellParameters);
      if (signature) {
        globalEventEmitter.emit(EVENTS.TransactionCreated, {
          signature,
          type: 'sell',
          owner: wallet.keypair.publicKey,
        });
      }
    }
  }
}
