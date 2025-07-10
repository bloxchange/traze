import React from 'react';
import {
  Row,
  Col,
  Checkbox,
  Space,
  Typography,
  Button,
  App as AntdApp,
} from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import type { WalletInfo } from '@/models';
import { useToken } from '@/hooks';

const { Text } = Typography;

const formatBalance = (balance: number, isSOL: boolean = false): string => {
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

interface SwarmBalanceLayoutProps {
  wallets: WalletInfo[];
  onWalletSelection: (publicKey: string, selected: boolean) => void;
  onSelectAll?: (selected: boolean) => void;
}

const SwarmBalanceLayout: React.FC<SwarmBalanceLayoutProps> = ({
  wallets,
  onWalletSelection,
  onSelectAll,
}) => {
  const { t } = useTranslation();
  const { tokenState } = useToken();
  const { message } = AntdApp.useApp();

  const handleCopyPublicKey = (publicKey: string) => {
    navigator.clipboard
      .writeText(publicKey)
      .then(() => message.success(t('common.copySuccess')))
      .catch(() => message.error(t('common.copyFailed')));
  };

  const allSelected =
    wallets.length > 0 && wallets.every((wallet) => wallet.selected);

  return (
    <>
      <Row align="middle" style={{}}>
        <Col span={2}>
          <Checkbox
            checked={allSelected}
            onChange={(e) => onSelectAll?.(e.target.checked)}
            indeterminate={
              wallets.some((wallet) => wallet.selected) && !allSelected
            }
          />
        </Col>
        <Col span={8}>
          <Text strong>{t('swarm.wallet')}</Text>
        </Col>
        <Col span={7}>
          <Text strong>{t('swarm.sol')}</Text>
        </Col>
        <Col span={7}>
          <Text strong>{tokenState.currentToken?.symbol || '-'}</Text>
        </Col>
      </Row>
      {wallets.map((wallet) => (
        <Row key={wallet.publicKey} align="middle" style={{ marginBottom: 8 }}>
          <Col span={2}>
            <Checkbox
              id={wallet.publicKey}
              checked={wallet.selected}
              onChange={(e) =>
                onWalletSelection(wallet.publicKey, e.target.checked)
              }
            />
          </Col>
          <Col span={8}>
            <Space>
              <label
                htmlFor={wallet.publicKey}
                style={{ cursor: 'pointer', fontFamily: 'monospace' }}
              >
                {wallet.publicKey.slice(0, 6)}...
              </label>
              <Button
                type="text"
                icon={<CopyOutlined />}
                onClick={() => handleCopyPublicKey(wallet.publicKey)}
              />
            </Space>
          </Col>
          <Col span={7}>
            <Text style={{ fontFamily: 'monospace' }}>
              {formatBalance(wallet.solBalance / LAMPORTS_PER_SOL, true)}
            </Text>
          </Col>
          <Col span={7}>
            <Text style={{ fontFamily: 'monospace' }}>
              {formatBalance(wallet.tokenBalance)}
            </Text>
          </Col>
        </Row>
      ))}
    </>
  );
};

export default SwarmBalanceLayout;
