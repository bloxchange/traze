import React from 'react';
import { Typography, Card, Descriptions, Tag } from 'antd';
import { useTranslation } from 'react-i18next';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { useToken } from '../../hooks';
import { formatPumpStateBalance } from '../../utils/formatBalance';

const { Title } = Typography;

const PumpState: React.FC = () => {
  const { t } = useTranslation();
  const { tokenState } = useToken();
  const { totalInvestedSol, totalReservedSol, currentPrice, bondingCompleted, wallets } =
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
            label={t('pumpState.totalReservedSol', 'Total Reserved SOL')}
          >
            {formatPumpStateBalance(totalReservedSol / LAMPORTS_PER_SOL, true)} SOL
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
            {formatPumpStateBalance(currentPrice / LAMPORTS_PER_SOL, true)} SOL
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
