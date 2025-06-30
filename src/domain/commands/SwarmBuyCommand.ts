import type { WalletInfo, Configuration } from '@/models';
import type { IBroker } from '../trading/IBroker';
import type { IBuyParameters } from '../trading/IBuyParameters';
import { BrokerFactory } from '../infrastructure/BrokerFactory';
import { PUMPFUN_PROGRAM_ID } from '../infrastructure/consts';
import { Connection } from '@solana/web3.js';
import { AnchorProvider } from '@coral-xyz/anchor';
import { Wallet } from '@coral-xyz/anchor/dist/cjs';

export class SwarmBuyCommand {
  private wallets: WalletInfo[];
  private tokenMint: string;
  private buyAmounts: string[];
  private buyDelay: number;
  private slippageBasisPoints: number;
  private broker: IBroker;

  constructor(
    wallets: WalletInfo[],
    tokenMint: string,
    buyAmounts: string[],
    buyDelay: number,
    slippageBasisPoints: number,
    configuration: Configuration
  ) {
    this.wallets = wallets;
    this.tokenMint = tokenMint;
    this.buyAmounts = buyAmounts;
    this.buyDelay = buyDelay;
    this.slippageBasisPoints = slippageBasisPoints;

    const connection = new Connection(configuration.rpcUrl);
    const provider: AnchorProvider = new AnchorProvider(
      connection,
      new Wallet(this.wallets[0].keypair),
      {
        commitment: "finalized",
      });

    const broker = BrokerFactory.create(PUMPFUN_PROGRAM_ID, provider);

    if (!broker) {
      throw new Error('Failed to create broker');
    }

    this.broker = broker;
  }

  private getRandomAmount(): number {
    const randomIndex = Math.floor(Math.random() * this.buyAmounts.length);

    return parseFloat(this.buyAmounts[randomIndex]);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async execute(): Promise<void> {
    const selectedWallets = this.wallets.filter(wallet => wallet.selected);

    if (selectedWallets.length === 0) {
      throw new Error('No wallets selected');
    }

    for (const wallet of selectedWallets) {
      const buyParameters: IBuyParameters = {
        buyer: wallet.keypair,
        tokenMint: this.tokenMint,
        amountInSol: this.getRandomAmount(),
        slippageBasisPoints: this.slippageBasisPoints,
      };

      await this.broker.buy(buyParameters);

      if (this.buyDelay > 0) {
        await this.delay(this.buyDelay * 1000); // Convert seconds to milliseconds
      }
    }
  }
}