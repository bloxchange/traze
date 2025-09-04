import React, { useState, useEffect } from 'react';
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
import { formatBalance } from '../../../utils/formatBalance';
import { GetTokenInformationCommand } from '../../../domain/commands/GetTokenInformationCommand';

const { Text } = Typography;

interface SwarmBalanceLayoutProps {
  wallets: WalletInfo[];
  onWalletSelection: (publicKey: string, selected: boolean) => void;
  onSelectAll?: (selected: boolean) => void;
  disabled?: boolean;
}

const SwarmBalanceLayout: React.FC<SwarmBalanceLayoutProps> = ({
  wallets,
  onWalletSelection,
  onSelectAll,
  disabled = false,
}) => {
  const { t } = useTranslation();
  const { tokenState } = useToken();
  const { message } = AntdApp.useApp();
  const [tokenDecimals, setTokenDecimals] = useState<number>(6); // Default to 6 decimals

  // Fetch token decimals when current token changes
  useEffect(() => {
    const fetchTokenDecimals = async () => {
      if (tokenState.currentToken?.mint) {
        try {
          const tokenInfo = await new GetTokenInformationCommand(
            tokenState.currentToken.mint
          ).execute();
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
    return formatBalance(formattedBalance);
  };

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
            disabled={disabled}
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
              disabled={disabled}
            />
          </Col>
          <Col span={8}>
            <Space size={2}>
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
                disabled={disabled}
              />
              <Button
                type="text"
                onClick={() =>
                  window.open(
                    `https://solscan.io/account/${wallet.publicKey}`,
                    '_blank'
                  )
                }
                style={{
                  color: '#1890ff',
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: 0,
                }}
                disabled={disabled}
              >
                <svg
                  viewBox="0 0 24 24"
                  width="16"
                  height="16"
                  fill="currentColor"
                >
                  <path d="M19 19H5V5h7V3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z" />
                </svg>
              </Button>
            </Space>
          </Col>
          <Col span={7}>
            <Text style={{ fontFamily: 'monospace' }}>
              {formatBalance(wallet.solBalance / LAMPORTS_PER_SOL, true)}
            </Text>
          </Col>
          <Col span={7}>
            <Text style={{ fontFamily: 'monospace' }}>
              {formatTokenBalance(wallet.tokenBalance)}
            </Text>
          </Col>
        </Row>
      ))}
    </>
  );
};

export default SwarmBalanceLayout;
