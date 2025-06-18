import React, { useState } from 'react';
import { Card, Typography, Button, Space, Input } from 'antd';
import { useTranslation } from 'react-i18next';
import './index.css';

const { Text } = Typography;

interface SwarmProps {
  name: string;
  wallets: string[];
}

const Swarm: React.FC<SwarmProps> = ({ name: initialName, wallets }) => {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(initialName);

  const handleNameClick = () => {
    setIsEditing(true);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  };

  const handleNameBlur = () => {
    setIsEditing(false);
  };

  const handleBuy = () => {
    // Implement buy logic
  };

  const handleSell = () => {
    // Implement sell logic
  };

  return (
    <Card className="swarm">
      <Space direction="vertical" style={{ width: '100%' }}>
        <div className="swarm-header">
          {isEditing ? (
            <Input
              value={name}
              onChange={handleNameChange}
              onBlur={handleNameBlur}
              onPressEnter={handleNameBlur}
              autoFocus
            />
          ) : (
            <Text strong onClick={handleNameClick} style={{ cursor: 'pointer' }}>
              {name}
            </Text>
          )}
        </div>
        <div className="swarm-wallets">
          {wallets.map((wallet, index) => (
            <Text key={index} type="secondary" style={{ display: 'block' }}>
              {wallet}
            </Text>
          ))}
        </div>
        <Space className="swarm-actions">
          <Button type="primary" onClick={handleBuy}>
            {t('buy')}
          </Button>
          <Button danger onClick={handleSell}>
            {t('sell')}
          </Button>
        </Space>
      </Space>
    </Card>
  );
};

export default Swarm;