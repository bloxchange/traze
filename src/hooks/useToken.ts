import type { TokenState } from '@/models/token';
import { createContext, useContext } from 'react';

interface TokenContextType {
  tokenState: TokenState;
  setTokenByMint: (mint: string) => Promise<void>;
  clearToken: () => void;
}

export const TokenContext = createContext<TokenContextType | undefined>(
  undefined
);

export const useToken = () => {
  const context = useContext(TokenContext);

  if (!context) {
    throw new Error('useToken must be used within a TokenProvider');
  }

  return context;
};
