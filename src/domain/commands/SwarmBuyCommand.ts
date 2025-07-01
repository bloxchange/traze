import type { WalletInfo, Configuration } from '@/models';
import type { IBroker } from '../trading/IBroker';
import type { IBuyParameters } from '../trading/IBuyParameters';
import { BrokerFactory } from '../infrastructure/BrokerFactory';
import { PUMPFUN_PROGRAM_ID } from '../infrastructure/consts';
import { Connection, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { AnchorProvider } from '@coral-xyz/anchor';
import NodeWallet from '../infrastructure/NodeWallet';

export class SwarmBuyCommand {
  private wallets: WalletInfo[];
  private tokenMint: string;
  private buyAmounts: string[];
  private buyDelay: number;
  private slippageBasisPoints: number;
  private priorityFeeInSol: number;
  private connection: Connection;
  private broker: IBroker;

  constructor(
    wallets: WalletInfo[],
    tokenMint: string,
    buyAmounts: string[],
    buyDelay: number,
    slippageBasisPoints: number,
    priorityFeeInSol: number,
    configuration: Configuration
  ) {
    this.wallets = wallets;
    this.tokenMint = tokenMint;
    this.buyAmounts = buyAmounts;
    this.buyDelay = buyDelay;
    this.slippageBasisPoints = slippageBasisPoints;
    this.priorityFeeInSol = priorityFeeInSol;

    const connection = new Connection(configuration.rpcUrl);

    this.connection = connection;

    const provider: AnchorProvider = new AnchorProvider(
      connection,
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

  private async getRandomAmount(wallet: PublicKey, priorityFeeInSol: number): Promise<number> {
    const randomIndex = Math.floor(Math.random() * this.buyAmounts.length);

    const estimatedAmount = parseFloat(this.buyAmounts[randomIndex]);

    const balance = (await this.connection.getBalance(wallet, 'confirmed'))
      / LAMPORTS_PER_SOL;

    const availableBalance = balance - priorityFeeInSol;

    return availableBalance > estimatedAmount ? estimatedAmount : availableBalance;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async execute(): Promise<void> {
    const selectedWallets = this.wallets.filter((wallet) => wallet.selected);

    if (selectedWallets.length === 0) {
      throw new Error('No wallets selected');
    }

    const prioritizationFees = await this.connection.getRecentPrioritizationFees({
      lockedWritableAccounts: [new PublicKey(this.tokenMint)],
    });

    let maxCurrentPriorityUnitPrice = 0;

    prioritizationFees.forEach(({ prioritizationFee }) => {
      if (prioritizationFee > maxCurrentPriorityUnitPrice) {
        maxCurrentPriorityUnitPrice = prioritizationFee;
      }
    });

    for (const wallet of selectedWallets) {
      const amountInSol = await this.getRandomAmount(wallet.keypair.publicKey, this.priorityFeeInSol);

      if (amountInSol <= 0) {
        continue;
      }

      const buyParameters: IBuyParameters = {
        buyer: wallet.keypair,
        tokenMint: this.tokenMint,
        amountInSol: amountInSol,
        slippageBasisPoints: this.slippageBasisPoints,
        priorityFeeInSol: this.priorityFeeInSol,
        maxCurrentPriorityFee: maxCurrentPriorityUnitPrice,
      };

      await this.broker.buy(buyParameters);

      if (this.buyDelay > 0) {
        await this.delay(this.buyDelay * 1000); // Convert seconds to milliseconds
      }
    }
  }
}
