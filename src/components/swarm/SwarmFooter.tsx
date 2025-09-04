import React, { useState } from 'react';
import { Row, Col, Button, theme, Dropdown, Space, type MenuProps } from 'antd';
import {
  ShoppingOutlined,
  ShoppingCartOutlined,
  ReloadOutlined,
  DownOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

interface SwarmFooterProps {
  onBuy: () => void;
  onBuyAllSol: () => void;
  onBuyAllInOne: () => void;
  onSell: () => void;
  onFlush: () => void;
}

const SwarmFooter: React.FC<SwarmFooterProps> = ({
  onBuy,
  onBuyAllSol,
  onBuyAllInOne,
  onSell,
  onFlush,
}) => {
  const { t } = useTranslation();
  const { token } = theme.useToken();
  const [selectedBuyOption, setSelectedBuyOption] = useState<'buy' | 'buyAllSol' | 'buyAllInOne'>('buy');

  /**
   * Get the current buy handler based on selected option
   */
  const getCurrentBuyHandler = () => {
    switch (selectedBuyOption) {
      case 'buyAllSol':
        return onBuyAllSol;
      case 'buyAllInOne':
        return onBuyAllInOne;
      default:
        return onBuy;
    }
  };

  /**
   * Get the current buy label based on selected option
   */
  const getCurrentBuyLabel = () => {
    switch (selectedBuyOption) {
      case 'buyAllSol':
        return t('swarm.buyAllSol');
      case 'buyAllInOne':
        return t('swarm.buyAllInOne');
      default:
        return t('swarm.buy');
    }
  };

  /**
   * Menu items for the buy dropdown
   */
  const buyMenuItems: MenuProps['items'] = [
    {
      key: 'buy',
      label: t('swarm.buy'),
      icon: <ShoppingOutlined />,
      onClick: () => setSelectedBuyOption('buy'),
    },
    {
      key: 'buyAllSol',
      label: t('swarm.buyAllSol'),
      icon: <ShoppingOutlined />,
      onClick: () => setSelectedBuyOption('buyAllSol'),
    },
    {
      key: 'buyAllInOne',
      label: t('swarm.buyAllInOne'),
      icon: <ShoppingOutlined />,
      onClick: () => setSelectedBuyOption('buyAllInOne'),
    },
  ];

  return (
    <div
      className="swarm-footer"
      style={{
        borderTop: '1px solid',
        borderTopColor: token.colorBorder,
        paddingTop: 6,
      }}
    >
      <Row gutter={8}>
        <Col span={8}>
          <Space.Compact style={{ width: '100%' }}>
            <Button
              type="primary"
              icon={<ShoppingOutlined />}
              style={{ width: 'calc(100% - 32px)' }}
              onClick={getCurrentBuyHandler()}
            >
              {getCurrentBuyLabel()}
            </Button>
            <Dropdown
              menu={{ items: buyMenuItems }}
              trigger={['click']}
              placement="topLeft"
            >
              <Button
                type="primary"
                icon={<DownOutlined />}
                style={{ width: '32px' }}
              />
            </Dropdown>
          </Space.Compact>
        </Col>
        <Col span={8}>
          <Button
            type="primary"
            danger
            icon={<ShoppingCartOutlined />}
            block
            onClick={onSell}
          >
            {t('swarm.sell')}
          </Button>
        </Col>
        <Col span={8}>
          <Button
            type="default"
            icon={<ReloadOutlined />}
            block
            onClick={onFlush}
          >
            {t('swarm.flush')}
          </Button>
        </Col>
      </Row>
    </div>
  );
};

export default SwarmFooter;
