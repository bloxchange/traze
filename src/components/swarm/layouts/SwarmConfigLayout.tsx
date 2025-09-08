import React from 'react';
import {
  Row,
  Col,
  Checkbox,
  Space,
  Typography,
  Button,
  App as AntdApp,
  theme,
} from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { WalletInfo, SwarmConfigFormValues } from '@/models';
import { SwarmConfig } from '../config';
import { formatSolBalance } from '@/utils/formatBalance';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';

const { Text } = Typography;

interface SwarmConfigLayoutProps {
  wallets: WalletInfo[];
  onWalletSelection: (publicKey: string, selected: boolean) => void;
  onSelectAll?: (selected: boolean) => void;
  swarmConfig: SwarmConfigFormValues;
  onConfigChange: (values: SwarmConfigFormValues) => void;
  availableBuyAmounts: string[];
  onAvailableBuyAmountsChange: (amounts: string[]) => void;
  availableSellPercentages: string[];
  onAvailableSellPercentagesChange: (percentages: string[]) => void;
  disabled?: boolean;
}

const SwarmConfigLayout: React.FC<SwarmConfigLayoutProps> = ({
  wallets,
  onWalletSelection,
  onSelectAll,
  swarmConfig,
  onConfigChange,
  availableBuyAmounts,
  onAvailableBuyAmountsChange,
  availableSellPercentages,
  onAvailableSellPercentagesChange,
  disabled = false,
}) => {
  const { t } = useTranslation();
  const { token } = theme.useToken();
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
    <Row>
      <Col
        span={8}
        style={{
          borderRight: `1px solid ${token.colorBorder}`,
          paddingRight: 16,
        }}
      >
        <Row align="middle" style={{}}>
          <Col span={3}>
            <Checkbox
              checked={allSelected}
              onChange={(e) => onSelectAll?.(e.target.checked)}
              indeterminate={
                wallets.some((wallet) => wallet.selected) && !allSelected
              }
              disabled={disabled}
            />
          </Col>
          <Col span={12}>
            <Text strong>{t('swarm.wallet')}</Text>
          </Col>
          <Col span={9}>
            <Text strong>{t('swarm.sol')}</Text>
          </Col>
        </Row>
        {wallets.map((wallet) => (
          <Row
            key={wallet.publicKey}
            align="middle"
            style={{ marginBottom: 8 }}
          >
            <Col span={3}>
              <Checkbox
                id={wallet.publicKey}
                checked={wallet.selected}
                onChange={(e) =>
                  onWalletSelection(wallet.publicKey, e.target.checked)
                }
                disabled={disabled}
              />
            </Col>
            <Col span={12}>
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
            <Col span={9}>
              <Text style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                {formatSolBalance(wallet.solBalance / LAMPORTS_PER_SOL)}
              </Text>
            </Col>
          </Row>
        ))}
      </Col>
      <Col span={16} style={{ paddingLeft: 16 }}>
        <SwarmConfig
          initialConfig={swarmConfig}
          onConfigChange={onConfigChange}
          availableBuyAmounts={availableBuyAmounts}
          onAvailableBuyAmountsChange={onAvailableBuyAmountsChange}
          availableSellPercentages={availableSellPercentages}
          onAvailableSellPercentagesChange={onAvailableSellPercentagesChange}
          disabled={disabled}
        />
      </Col>
    </Row>
  );
};

export default SwarmConfigLayout;
