import React, { useState } from 'react';
import { Space, Input, Button, Tooltip, theme, Popconfirm, Modal } from 'antd';
import {
  ClearOutlined,
  PlusCircleOutlined,
  SettingOutlined,
  UnorderedListOutlined,
  EditOutlined,
} from '@ant-design/icons';
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
  walletCount,
}) => {
  const { t } = useTranslation();
  const { token } = theme.useToken();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newName, setNewName] = useState(initialName);

  const showModal = () => {
    setNewName(initialName);
    setIsModalVisible(true);
  };

  const handleOk = () => {
    if (onNameChange) {
      onNameChange(newName);
    }
    setIsModalVisible(false);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewName(e.target.value);
  };

  return (
    <div
      className="swarm-header"
      style={{
        borderBottom: '1px solid',
        borderBottomColor: token.colorBorder,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Space>
        <Tooltip title={t('swarm.editName')}>
          <Button icon={<EditOutlined />} onClick={showModal} type="text" />
        </Tooltip>
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
            <Button icon={<PlusCircleOutlined />} onClick={onClear} type="text" />
          ) : (
            <Popconfirm
              title={t('swarm.clearConfirmTitle')}
              description={t('swarm.clearConfirmContent')}
              okText={t('common.confirm')}
              cancelText={t('common.cancel')}
              onConfirm={onClear}
            >
              <Button icon={<ClearOutlined />} type="text" danger />
            </Popconfirm>
          )}
        </Tooltip>
        {showConfig ? (
          <Tooltip title={t('swarm.showList')}>
            <Button icon={<UnorderedListOutlined />} onClick={onShowList} type="text" />
          </Tooltip>
        ) : (
          <Tooltip title={t('settings.configuration')}>
            <Button icon={<SettingOutlined />} onClick={onConfig} type="text" />
          </Tooltip>
        )}
      </Space>

      <Modal
        title={t('swarm.editName')}
        open={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
      >
        <Input
          value={newName}
          onChange={handleNameChange}
          placeholder={t('common.enterName')}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleOk();
            }
          }}
        />
      </Modal>
    </div>
  );
};

export default SwarmHeader;
