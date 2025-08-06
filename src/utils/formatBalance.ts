/**
 * Formats a balance number with K/M/B suffixes like the wallet list
 * @param balance - The balance to format
 * @param isSOL - Whether this is a SOL balance (affects decimal places)
 * @returns Formatted balance string
 */
export const formatBalance = (balance: number, isSOL: boolean = false): string => {
  const decimals = isSOL ? 3 : 2;

  if (balance >= 1_000_000_000) {
    return `${(balance / 1_000_000_000).toFixed(decimals)}B`;
  }

  if (balance >= 1_000_000) {
    return `${(balance / 1_000_000).toFixed(decimals)}M`;
  }

  if (balance >= 1_000) {
    return `${(balance / 1_000).toFixed(decimals)}K`;
  }

  return balance.toFixed(decimals);
};

/**
 * Formats SOL balance with SOL suffix
 * @param balance - SOL balance to format
 * @returns Formatted SOL balance string
 */
export const formatSolBalance = (balance: number): string => {
  return `${formatBalance(balance, true)} SOL`;
};

/**
 * Formats token balance with appropriate formatting
 * @param balance - Token balance to format
 * @param symbol - Token symbol (optional)
 * @returns Formatted token balance string
 */
export const formatTokenBalance = (balance: number, symbol?: string): string => {
  const formatted = formatBalance(balance, false);
  return symbol ? `${formatted} ${symbol}` : formatted;
};

/**
 * Formats balance for display in pump state (matches wallet list formatting)
 * @param balance - Balance to format
 * @param isSOL - Whether this is a SOL balance
 * @returns Formatted balance string without suffix
 */
export const formatPumpStateBalance = (balance: number, isSOL: boolean = false): string => {
  return formatBalance(balance, isSOL);
};