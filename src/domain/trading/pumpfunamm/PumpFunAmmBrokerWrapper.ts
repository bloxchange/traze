import type { IBroker } from '../IBroker';
import type { IBuyParameters } from '../IBuyParameters';
import type { ISellParameters } from '../ISellParameters';
import type TradeEventInfo from '../../models/TradeEventInfo';
import { PumpFunAmmBroker, type PumpFunAmmConfig, type BuyParams, type SellParams } from './PumpFunAmmBroker';
import { PublicKey,  LAMPORTS_PER_SOL, Connection, type AccountInfo, type GetProgramAccountsResponse, Transaction, sendAndConfirmTransaction } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import { getAssociatedTokenAddress } from '@solana/spl-token';
import { PUMPFUN_AMM_PROGRAM_ID, WRAPPED_SOL_MINT } from '../../infrastructure/consts';
import { PoolAccount } from './PoolAccount';
import { getBalance } from '@/domain/rpc';
import { PumpAmmSdk } from '@pump-fun/pump-swap-sdk';

export class PumpFunAmmBrokerWrapper implements IBroker {
  private ammBroker: PumpFunAmmBroker;
  private connection: Connection;
  private pumpAmmSdk: PumpAmmSdk;

  constructor(config: PumpFunAmmConfig) {
    this.ammBroker = new PumpFunAmmBroker(config);
    this.connection = config.provider.connection;
    this.pumpAmmSdk = new PumpAmmSdk(this.connection);
  }

  /**
   * Get liquidity pools by token mint using getProgramAccounts
   * @param tokenMint - The token mint address to filter pools by
   * @returns Array of liquidity pool accounts
   */
  private async getLiquidityPoolsByTokenMint(tokenMint: string) {
    try {
      const programId = new PublicKey(PUMPFUN_AMM_PROGRAM_ID);

      let accounts = await this.connection.getProgramAccounts(programId, {
        filters: [
          {
            memcmp: {
              offset: 43,
              bytes: tokenMint
            }
          },
          {
            memcmp: {
              offset: 75,
              bytes: WRAPPED_SOL_MINT
            }
          }
        ],
      });

      accounts = accounts.concat(await this.connection.getProgramAccounts(programId, {
        filters: [
          {
            memcmp: {
              offset: 43,
              bytes: WRAPPED_SOL_MINT
            }
          },
          {
            memcmp: {
              offset: 75,
              bytes: tokenMint
            }
          }
        ],
      }));
      
      console.log(`Found ${accounts.length} liquidity pools for token ${tokenMint}`);

      return accounts;
    } catch (error) {
      console.error('Error fetching liquidity pools:', error);
      return [];
    }
  }

  private async getBestBuyPool(poolResponses: GetProgramAccountsResponse) : Promise<{poolAccount: PoolAccount | null, price: number}>{
    let bestPool: PoolAccount | null = null;

    let bestPrice = new BN(99999999999);

    for (const poolResponse of poolResponses) {
      const poolAccount = PoolAccount.fromBuffer(poolResponse.account.data);
      
      if (bestPool === null) {
        bestPool = poolAccount;
      } else {
        const baseTokenAmount = await getBalance(poolAccount.poolBaseTokenAccount.toBase58());

        const quoteTokenAmount = await getBalance(poolAccount.poolQuoteTokenAccount.toBase58());

        let price = quoteTokenAmount / baseTokenAmount;

        if (poolAccount.baseMint.toBase58() === WRAPPED_SOL_MINT) {
          price = baseTokenAmount / quoteTokenAmount;
        }

        if (price < bestPrice) {
          bestPrice = price;

          bestPool = poolAccount;
        }
      }
    }

    return { poolAccount: bestPool, price: bestPrice};
  }

  async transfer(amount: number, from: string, to: string): Promise<void> {
    throw new Error('Transfer method not implemented for PumpFunAmm');
  }

