/**
 * Formats a balance number with K/M/B suffixes like the wallet list
 * @param balance - The balance to format
 * @param isSOL - Whether this is a SOL balance (affects decimal places)
 * @returns Formatted balance string
 */
export const formatBalance = (
  balance: number,
  isSOL: boolean = false
): string => {
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
 * Formats SOL balance with SOL suffix and improved precision
 * @param balance - SOL balance in lamports to format
 * @returns Formatted SOL balance string
 */
export const formatSolBalance = (balance: number): string => {
  if (balance === 0) return '0';

  // For very small amounts, use high precision formatting
  if (balance < 0.001) {
    return `${formatSmallNumber(balance)}`;
  }

  // For larger amounts, use the standard formatting with K/M/B suffixes
  return `${formatBalance(balance, true)}`;
};

/**
 * Formats token balance with appropriate formatting
 * @param balance - Token balance to format
 * @param symbol - Token symbol (optional)
 * @returns Formatted token balance string
 */
export const formatTokenBalance = (
  balance: number,
  symbol?: string
): string => {
  const formatted = formatBalance(balance, false);
  return symbol ? `${formatted} ${symbol}` : formatted;
};

/**
 * Formats very small numbers with scientific notation for readability
 * @param value - The number to format
 * @returns Formatted string like "0.0(4)12" for very small numbers
 */
export const formatSmallNumber = (value: number): string => {
  if (value === 0) return '0';
  if (value >= 0.001) return value.toFixed(6).replace(/\.?0+$/, '');

  const str = value.toExponential();
  const [mantissa, exponent] = str.split('e');
  const exp = parseInt(exponent);

  if (exp >= -3) {
    return value.toFixed(Math.abs(exp) + 2).replace(/\.?0+$/, '');
  }

  // For very small numbers, use the 0.0(n)digits format
  const mantissaNum = parseFloat(mantissa);
  const significantDigits = mantissa.replace('.', '').replace('-', '');
  const zerosCount = Math.abs(exp) - 1;

  return `0.0${zerosCount}${significantDigits.substring(0, 4)}`;
};

/**
 * Gets the data needed to format very small numbers with styled subscript
 * @param value - The number to format
 * @returns Object with formatting data or null for regular formatting
 */
export const getSmallNumberFormatData = (
  value: number
): { prefix: string; zerosCount: number; digits: string } | null => {
  if (value === 0 || value >= 0.001) return null;

  const str = value.toExponential();
  const [mantissa, exponent] = str.split('e');
  const exp = parseInt(exponent);

  if (exp >= -3) return null;

  const significantDigits = mantissa.replace('.', '').replace('-', '');
  const zerosCount = Math.abs(exp) - 1;

  return {
    prefix: '0.0',
    zerosCount,
    digits: significantDigits.substring(0, 4),
  };
};

/**
 * Formats balance for display in pump state (matches wallet list formatting)
 * @param balance - Balance to format
 * @param isSOL - Whether this is a SOL balance
 * @returns Formatted balance string without suffix
 */
export const formatPumpStateBalance = (
  balance: number,
  isSOL: boolean = false
): string => {
  return formatBalance(balance, isSOL);
};
