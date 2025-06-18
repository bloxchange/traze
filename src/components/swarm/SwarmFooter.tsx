import React from 'react';
import { Row, Col, Button, theme } from 'antd';
import { ShoppingOutlined, ShoppingCartOutlined, ReloadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

interface SwarmFooterProps {
  onBuy: () => void;
  onSell: () => void;
  onFlush: () => void;
}

const SwarmFooter: React.FC<SwarmFooterProps> = ({ onBuy, onSell, onFlush }) => {
  const { t } = useTranslation();
  const { token } = theme.useToken();

  return (
    <div className="swarm-footer" style={{ borderTop: '1px solid', borderTopColor: token.colorBorder }}>
      <Row gutter={8}>
        <Col span={8}>
          <Button
            type="primary"
            icon={<ShoppingOutlined />}
            block
            onClick={onBuy}
          >
            {t('swarm.buy')}
          </Button>
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