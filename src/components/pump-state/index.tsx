import React, { useMemo, useState, useEffect } from 'react';
import { Typography, Card, Descriptions, Tag } from 'antd';
import { useTranslation } from 'react-i18next';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { useToken } from '../../hooks';
import {
  formatPumpStateBalance,
  formatSmallNumber,
  getSmallNumberFormatData,
} from '../../utils/formatBalance';
import { GetTokenInformationCommand } from '../../domain/commands/GetTokenInformationCommand';

const { Title } = Typography;

const PumpState: React.FC = () => {
  const { t } = useTranslation();
  const { tokenState } = useToken();
  const {
    totalInvestedSol,
    totalReservedSol,
    currentPrice,
    bondingCompleted,
    wallets,
    currentHoldAmount,
  } = tokenState;
  const [tokenDecimals, setTokenDecimals] = useState<number>(6); // Default to 6 decimals

  // Fetch token decimals when current token changes
  useEffect(() => {
    const fetchTokenDecimals = async () => {
      if (tokenState.currentToken?.mint) {
        try {
          const tokenInfo = await new GetTokenInformationCommand(tokenState.currentToken.mint).execute();
          setTokenDecimals(tokenInfo.decimals);
        } catch (error) {
          console.warn('Failed to get token decimals, using default:', error);
          setTokenDecimals(6); // Fallback to 6 decimals
        }
      }
    };

    fetchTokenDecimals();
  }, [tokenState.currentToken?.mint]);

  // Helper function to format raw token balance
  const formatTokenBalance = (rawBalance: number) => {
    const formattedBalance = rawBalance / Math.pow(10, tokenDecimals);
    return formatPumpStateBalance(formattedBalance, false);
  };

  // Memoize calculations to ensure UI updates when tokenState changes
  const calculations = useMemo(() => {
    // Calculate total balances from all wallets (convert lamports to SOL)
    const totalWalletSolBalance = Object.values(wallets).reduce(
      (sum, wallet) => sum + wallet.solBalance / LAMPORTS_PER_SOL,
      0
    );

    const totalWalletTokenBalance = Object.values(wallets).reduce(
      (sum, wallet) => sum + wallet.tokenBalance,
      0
    );

    // Calculate total outside SOL
    const totalOutsideSol =
      (totalReservedSol - totalInvestedSol) / LAMPORTS_PER_SOL;

    // Calculate portfolio value and profit/loss
    // Portfolio value = total tokens * price per token (in SOL)
    const portfolioValueSol = totalWalletTokenBalance * currentPrice; // Value in SOL
    const investedSol = totalInvestedSol / LAMPORTS_PER_SOL; // Convert to SOL
    const profitLoss = portfolioValueSol - investedSol;
    const profitLossPercentage =
      investedSol > 0 ? (profitLoss / investedSol) * 100 : 0;
    const isProfitable = profitLoss >= 0;

    return {
      totalWalletSolBalance,
      totalWalletTokenBalance,
      totalOutsideSol,
      portfolioValueSol,
      investedSol,
      profitLoss,
      profitLossPercentage,
      isProfitable,
    };
  }, [
    wallets,
    totalReservedSol,
    totalInvestedSol,
    currentHoldAmount,
    currentPrice,
  ]);

  const {
    totalWalletSolBalance,
    totalWalletTokenBalance,
    totalOutsideSol,
    portfolioValueSol,
    investedSol,
    profitLoss,
    profitLossPercentage,
    isProfitable,
  } = calculations;

  return (
    <Card variant="borderless">
      <Title level={4} style={{ marginBottom: '24px' }}>
        {t('pumpState.title', 'Pump State')}
      </Title>

      <Descriptions bordered column={1}>
        <Descriptions.Item
          label={t('pumpState.totalInvestedSol', 'Total Invested SOL')}
        >
          {formatPumpStateBalance(totalInvestedSol / LAMPORTS_PER_SOL, true)}{' '}
          SOL
        </Descriptions.Item>

        <Descriptions.Item
          label={t('pumpState.totalOutsideSol', 'Total Outside SOL')}
        >
          {formatPumpStateBalance(totalOutsideSol, true)} SOL
        </Descriptions.Item>

        <Descriptions.Item
          label={t(
            'pumpState.totalWalletSolBalance',
            'Total Wallet SOL Balance'
          )}
        >
          {formatPumpStateBalance(totalWalletSolBalance, true)} SOL
        </Descriptions.Item>

        <Descriptions.Item
          label={t(
            'pumpState.totalWalletTokenBalance',
            'Total Wallet Token Balance'
          )}
        >
          {formatTokenBalance(totalWalletTokenBalance)}
        </Descriptions.Item>

        <Descriptions.Item label={t('pumpState.currentPrice', 'Current Price')}>
          {(() => {
            // currentPrice is already in SOL per token units after the TokenContext fix
            const priceInSol = currentPrice;
            const formatData = getSmallNumberFormatData(priceInSol);

            if (formatData) {
              return (
                <span>
                  {formatData.prefix}
                  <sub style={{ fontSize: '0.75em', verticalAlign: 'sub' }}>
                    {formatData.zerosCount}
                  </sub>
                  {formatData.digits} SOL
                </span>
              );
            }

            return `${formatSmallNumber(priceInSol)} SOL`;
          })()}
        </Descriptions.Item>

        <Descriptions.Item
          label={t('pumpState.currentHoldAmount', 'Current Hold Amount')}
        >
          {formatPumpStateBalance(currentHoldAmount, false)}
        </Descriptions.Item>

        <Descriptions.Item
          label={t('pumpState.portfolioValue', 'Portfolio Value')}
        >
          {formatPumpStateBalance(portfolioValueSol, true)} SOL
        </Descriptions.Item>

        <Descriptions.Item label={t('pumpState.profitLoss', 'Profit/Loss')}>
          <span style={{ color: isProfitable ? '#52c41a' : '#ff4d4f' }}>
            {isProfitable ? '+' : ''}
            {formatPumpStateBalance(Math.abs(profitLoss), true)} SOL
            {investedSol > 0 && (
              <span style={{ marginLeft: '8px' }}>
                ({isProfitable ? '+' : '-'}
                {Math.abs(profitLossPercentage).toFixed(2)}%)
              </span>
            )}
          </span>
        </Descriptions.Item>

        <Descriptions.Item
          label={t('pumpState.bondingCompleted', 'Bonding Completed')}
        >
          <Tag color={bondingCompleted ? 'green' : 'orange'}>
            {bondingCompleted
              ? t('pumpState.completed', 'Completed')
              : t('pumpState.inProgress', 'In Progress')}
          </Tag>
        </Descriptions.Item>
      </Descriptions>
    </Card>
  );
};

export default PumpState;
