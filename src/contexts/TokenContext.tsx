import React, { useEffect, useState } from 'react';
import type { TokenState } from '../models/token';
import { GetTokenInformationCommand } from '../domain/commands/GetTokenInformationCommand';
import { GetTradeInfoCommand } from '../domain/commands/GetTradeInfoCommand';
import { TokenContext } from '../hooks';
import { useRpcConnection } from '../hooks/useRpcConnection';
import { LAMPORTS_PER_SOL, type Logs } from '@solana/web3.js';
import { globalEventEmitter } from '../domain/infrastructure/events/EventEmitter';
import {
  EVENTS,
  type SwarmCreatedData,
  type SwarmClearedData,
  type BalanceFetchedData,
  type BalanceChangeData,
  type BondingCurveFetchedData,
  type TradeInfoFetchedData,
} from '../domain/infrastructure/events/types';
export const TokenProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { connectionState } = useRpcConnection();
  const [tokenState, setTokenState] = useState<TokenState>({
    currentToken: null,
    loading: false,
    error: null,
    totalInvestedSol: 0,
    totalReservedSol: 0,
    currentPrice: 0,
    currentHoldAmount: 0,
    bondingCompleted: false,
    lastUpdated: null,
    wallets: {},
  });

  useEffect(() => {
    if (
      connectionState.connectionManager &&
      location.pathname?.length > 20 &&
      !tokenState.currentToken &&
      !tokenState.loading
    ) {
      setTokenState((prev) => ({ ...prev, loading: true, error: null }));

      const mint = location.pathname.slice(1);

      getTokenInfo(mint)
        .then(async (tokenInfo) => {
          // Subscribe to token logs
          if (connectionState.connectionManager) {
            try {
              await connectionState.connectionManager.subscribeTokenLogs(
                mint,
                handleTokenLogs
              );
            } catch (error) {
              console.error('Error subscribing to token logs:', error);
            }
          }

          setTokenState((prev) => ({
            ...prev,
            currentToken: tokenInfo,
            loading: false,
            totalInvestedSol: 0,
            totalReservedSol: 0,
            currentPrice: 0,
            currentHoldAmount: 0,
            bondingCompleted: false,
            lastUpdated: null,
          }));
        })
        .catch((error) => {
          setTokenState((prev) => ({
            ...prev,
            error:
              error instanceof Error
                ? error.message
                : 'Failed to fetch token information',
            loading: false,
          }));
        });
    }

    // Cleanup function to unsubscribe when component unmounts or dependencies change
    return () => {
      if (connectionState.connectionManager && tokenState.currentToken) {
        connectionState.connectionManager
          .unsubscribeTokenLogs(tokenState.currentToken.mint)
          .catch((error) => {
            console.error(
              'Error unsubscribing from token logs during cleanup:',
              error
            );
          });
      }
    };
  }, [connectionState]);

  const getTokenInfo = async (mint: string) => {
    const getTokenInfoCommand = new GetTokenInformationCommand(mint);

    const tokenInfo = await getTokenInfoCommand.execute();

    return tokenInfo;
  };

  const handleTokenLogs = (logs: Logs) => {
    console.log('🔔 Token transaction logs received:', {
      signature: logs.signature,
      logs: logs.logs,
      err: logs.err,
    });

    const getTradeInfoCommand = new GetTradeInfoCommand(logs.signature);

    getTradeInfoCommand
      .execute()
      .then((tradeInfo) => {
        if (tradeInfo) {
          console.log('✅ Trade info fetched successfully:', tradeInfo);
          // Emit the new TradeInfoFetched event
          globalEventEmitter.emit<TradeInfoFetchedData>(
            EVENTS.TradeInfoFetched,
            { tradeInfo }
          );
          console.log('📡 TradeInfoFetched event emitted');
        } else {
          console.log('❌ No trade info found for signature:', logs.signature);
        }
      })
      .catch((error) => {
        console.error('💥 Error fetching trade info:', error);
      });
  };

  const setTokenByMint = async (mint: string) => {
    const prevTokenMint = tokenState.currentToken?.mint;

    // Unsubscribe from previous token logs if exists
    if (prevTokenMint && connectionState.connectionManager) {
      try {
        await connectionState.connectionManager.unsubscribeTokenLogs(
          prevTokenMint
        );
      } catch (error) {
        console.error('Error unsubscribing from previous token logs:', error);
      }
    }

    setTokenState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const tokenInfo = await getTokenInfo(mint);

      // Subscribe to new token logs
      if (connectionState.connectionManager) {
        try {
          await connectionState.connectionManager.subscribeTokenLogs(
            mint,
            handleTokenLogs
          );
        } catch (error) {
          console.error('Error subscribing to token logs:', error);
        }
      }

      // TODO: update the location path by new token mint
      window.history.replaceState(
        null,
        `Traze - ${tokenInfo.symbol}`,
        `/${tokenInfo.mint}`
      );

      setTokenState((prev) => ({
        ...prev,
        currentToken: tokenInfo,
        loading: false,
        totalInvestedSol: 0,
        totalReservedSol: 0,
        currentPrice: 0,
        currentHoldAmount: 0,
        bondingCompleted: false,
        lastUpdated: null,
      }));
    } catch (error) {
      setTokenState((prev) => ({
        ...prev,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch token information',
        loading: false,
      }));
    }
  };

  const clearToken = () => {
    // Unsubscribe from current token logs if exists
    if (tokenState.currentToken?.mint && connectionState.connectionManager) {
      connectionState.connectionManager
        .unsubscribeTokenLogs(tokenState.currentToken.mint)
        .catch((error) => {
          console.error('Error unsubscribing from token logs:', error);
        });
    }

    setTokenState({
      currentToken: null,
      loading: false,
      error: null,
      totalInvestedSol: 0,
      totalReservedSol: 0,
      currentPrice: 0,
      currentHoldAmount: 0,
      bondingCompleted: false,
      lastUpdated: null,
      wallets: {},
    });
  };

  // Subscribe to swarm and balance events
  useEffect(() => {
    const handleSwarmCreated = (data: SwarmCreatedData) => {
      setTokenState((prev) => {
        const newWallets = { ...prev.wallets };
        data.wallets.forEach((wallet) => {
          // Only add if wallet doesn't exist
          if (!newWallets[wallet.publicKey]) {
            newWallets[wallet.publicKey] = {
              solBalance: wallet.solBalance,
              tokenBalance: wallet.tokenBalance,
            };
          }
        });
        return { ...prev, wallets: newWallets };
      });
    };

    const handleSwarmCleared = (data: SwarmClearedData) => {
      setTokenState((prev) => {
        const newWallets = { ...prev.wallets };
        data.walletPublicKeys.forEach((publicKey) => {
          delete newWallets[publicKey];
        });
        return { ...prev, wallets: newWallets };
      });
    };

    const handleBalanceFetched = (data: BalanceFetchedData) => {
      const publicKey = data.owner.toString();
      setTokenState((prev) => ({
        ...prev,
        wallets: {
          ...prev.wallets,
          [publicKey]: {
            solBalance: data.solBalance,
            tokenBalance: data.tokenBalance,
          },
        },
      }));
    };

    const handleBalanceChanged = (data: BalanceChangeData) => {
      const publicKey = data.owner.toString();
      setTokenState((prev) => {
        const currentWallet = prev.wallets[publicKey];
        if (currentWallet) {
          let updatedState = {
            ...prev,
            wallets: {
              ...prev.wallets,
              [publicKey]: {
                solBalance:
                  data.tokenMint === ''
                    ? currentWallet.solBalance + data.amount
                    : currentWallet.solBalance,
                tokenBalance:
                  data.tokenMint !== ''
                    ? currentWallet.tokenBalance + data.amount
                    : currentWallet.tokenBalance,
              },
            },
          };

          // Track totalInvestedSol for swap operations with SOL
          if (data.source === 'swap' && data.tokenMint === '') {
            updatedState.totalInvestedSol = prev.totalInvestedSol - data.amount;
          }

          return updatedState;
        }
        return prev;
      });
    };

    const handleBondingCurveFetched = (data: BondingCurveFetchedData) => {
      console.log(data);
      setTokenState((prev) => ({
        ...prev,
        bondingCompleted: data.complete,
        lastUpdated: new Date(),
        totalReservedSol: Number(data.realSolReserves),
      }));
    };

    const handleTradeInfoFetched = (data: TradeInfoFetchedData) => {
      const { tradeInfo } = data;
      console.log('💰 Processing trade info for price calculation:', tradeInfo);

      setTokenState((prev) => {
        let newState = { ...prev };

        // Calculate price from trade data
        // For buy: price = SOL spent / tokens received
        // Calculate price as absolute value of fromAmount / toAmount
        let calculatedPrice = 0;

        if (tradeInfo.toTokenAmount !== 0) {
          // Price = absolute value of fromAmount / toAmount
          // Convert fromTokenAmount from lamports to SOL for proper price calculation
          // since toTokenAmount is already decimal-adjusted from uiTokenAmount.amount
          calculatedPrice =
            Math.abs(tradeInfo.fromTokenAmount) / LAMPORTS_PER_SOL /
            Math.abs(tradeInfo.toTokenAmount);
        }

        newState.currentPrice = calculatedPrice;

        newState.lastUpdated = new Date();

        return newState;
      });
    };

    globalEventEmitter.on(EVENTS.SwarmCreated, handleSwarmCreated);
    globalEventEmitter.on(EVENTS.SwarmCleared, handleSwarmCleared);
    globalEventEmitter.on(EVENTS.BalanceFetched, handleBalanceFetched);
    globalEventEmitter.on(EVENTS.BalanceChanged, handleBalanceChanged);
    globalEventEmitter.on(
      EVENTS.BondingCurveFetched,
      handleBondingCurveFetched
    );
    globalEventEmitter.on(EVENTS.TradeInfoFetched, handleTradeInfoFetched);

    return () => {
      globalEventEmitter.off(EVENTS.SwarmCreated, handleSwarmCreated);
      globalEventEmitter.off(EVENTS.SwarmCleared, handleSwarmCleared);
      globalEventEmitter.off(EVENTS.BalanceFetched, handleBalanceFetched);
      globalEventEmitter.off(EVENTS.BalanceChanged, handleBalanceChanged);
      globalEventEmitter.off(
        EVENTS.BondingCurveFetched,
        handleBondingCurveFetched
      );
      globalEventEmitter.off(EVENTS.TradeInfoFetched, handleTradeInfoFetched);
    };
  }, []);

  // Subscribe to wallet-specific balance change events
  useEffect(() => {
    const walletEventHandlers = new Map<
      string,
      (data: BalanceChangeData) => void
    >();

    const handleWalletBalanceChanged =
      (publicKey: string) => (data: BalanceChangeData) => {
        setTokenState((prev) => {
          const currentWallet = prev.wallets[publicKey];
          if (currentWallet) {
            return {
              ...prev,
              totalInvestedSol:
                data.source === 'swap' && data.tokenMint === ''
                  ? prev.totalInvestedSol - data.amount
                  : prev.totalInvestedSol,
              wallets: {
                ...prev.wallets,
                [publicKey]: {
                  solBalance:
                    data.tokenMint === ''
                      ? currentWallet.solBalance + data.amount // Convert lamports to SOL
                      : currentWallet.solBalance,
                  tokenBalance:
                    data.tokenMint !== ''
                      ? currentWallet.tokenBalance + data.amount
                      : currentWallet.tokenBalance,
                },
              },
            };
          }
          return prev;
        });
      };

    // Subscribe to balance change events for each wallet
    Object.keys(tokenState.wallets).forEach((publicKey) => {
      const eventName = `${EVENTS.BalanceChanged}_${publicKey}`;
      const handler = handleWalletBalanceChanged(publicKey);
      walletEventHandlers.set(publicKey, handler);
      globalEventEmitter.on(eventName, handler);
    });

    return () => {
      // Unsubscribe from all wallet-specific events
      walletEventHandlers.forEach((handler, publicKey) => {
        const eventName = `${EVENTS.BalanceChanged}_${publicKey}`;
        globalEventEmitter.off(eventName, handler);
      });
    };
  }, [Object.keys(tokenState.wallets).join(',')]); // Re-run when wallet list changes

  // Subscribe to wallet-specific balance fetched events
  useEffect(() => {
    const walletFetchedHandlers = new Map<
      string,
      (data: BalanceFetchedData) => void
    >();

    const handleWalletBalanceFetched =
      (publicKey: string) => (data: BalanceFetchedData) => {
        setTokenState((prev) => ({
          ...prev,
          wallets: {
            ...prev.wallets,
            [publicKey]: {
              solBalance: data.solBalance,
              tokenBalance: data.tokenBalance,
            },
          },
        }));
      };

    // Subscribe to balance fetched events for each wallet
    Object.keys(tokenState.wallets).forEach((publicKey) => {
      const eventName = `${EVENTS.BalanceFetched}_${publicKey}`;
      const handler = handleWalletBalanceFetched(publicKey);
      walletFetchedHandlers.set(publicKey, handler);
      globalEventEmitter.on(eventName, handler);
    });

    return () => {
      // Unsubscribe from all wallet-specific events
      walletFetchedHandlers.forEach((handler, publicKey) => {
        const eventName = `${EVENTS.BalanceFetched}_${publicKey}`;
        globalEventEmitter.off(eventName, handler);
      });
    };
  }, [Object.keys(tokenState.wallets).join(',')]); // Re-run when wallet list changes

  return (
    <TokenContext.Provider value={{ tokenState, setTokenByMint, clearToken }}>
      {children}
    </TokenContext.Provider>
  );
};
