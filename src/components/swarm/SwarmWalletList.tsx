import React from 'react';
import { Row, Col, Checkbox, Space, Typography, Button, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const { Text } = Typography;

interface WalletInfo {
  publicKey: string;
  solBalance: number;
  tokenBalance: number;
  selected: boolean;
}

interface SwarmWalletListProps {
  wallets: WalletInfo[];
  onWalletSelection: (publicKey: string, checked: boolean) => void;
  onSelectAll?: (checked: boolean) => void;
}

const SwarmWalletList: React.FC<SwarmWalletListProps> = ({ wallets, onWalletSelection, onSelectAll }) => {
  const { t } = useTranslation();

  const handleCopyPublicKey = (publicKey: string) => {
    navigator.clipboard.writeText(publicKey)
      .then(() => message.success(t('common.copySuccess')))
      .catch(() => message.error(t('common.copyFailed')));
  };

  const allSelected = wallets.length > 0 && wallets.every(wallet => wallet.selected);

  return (
    <div className="swarm-wallets" style={{ flex: 1, padding: 12 }}>
      <Row align="middle" style={{}}>
        <Col span={2}>
          <Checkbox
            checked={allSelected}
            onChange={(e) => onSelectAll?.(e.target.checked)}
            indeterminate={wallets.some(wallet => wallet.selected) && !allSelected}
          />
        </Col>
        <Col span={8}>
          <Text strong>{t('swarm.wallet')}</Text>
        </Col>
        <Col span={7}>
          <Text strong>{t('swarm.sol')}</Text>
        </Col>
        <Col span={7}>
          <Text strong>{t('swarm.token')}</Text>
        </Col>
      </Row>
      {wallets.map((wallet) => (
        <Row key={wallet.publicKey} align="middle" style={{ marginBottom: 8 }}>
          <Col span={2}>
            <Checkbox
              checked={wallet.selected}
              onChange={(e) => onWalletSelection(wallet.publicKey, e.target.checked)}
            />
          </Col>
          <Col span={8}>
            <Space>
              <Text>{wallet.publicKey.slice(0, 6)}...</Text>
              <Button
                type="text"
                icon={<CopyOutlined />}
                onClick={() => handleCopyPublicKey(wallet.publicKey)}
              />
            </Space>
          </Col>
          <Col span={7}>
            <Text>{wallet.solBalance.toFixed(2)}</Text>
          </Col>
          <Col span={7}>
            <Text>{wallet.tokenBalance.toFixed(2)}</Text>
          </Col>
        </Row>
      ))}
    </div>
  );
};

export default SwarmWalletList;