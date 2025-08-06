import React, { useEffect, useState } from 'react';
import type { TokenState } from '../models/token';
import { GetTokenInformationCommand } from '../domain/commands/GetTokenInformationCommand';
import { GetTradeInfoCommand } from '../domain/commands/GetTradeInfoCommand';
import { TokenContext } from '../hooks';
import { useRpcConnection } from '../hooks/useRpcConnection';
import type { Logs } from '@solana/web3.js';
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
  }, [connectionState]);

  const getTokenInfo = async (mint: string) => {
    const getTokenInfoCommand = new GetTokenInformationCommand(mint);

    const tokenInfo = await getTokenInfoCommand.execute();

    return tokenInfo;
  };

  const handleTokenLogs = (logs: Logs) => {
    console.log('Token transaction logs received:', {
      signature: logs.signature,
      logs: logs.logs,
      err: logs.err,
    });

    const getTradeInfoCommand = new GetTradeInfoCommand(logs.signature);

    getTradeInfoCommand
      .execute()
      .then((tradeInfo) => {
        if (tradeInfo) {
          console.log('Trade info:', tradeInfo);
        } else {
          console.log('No trade info found for signature:', logs.signature);
        }
      })
      .catch((error) => {
        console.error('Error fetching trade info:', error);
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
    });
  };

  return (
    <TokenContext.Provider value={{ tokenState, setTokenByMint, clearToken }}>
      {children}
    </TokenContext.Provider>
  );
};
