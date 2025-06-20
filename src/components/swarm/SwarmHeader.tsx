import React, { useState } from 'react';
import { Space, Input, Typography, Button, Tooltip, theme, Popconfirm } from 'antd';
import { ClearOutlined, PlusCircleOutlined, SettingOutlined, UnorderedListOutlined } from '@ant-design/icons';
import { CoinOutlined, CoinBackOutlined } from '../icons';
import { useTranslation } from 'react-i18next';

//const { Text } = Typography;

interface SwarmHeaderProps {
  name: string;
  onNameChange?: (newName: string) => void;
  onFeed: () => void;
  onReturn: () => void;
  onClear: () => void;
  onConfig: () => void;
  onShowList: () => void;
  showConfig: boolean;
  walletCount: number;
}

const SwarmHeader: React.FC<SwarmHeaderProps> = ({
  name: initialName,
  onNameChange,
  onFeed,
  onReturn,
  onClear,
  onConfig,
  onShowList,
  showConfig,
  walletCount
}) => {
  const { t } = useTranslation();
  const { token } = theme.useToken();
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
    if (onNameChange) {
      onNameChange(name);
    }
  };

  return (
    <div className="swarm-header" style={{ borderBottom: '1px solid', borderBottomColor: token.colorPrimary }}>
      <Space>
        {isEditing ? (
          <Input
            value={name}
            onChange={handleNameChange}
            onBlur={handleNameBlur}
            onPressEnter={handleNameBlur}
            autoFocus
          />
        ) : (
          <Typography.Title level={5} onClick={handleNameClick} style={{ cursor: 'pointer' }}>
            {name}
          </Typography.Title>
        )}
      </Space>
      <Space>
        <Tooltip title={t('swarm.feed')}>
          <Button
            icon={<CoinOutlined style={{ color: token.colorPrimary }} />}
            onClick={onFeed}
            type="text"
          />
        </Tooltip>
        <Tooltip title={t('swarm.return')}>
          <Button
            icon={<CoinBackOutlined style={{ color: token.colorWarning }} />}
            onClick={onReturn}
            type="text"
          />
        </Tooltip>
        <Tooltip title={walletCount === 0 ? t('swarm.createWallets') : t('common.clear')}>
          {walletCount === 0 ? (
            <Button
              icon={<PlusCircleOutlined />}
              onClick={onClear}
              type="text"
            />
          ) : (
            <Popconfirm
              title={t('swarm.clearConfirmTitle')}
              description={t('swarm.clearConfirmContent')}
              okText={t('common.confirm')}
              cancelText={t('common.cancel')}
              onConfirm={onClear}
            >
              <Button
                icon={<ClearOutlined />}
                type="text"
                danger
              />
            </Popconfirm>
          )}
        </Tooltip>
        {showConfig ? (
          <Tooltip title={t('swarm.showList')}>
            <Button
              icon={<UnorderedListOutlined />}
              onClick={onShowList}
              type="text"
            />
          </Tooltip>
        ) : (
          <Tooltip title={t('settings.configuration')}>
            <Button
              icon={<SettingOutlined />}
              onClick={onConfig}
              type="text"
            />
          </Tooltip>
        )}
      </Space>
    </div>
  );
};

export default SwarmHeader;