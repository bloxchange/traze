import React, { useState } from 'react';
import type { TokenState } from '../models/token';
import { GetTokenInformationCommand } from '../domain/commands/GetTokenInformationCommand';
import { TokenContext } from '../hooks';
export const TokenProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [tokenState, setTokenState] = useState<TokenState>({
    currentToken: null,
    loading: false,
    error: null,
  });

  const getTokenInfo = async (mint: string) => {
    const getTokenInfoCommand = new GetTokenInformationCommand(mint);

    const tokenInfo = await getTokenInfoCommand.execute();

    return tokenInfo;
  };

  if (
    location.pathname?.length > 20 &&
    !tokenState.currentToken &&
    !tokenState.loading
  ) {
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
      window.history.replaceState(
        null,
        `Traze - ${tokenInfo.symbol}`,
        `/${tokenInfo.mint}`
      );

      setTokenState((prev) => ({
        ...prev,
        currentToken: tokenInfo,
        loading: false,
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