  async buy(buyParameters: IBuyParameters): Promise<string | null> {
    try {
      // Get liquidity pools for the token
      const liquidityPools = await this.getLiquidityPoolsByTokenMint(buyParameters.tokenMint);
      
      if (!liquidityPools || liquidityPools.length === 0) {
        throw new Error('No liquidity pools found for token');
      }
      
      // Get the best pool for buying
      const { poolAccount } = await this.getBestBuyPool(liquidityPools);
      
      if (!poolAccount) {
        throw new Error('No suitable pool found for buying');
      }
      
      // Find the pool ID from the liquidity pools response
      const poolResponse = liquidityPools.find(pool => {
        try {
          const account = PoolAccount.fromBuffer(pool.account.data);
          return account.baseMint.equals(poolAccount.baseMint) && 
                 account.quoteMint.equals(poolAccount.quoteMint);
        } catch {
          return false;
        }
      });
      
      if (!poolResponse) {
        throw new Error('Pool response not found');
      }
      
      const poolKey = poolResponse.pubkey;
      
      // Create swap state using the SDK
      const swapSolanaState = await this.pumpAmmSdk.swapSolanaState(
        poolKey,
        buyParameters.buyer.publicKey
      );
      
      // Convert SOL amount to lamports and use as quote input
       const quoteAmount = new BN(buyParameters.amountInSol * LAMPORTS_PER_SOL);
       const slippage = buyParameters.slippageBasisPoints / 100; // Convert basis points to percentage
      
      // Use buyQuoteInput to buy tokens with SOL
       const instructions = await this.pumpAmmSdk.buyQuoteInput(
         swapSolanaState,
         quoteAmount,
         slippage
       );
       
       console.log(`Generated ${instructions.length} buy instructions`);
       
       // Create and send the transaction
       const transaction = new Transaction();
       instructions.forEach(instruction => transaction.add(instruction));
       
       // Get recent blockhash
       const { blockhash } = await this.connection.getLatestBlockhash();
       transaction.recentBlockhash = blockhash;
       transaction.feePayer = buyParameters.buyer.publicKey;
       
       // Sign and send the transaction
       const signature = await sendAndConfirmTransaction(
         this.connection,
         transaction,
         [buyParameters.buyer],
         {
           commitment: 'confirmed',
           maxRetries: 3
         }
       );
       
       console.log(`Buy transaction sent with signature: ${signature}`);
       return signature;
      
    } catch (error) {
      console.error('Error in buy operation:', error);
      throw error;
    }
  }

  async sell(sellParameters: ISellParameters): Promise<string | null> {
    try {
      // Get liquidity pools for the token
      const liquidityPools = await this.getLiquidityPoolsByTokenMint(sellParameters.mint.toBase58());
      
      if (!liquidityPools || liquidityPools.length === 0) {
        throw new Error('No liquidity pools found for token');
      }
      
      // Get the best pool for selling
      const { poolAccount } = await this.getBestBuyPool(liquidityPools);
      
      if (!poolAccount) {
        throw new Error('No suitable pool found for selling');
      }
      
      // Find the pool ID from the liquidity pools response
      const poolResponse = liquidityPools.find(pool => {
        try {
          const account = PoolAccount.fromBuffer(pool.account.data);
          return account.baseMint.equals(poolAccount.baseMint) && 
                 account.quoteMint.equals(poolAccount.quoteMint);
        } catch {
          return false;
        }
      });
      
      if (!poolResponse) {
        throw new Error('Pool response not found');
      }
      
      const poolKey = poolResponse.pubkey;
      
      // Create swap state using the SDK
      const swapSolanaState = await this.pumpAmmSdk.swapSolanaState(
        poolKey,
        sellParameters.seller.publicKey
      );
      
      // Convert token amount to BN and use as base input
      const baseAmount = new BN(sellParameters.sellTokenAmount.toString());
      const slippage = Number(sellParameters.slippageBasisPoints) / 10000; // Convert basis points to percentage
      
      // Use sellBaseInput to sell tokens for SOL
       const instructions = await this.pumpAmmSdk.sellBaseInput(
         swapSolanaState,
         baseAmount,
         slippage
       );
       
       console.log(`Generated ${instructions.length} sell instructions`);
       
       // Create and send the transaction
       const transaction = new Transaction();
       instructions.forEach(instruction => transaction.add(instruction));
       
       // Get recent blockhash
       const { blockhash } = await this.connection.getLatestBlockhash();
       transaction.recentBlockhash = blockhash;
       transaction.feePayer = sellParameters.seller.publicKey;
       
       // Sign and send the transaction
       const signature = await sendAndConfirmTransaction(
         this.connection,
         transaction,
         [sellParameters.seller],
         {
           commitment: 'confirmed',
           maxRetries: 3
         }
       );
       
       console.log(`Sell transaction sent with signature: ${signature}`);
       return signature;
      
    } catch (error) {
      console.error('Error in sell operation:', error);
      throw error;
    }
  }

  async getBalance(address: string): Promise<number> {
    throw new Error('getBalance method not implemented for PumpFunAmm');
  }

  async getPrice(symbol: string): Promise<number> {
    throw new Error('getPrice method not implemented for PumpFunAmm');
  }

  async getTokenBalance(address: string, token: string): Promise<number> {
    throw new Error('getTokenBalance method not implemented for PumpFunAmm');
  }

  async swap(
    fromToken: string,
    toToken: string,
    fromAmount: number,
    toAmount: number,
    walletAddress: string
  ): Promise<void> {
    throw new Error('swap method not implemented for PumpFunAmm');
  }

  async withdraw(amount: number, token: string, to: string): Promise<void> {
    throw new Error('withdraw method not implemented for PumpFunAmm');
  }

  async jitoSell(
    sellParameters: ISellParameters[],
    jitoTipAmount: number,
    jitoUrl: string
  ): Promise<string | null> {
    throw new Error('jitoSell method not implemented for PumpFunAmm');
  }

  translateLogs(logs: string[]): TradeEventInfo {
    throw new Error('translateLogs method not implemented for PumpFunAmm');
  }
}