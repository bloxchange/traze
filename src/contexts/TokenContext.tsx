import React, { useState, useEffect } from 'react';
import { Connection } from '@solana/web3.js';
import type { TokenState } from '../models/token';
import { GetTokenInformationCommand } from '../domain/commands/GetTokenInformationCommand';
import { TranslateLogsCommand } from '../domain/commands/TranslateLogsCommand';
import { TokenContext, useConfiguration } from '../hooks';
import { WebSocketManager } from '../domain/infrastructure/websocket/WebSocketManager';

export const TokenProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { configuration } = useConfiguration();
  const webSocketManager = WebSocketManager.getInstance();
  const [tokenState, setTokenState] = useState<TokenState>({
    currentToken: null,
    loading: false,
    error: null,
  });

  useEffect(() => {
    webSocketManager.initialize(configuration.rpcUrl, configuration.rpcWebsocketUrl);

    if (tokenState.currentToken) {
      webSocketManager.subscribeTokenLogs(tokenState.currentToken.mint, (logs) => {
        const translateLogsCommand = new TranslateLogsCommand();
        const translatedLog = translateLogsCommand.execute(logs);
        console.log('Translated token logs:', translatedLog);
      });
    }

    return () => {
      webSocketManager.disconnect();
    };
  }, [tokenState.currentToken, configuration.rpcUrl, configuration.rpcWebsocketUrl]);

  const getTokenInfo = async (mint: string) => {
    const connection = new Connection(configuration.rpcUrl);

    const getTokenInfoCommand = new GetTokenInformationCommand(mint, connection);

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
    const prevTokenMint = tokenState.currentToken?.mint;

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
      if (mint) {
        if (prevTokenMint) {
          webSocketManager.unsubscribeTokenLogs(prevTokenMint);
        }

        webSocketManager.subscribeTokenLogs(mint, (logs) => {
          const translateLogsCommand = new TranslateLogsCommand();
          const translatedLog = translateLogsCommand.execute(logs);
          console.log('Translated token logs:', translatedLog);
        });
      } else {
        webSocketManager.unsubscribeAll();
      }
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
