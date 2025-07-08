import React, { useState, useEffect } from 'react';
import type { Logs } from '@solana/web3.js';
import type { TokenState } from '../models/token';
import { GetTokenInformationCommand } from '../domain/commands/GetTokenInformationCommand';
import { TokenContext, useConfiguration, useRpcConnection } from '../hooks';
import { GetTradeInfoCommand } from '../domain/commands/GetTradeInfoCommand';
import { globalEventEmitter } from '../domain/infrastructure/events/EventEmitter';
import { EVENTS } from '../domain/infrastructure/events/types';
export const TokenProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { configuration } = useConfiguration();

  const { connectionState } = useRpcConnection();

  const { connectionManager } = connectionState;

  const [tokenState, setTokenState] = useState<TokenState>({
    currentToken: null,
    loading: false,
    error: null,
  });

  useEffect(() => {
    if (tokenState.currentToken) {
      connectionManager?.subscribeTokenLogs(tokenState.currentToken.mint, async (logs: Logs) => {
        const getTradeInfoCommand = new GetTradeInfoCommand(logs.signature);

        const tradeInfo = await getTradeInfoCommand.execute();

        if (tradeInfo) {
          globalEventEmitter.emit(EVENTS.BuySuccess, tradeInfo);
        }
      });
    }

    return () => {
      connectionManager?.unsubscribeAll();
    };
  }, [tokenState.currentToken, configuration.rpcUrl, configuration.rpcWebsocketUrl]);

  const getTokenInfo = async (mint: string) => {
    const getTokenInfoCommand = new GetTokenInformationCommand(mint);

    const tokenInfo = await getTokenInfoCommand.execute();
    return tokenInfo;
  };

  if (location.pathname?.length > 20 && !tokenState.currentToken && !tokenState.loading) {
    setTokenState((prev) => ({ ...prev, loading: true, error: null }));
    getTokenInfo(location.pathname.slice(1)).then((tokenInfo) => {
      setTokenState((prev) => ({
        ...prev,
        currentToken: tokenInfo,
        loading: false,
      }));
    });
  }

  const setTokenByMint = async (mint: string) => {
    // const prevTokenMint = tokenState.currentToken?.mint;

    setTokenState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const tokenInfo = await getTokenInfo(mint);

      // TODO: update the location path by new token mint
      window.history.replaceState(null, `Traze - ${tokenInfo.symbol}`, `/${tokenInfo.mint}`);

      setTokenState((prev) => ({
        ...prev,
        currentToken: tokenInfo,
        loading: false,
      }));

      // Subscribe to token logs
      // if (mint) {
      //   if (prevTokenMint) {
      //     connectionManager?.unsubscribeTokenLogs(prevTokenMint);
      //   }

      //   connectionManager?.subscribeTokenLogs(mint, (logs: Logs) => {
      //     const translateLogsCommand = new TranslateLogsCommand();
      //     const translatedLog = translateLogsCommand.execute(logs);
      //     console.log('Translated token logs:', translatedLog);
      //   });
      // } else {
      //   connectionManager?.unsubscribeAll();
      // }
    } catch (error) {
      setTokenState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to fetch token information',
        loading: false,
      }));
    }
  };

  const clearToken = () => {
    setTokenState({
      currentToken: null,
      loading: false,
      error: null,
    });
  };

  return (
    <TokenContext.Provider value={{ tokenState, setTokenByMint, clearToken }}>
      {children}
    </TokenContext.Provider>
  );
};
