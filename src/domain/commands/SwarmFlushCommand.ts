import type { WalletInfo, Configuration } from '@/models';
import type { IBroker } from '../trading/IBroker';
import type { ISellParameters } from '../trading/ISellParameters';
import { BrokerFactory } from '../infrastructure/BrokerFactory';
import { PUMPFUN_PROGRAM_ID } from '../infrastructure/consts';
import { Connection, PublicKey } from '@solana/web3.js';
import { AnchorProvider } from '@coral-xyz/anchor';
import NodeWallet from '../infrastructure/NodeWallet';
import { getTokenBalance } from '../rpc/getTokenBalance';

export class SwarmFlushCommand {
  private wallets: WalletInfo[];
  private tokenMint: string;
  private slippageBasisPoints: bigint;
  private broker: IBroker;
  private connection: Connection;

  constructor(
    wallets: WalletInfo[],
    tokenMint: string,
    slippageBasisPoints: bigint,
    configuration: Configuration
  ) {
    this.wallets = wallets;
    this.tokenMint = tokenMint;
    this.slippageBasisPoints = slippageBasisPoints;

    this.connection = new Connection(configuration.rpcUrl);
    const provider: AnchorProvider = new AnchorProvider(
      this.connection,
      new NodeWallet(this.wallets[0].keypair),
      {
        commitment: "finalized",
      });

    const broker = BrokerFactory.create(PUMPFUN_PROGRAM_ID, provider);
    if (!broker) {
      throw new Error('Failed to create broker');
    }
    this.broker = broker;
  }

  private async calculateSellAmount(wallet: WalletInfo): Promise<bigint> {
    const balance = await getTokenBalance(this.connection, wallet.publicKey, this.tokenMint);
    return BigInt(balance);
  }

  async execute(): Promise<void> {
    const selectedWallets = this.wallets.filter(wallet => wallet.selected);

    if (selectedWallets.length === 0) {
      throw new Error('No wallets selected');
    }

    for (const wallet of selectedWallets) {
      const sellAmount = await this.calculateSellAmount(wallet);
      const sellParameters: ISellParameters = {
        seller: wallet.keypair,
        mint: new PublicKey(this.tokenMint),
        sellTokenAmount: sellAmount,
        slippageBasisPoints: this.slippageBasisPoints
      };

      await this.broker.sell(sellParameters);
    }
  }
}