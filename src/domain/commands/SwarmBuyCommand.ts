import type { WalletInfo } from '@/models';
import type { IBroker } from '../trading/IBroker';
import type { IBuyParameters } from '../trading/IBuyParameters';
import { BrokerFactory } from '../infrastructure/BrokerFactory';
import { PUMPFUN_PROGRAM_ID } from '../infrastructure/consts';
import { globalEventEmitter } from '../infrastructure/events/EventEmitter';
import { EVENTS } from '../infrastructure/events/types';
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { ConnectionManager } from '../infrastructure/ConnectionManager';
import { AnchorProvider } from '@coral-xyz/anchor';
import NodeWallet from '../infrastructure/NodeWallet';

export class SwarmBuyCommand {
  private wallets: WalletInfo[];
  private tokenMint: string;
  private buyAmounts: string[];
  private buyDelay: number;
  private slippageBasisPoints: number;
  private priorityFeeInSol: number;
  private broker: IBroker;

  constructor(
    wallets: WalletInfo[],
    tokenMint: string,
    buyAmounts: string[],
    buyDelay: number,
    slippageBasisPoints: number,
    priorityFeeInSol: number
  ) {
    this.wallets = wallets;
    this.tokenMint = tokenMint;
    this.buyAmounts = buyAmounts;
    this.buyDelay = buyDelay;
    this.slippageBasisPoints = slippageBasisPoints;
    this.priorityFeeInSol = priorityFeeInSol;

    const provider: AnchorProvider = new AnchorProvider(
      ConnectionManager.getInstance().getConnection(),
      new NodeWallet(this.wallets[0].keypair),
      {
        commitment: 'confirmed',
      }
    );

    const broker = BrokerFactory.create(PUMPFUN_PROGRAM_ID, provider);

    if (!broker) {
      throw new Error('Failed to create broker');
    }

    this.broker = broker;
  }

  private async getRandomAmount(
    wallet: PublicKey,
    priorityFeeInSol: number
  ): Promise<number> {
    const randomIndex = Math.floor(Math.random() * this.buyAmounts.length);

    const estimatedAmount = parseFloat(this.buyAmounts[randomIndex]);

    const balance =
      (await ConnectionManager.getInstance()
        .getConnection()
        .getBalance(wallet, 'confirmed')) / LAMPORTS_PER_SOL;

    const availableBalance = balance - priorityFeeInSol;

    return availableBalance > estimatedAmount
      ? estimatedAmount
      : availableBalance;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async execute(): Promise<void> {
    const selectedWallets = this.wallets.filter((wallet) => wallet.selected);

    if (selectedWallets.length === 0) {
      throw new Error('No wallets selected');
    }

    for (const wallet of selectedWallets) {
      const amountInSol = await this.getRandomAmount(
        wallet.keypair.publicKey,
        this.priorityFeeInSol
      );

      if (amountInSol <= 0) {
        continue;
      }

      const buyParameters: IBuyParameters = {
        buyer: wallet.keypair,
        tokenMint: this.tokenMint,
        amountInSol: amountInSol,
        slippageBasisPoints: this.slippageBasisPoints,
        priorityFeeInSol: this.priorityFeeInSol,
        maxCurrentPriorityFee: this.priorityFeeInSol,
      };

      this.broker
        .buy(buyParameters)
        .then(signature => {
          ;

          if (signature) {
            globalEventEmitter.emit(EVENTS.TransactionCreated, {
              signature,
              type: 'buy',
              owner: wallet.keypair.publicKey,
            });
          }
        });

      if (this.buyDelay > 0) {
        await this.delay(this.buyDelay * 1000); // Convert seconds to milliseconds
      }
    }
  }
}
