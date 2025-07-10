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

export class SwarmSellCommand {
  private wallets: WalletInfo[];
  private tokenMint: string;
  private sellPercentages: string[];
  private sellDelay: number;
  private slippageBasisPoints: number;
  private priorityFeeInSol: number;
  private broker: IBroker;

  constructor(
    wallets: WalletInfo[],
    tokenMint: string,
    sellPercentages: string[],
    sellDelay: number,
    slippageBasisPoints: number,
    priorityFeeInSol: number
  ) {
    this.wallets = wallets;
    this.tokenMint = tokenMint;
    this.sellPercentages = sellPercentages;
    this.sellDelay = sellDelay;
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
    const balance = await getTokenBalance(wallet.publicKey, this.tokenMint);

    const percentage = this.getRandomPercentage();

    return BigInt(Math.floor((balance * percentage) / 100));
  }

  private getRandomPercentage(): number {
    const randomIndex = Math.floor(Math.random() * this.sellPercentages.length);

    return parseFloat(this.sellPercentages[randomIndex]);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
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
        slippageBasisPoints: BigInt(this.slippageBasisPoints),
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

      if (
        this.sellDelay > 0 &&
        selectedWallets.indexOf(wallet) < selectedWallets.length - 1
      ) {
        await this.delay(this.sellDelay * 1000); // Convert seconds to milliseconds
      }
    }
  }
}
