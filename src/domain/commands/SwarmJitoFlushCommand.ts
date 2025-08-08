import type { WalletInfo, Configuration } from '@/models';
import type { IBroker } from '../trading/IBroker';
import type { PumpFunSellParameters } from '../trading/pumpfun/SellParameters';
import { BrokerFactory } from '../infrastructure/BrokerFactory';
import { PUMPFUN_PROGRAM_ID } from '../infrastructure/consts';
import { PublicKey } from '@solana/web3.js';
import { ConnectionManager } from '../infrastructure/ConnectionManager';
import { AnchorProvider } from '@coral-xyz/anchor';
import NodeWallet from '../infrastructure/NodeWallet';
import { getTokenBalance } from '../rpc/getTokenBalance';
import { getBrokerProgramId } from '../utils/bondingCurveUtils';

export class SwarmJitoFlushCommand {
  private wallets: WalletInfo[];
  private tokenMint: string;
  private slippageBasisPoints: bigint;
  private jitoTipAmount: number;
  private priorityFeeInSol: number;
  private broker: IBroker;
  private jitoEndpoint: string;

  constructor(
    wallets: WalletInfo[],
    tokenMint: string,
    slippageBasisPoints: bigint,
    jitoTipAmount: number,
    priorityFeeInSol: number,
    configuration: Configuration
  ) {
    this.wallets = wallets;
    this.tokenMint = tokenMint;
    this.slippageBasisPoints = slippageBasisPoints;
    this.jitoTipAmount = jitoTipAmount;
    this.priorityFeeInSol = priorityFeeInSol;

    this.jitoEndpoint = configuration.jitoEndpoint;

    // Initialize with default broker, will be updated in execute()
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

    // Check bonding curve status and get appropriate broker
    const connection = ConnectionManager.getInstance().getConnection();
    const programId = await getBrokerProgramId(connection, this.tokenMint);

    console.log(
      `🔍 Bonding curve status check: Using ${programId === PUMPFUN_PROGRAM_ID ? 'PumpFun' : 'PumpFunAmm'} broker for token ${this.tokenMint}`
    );

    // Create provider and broker based on bonding curve status
    const provider: AnchorProvider = new AnchorProvider(
      connection,
      new NodeWallet(this.wallets[0].keypair),
      {
        commitment: 'finalized',
      }
    );

    const broker = BrokerFactory.create(programId, provider);

    if (!broker) {
      throw new Error(`Failed to create broker for program ID: ${programId}`);
    }

    this.broker = broker;

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

    const sellParametersArray: PumpFunSellParameters[] = [];

    for (const wallet of selectedWallets) {
      const sellAmount = await this.calculateSellAmount(wallet);

      if (sellAmount <= 0) {
        continue;
      }

      sellParametersArray.push({
        seller: wallet.keypair,
        mint: new PublicKey(this.tokenMint),
        sellTokenAmount: sellAmount,
        slippageBasisPoints: this.slippageBasisPoints,
        priorityFeeInSol: this.priorityFeeInSol,
        maxCurrentPriorityFee: maxCurrentPriorityUnitPrice,
        commitment: 'finalized',
        finality: 'finalized',
      });
    }

    if (sellParametersArray.length > 0) {
      await this.broker.jitoSell(
        sellParametersArray,
        this.jitoTipAmount,
        this.jitoEndpoint
      );
    }
  }
}
