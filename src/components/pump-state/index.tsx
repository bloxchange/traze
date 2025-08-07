import React from 'react';
import { Typography, Card, Descriptions, Tag } from 'antd';
import { useTranslation } from 'react-i18next';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { useToken } from '../../hooks';
import { formatPumpStateBalance, formatSmallNumber, getSmallNumberFormatData } from '../../utils/formatBalance';

const { Title } = Typography;

const PumpState: React.FC = () => {
  const { t } = useTranslation();
  const { tokenState } = useToken();
  const { totalInvestedSol, totalReservedSol, currentPrice, bondingCompleted, wallets, currentHoldAmount } =
    tokenState;

  // Calculate total balances from all wallets (convert lamports to SOL)
  const totalWalletSolBalance = Object.values(wallets).reduce(
    (sum, wallet) => sum + (wallet.solBalance / LAMPORTS_PER_SOL),
    0
  );
  
  const totalWalletTokenBalance = Object.values(wallets).reduce(
    (sum, wallet) => sum + wallet.tokenBalance,
    0
  );

  // Calculate total outside SOL
  const totalOutsideSol = (totalReservedSol - totalInvestedSol) / LAMPORTS_PER_SOL;
  
  // Calculate portfolio value and profit/loss
  const portfolioValue = currentHoldAmount * currentPrice; // Value in lamports
  const portfolioValueSol = portfolioValue / LAMPORTS_PER_SOL; // Convert to SOL
  const investedSol = totalInvestedSol / LAMPORTS_PER_SOL; // Convert to SOL
  const profitLoss = portfolioValueSol - investedSol;
  const profitLossPercentage = investedSol > 0 ? (profitLoss / investedSol) * 100 : 0;
  
  const isProfitable = profitLoss >= 0;

  return (
    <Card variant="borderless">
      <Title level={4} style={{ marginBottom: '24px' }}>
        {t('pumpState.title', 'Pump State')}
      </Title>

      <Descriptions bordered column={1}>
        <Descriptions.Item
            label={t('pumpState.totalInvestedSol', 'Total Invested SOL')}
          >
            {formatPumpStateBalance(totalInvestedSol / LAMPORTS_PER_SOL, true)} SOL
          </Descriptions.Item>

          <Descriptions.Item
            label={t('pumpState.totalOutsideSol', 'Total Outside SOL')}
          >
            {formatPumpStateBalance(totalOutsideSol, true)} SOL
          </Descriptions.Item>

          <Descriptions.Item
            label={t('pumpState.totalWalletSolBalance', 'Total Wallet SOL Balance')}
          >
            {formatPumpStateBalance(totalWalletSolBalance, true)} SOL
          </Descriptions.Item>

          <Descriptions.Item
            label={t('pumpState.totalWalletTokenBalance', 'Total Wallet Token Balance')}
          >
            {formatPumpStateBalance(totalWalletTokenBalance, false)}
          </Descriptions.Item>

          <Descriptions.Item label={t('pumpState.currentPrice', 'Current Price')}>
            {(() => {
              const priceInSol = currentPrice / LAMPORTS_PER_SOL;
              const formatData = getSmallNumberFormatData(priceInSol);
              
              if (formatData) {
                return (
                  <span>
                    {formatData.prefix}
                    <sub style={{ fontSize: '0.75em', verticalAlign: 'sub' }}>{formatData.zerosCount}</sub>
                    {formatData.digits} SOL
                  </span>
                );
              }
              
              return `${formatSmallNumber(priceInSol)} SOL`;
            })()} 
          </Descriptions.Item>

          <Descriptions.Item label={t('pumpState.currentHoldAmount', 'Current Hold Amount')}>
            {formatPumpStateBalance(currentHoldAmount, false)}
          </Descriptions.Item>

          <Descriptions.Item label={t('pumpState.portfolioValue', 'Portfolio Value')}>
            {formatPumpStateBalance(portfolioValueSol, true)} SOL
          </Descriptions.Item>

          <Descriptions.Item label={t('pumpState.profitLoss', 'Profit/Loss')}>
            <span style={{ color: isProfitable ? '#52c41a' : '#ff4d4f' }}>
              {isProfitable ? '+' : ''}{formatPumpStateBalance(Math.abs(profitLoss), true)} SOL
              {investedSol > 0 && (
                <span style={{ marginLeft: '8px' }}>
                  ({isProfitable ? '+' : '-'}{Math.abs(profitLossPercentage).toFixed(2)}%)
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
