import React from 'react';
import { Row, Col, Checkbox, Space, Typography, Button, message, theme } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { WalletInfo, SwarmConfigFormValues } from '@/models';
import { SwarmConfig } from '../config';

const { Text } = Typography;

interface SwarmConfigLayoutProps {
  wallets: WalletInfo[];
  onWalletSelection: (publicKey: string, selected: boolean) => void;
  onSelectAll?: (selected: boolean) => void;
  swarmConfig: SwarmConfigFormValues;
  onConfigChange: (values: SwarmConfigFormValues) => void;
}

const SwarmConfigLayout: React.FC<SwarmConfigLayoutProps> = ({
  wallets,
  onWalletSelection,
  onSelectAll,
  swarmConfig,
  onConfigChange,
}) => {
  const { t } = useTranslation();
  const { token } = theme.useToken();

  const handleCopyPublicKey = (publicKey: string) => {
    navigator.clipboard.writeText(publicKey)
      .then(() => message.success(t('common.copySuccess')))
      .catch(() => message.error(t('common.copyFailed')));
  };

  const allSelected = wallets.length > 0 && wallets.every(wallet => wallet.selected);

  return (
    <Row>
      <Col span={8} style={{ borderRight: `1px solid ${token.colorBorder}`, paddingRight: 16 }}>
        <Row align="middle" style={{}}>
          <Col span={4}>
            <Checkbox
              checked={allSelected}
              onChange={(e) => onSelectAll?.(e.target.checked)}
              indeterminate={wallets.some(wallet => wallet.selected) && !allSelected}
            />
          </Col>
          <Col span={20}>
            <Text strong>{t('swarm.wallet')}</Text>
          </Col>
        </Row>
        {wallets.map((wallet) => (
          <Row key={wallet.publicKey} align="middle" style={{ marginBottom: 8 }}>
            <Col span={4}>
              <Checkbox
                id={wallet.publicKey}
                checked={wallet.selected}
                onChange={(e) => onWalletSelection(wallet.publicKey, e.target.checked)}
              />
            </Col>
            <Col span={20}>
              <Space>
                <label htmlFor={wallet.publicKey} style={{ cursor: 'pointer', fontFamily: 'monospace' }}>{wallet.publicKey.slice(0, 6)}...</label>
                <Button
                  type="text"
                  icon={<CopyOutlined />}
                  onClick={() => handleCopyPublicKey(wallet.publicKey)}
                />
              </Space>
            </Col>
          </Row>
        ))}
      </Col>
      <Col span={16} style={{ paddingLeft: 16 }}>
        <SwarmConfig
          initialConfig={swarmConfig}
          onConfigChange={onConfigChange}
        />
      </Col>
    </Row>
  );
};

export default SwarmConfigLayout;