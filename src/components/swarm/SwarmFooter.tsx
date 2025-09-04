import React, { useState } from 'react';
import { Row, Col, Button, theme, Dropdown, Space, type MenuProps } from 'antd';
import {
  ShoppingOutlined,
  ShoppingCartOutlined,
  ReloadOutlined,
  DownOutlined,
  StopOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

interface SwarmFooterProps {
  onBuy: () => void;
  onBuyAllSol: () => void;
  onBuyAllInOne: () => void;
  onSell: () => void;
  onSellTillRunOut: () => void;
  onFlush: () => void;
  runningOperations?: {
    buyTillRunOut: boolean;
    sellTillRunOut: boolean;
  };
  onStopBuyTillRunOut?: () => void;
  onStopSellTillRunOut?: () => void;
  disabled?: boolean;
}

const SwarmFooter: React.FC<SwarmFooterProps> = ({
  onBuy,
  onBuyAllSol,
  onBuyAllInOne,
  onSell,
  onSellTillRunOut,
  onFlush,
  runningOperations,
  onStopBuyTillRunOut,
  onStopSellTillRunOut,
  disabled = false,
}) => {
  const { t } = useTranslation();
  const { token } = theme.useToken();
  const [selectedBuyOption, setSelectedBuyOption] = useState<'buy' | 'buyAllSol' | 'buyAllInOne'>('buy');
  const [selectedSellOption, setSelectedSellOption] = useState<'sell' | 'sellTillRunOut'>('sell');

  // Check if any operation is running
  const isAnyOperationRunning = runningOperations?.buyTillRunOut || runningOperations?.sellTillRunOut;

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
   * Get the current sell handler based on selected option
   */
  const getCurrentSellHandler = () => {
    switch (selectedSellOption) {
      case 'sellTillRunOut':
        return onSellTillRunOut;
      default:
        return onSell;
    }
  };

  /**
   * Get the current sell label based on selected option
   */
  const getCurrentSellLabel = () => {
    switch (selectedSellOption) {
      case 'sellTillRunOut':
        return t('swarm.sellTillRunOut');
      default:
        return t('swarm.sell');
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

  /**
   * Menu items for the sell dropdown
   */
  const sellMenuItems: MenuProps['items'] = [
    {
      key: 'sell',
      label: t('swarm.sell'),
      icon: <ShoppingCartOutlined />,
      onClick: () => setSelectedSellOption('sell'),
    },
    {
      key: 'sellTillRunOut',
      label: t('swarm.sellTillRunOut'),
      icon: <ShoppingCartOutlined />,
      onClick: () => setSelectedSellOption('sellTillRunOut'),
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
          {runningOperations?.buyTillRunOut && selectedBuyOption === 'buyAllInOne' ? (
            <Button
              type="primary"
              danger
              icon={<StopOutlined />}
              block
              onClick={onStopBuyTillRunOut}
            >
              {t('swarm.stop')}
            </Button>
          ) : (
            <Space.Compact style={{ width: '100%' }}>
              <Button
                type="primary"
                icon={<ShoppingOutlined />}
                style={{ width: 'calc(100% - 32px)' }}
                onClick={getCurrentBuyHandler()}
                disabled={disabled || (isAnyOperationRunning && !runningOperations?.buyTillRunOut)}
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
                  disabled={disabled || isAnyOperationRunning}
                />
              </Dropdown>
            </Space.Compact>
          )}
        </Col>
        <Col span={8}>
          {runningOperations?.sellTillRunOut && selectedSellOption === 'sellTillRunOut' ? (
            <Button
              type="primary"
              danger
              icon={<StopOutlined />}
              block
              onClick={onStopSellTillRunOut}
            >
              {t('swarm.stop')}
            </Button>
          ) : (
            <Space.Compact style={{ width: '100%' }}>
              <Button
                type="primary"
                danger
                icon={<ShoppingCartOutlined />}
                style={{ width: 'calc(100% - 32px)' }}
                onClick={getCurrentSellHandler()}
                disabled={disabled || (isAnyOperationRunning && !runningOperations?.sellTillRunOut)}
              >
                {getCurrentSellLabel()}
              </Button>
              <Dropdown
                menu={{ items: sellMenuItems }}
                trigger={['click']}
                placement="topLeft"
              >
                <Button
                  type="primary"
                  danger
                  icon={<DownOutlined />}
                  style={{ width: '32px' }}
                  disabled={disabled || isAnyOperationRunning}
                />
              </Dropdown>
            </Space.Compact>
          )}
        </Col>
        <Col span={8}>
          <Button
            type="default"
            icon={<ReloadOutlined />}
            block
            onClick={onFlush}
            disabled={disabled || isAnyOperationRunning}
          >
            {t('swarm.flush')}
          </Button>
        </Col>
      </Row>
    </div>
  );
};

export default SwarmFooter;
