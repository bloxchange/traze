import React, { useState } from 'react';
import { Space, Input, Button, Tooltip, theme, Popconfirm, Modal, Typography } from 'antd';
import {
  ClearOutlined,
  PlusCircleOutlined,
  SettingOutlined,
  UnorderedListOutlined,
  EditOutlined,
  ReloadOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { CoinOutlined, CoinBackOutlined } from '../icons';
import { useTranslation } from 'react-i18next';

const { Text } = Typography;

interface SwarmHeaderProps {
  name: string;
  onNameChange?: (newName: string) => void;
  onFeed: () => void;
  onReturn: () => void;
  onClear: () => void;
  onConfig: () => void;
  onShowList: () => void;
  onRefresh: () => void;
  showConfig: boolean;
  walletCount: number;
  totalSolBalance: number;
  totalTokenBalance: number;
}

const SwarmHeader: React.FC<SwarmHeaderProps> = ({
  name: initialName,
  onNameChange,
  onFeed,
  onReturn,
  onClear,
  onConfig,
  onShowList,
  onRefresh,
  showConfig,
  walletCount,
  totalSolBalance,
  totalTokenBalance,
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

  const formatBalance = (balance: number, isSOL: boolean = false) => {
    const actualBalance = isSOL ? balance / LAMPORTS_PER_SOL : balance;
    if (actualBalance >= 1000000000) {
      return `${(actualBalance / 1000000000).toFixed(2)}B`;
    } else if (actualBalance >= 1000000) {
      return `${(actualBalance / 1000000).toFixed(2)}M`;
    } else if (actualBalance >= 1000) {
      return `${(actualBalance / 1000).toFixed(2)}K`;
    }
    return actualBalance.toFixed(isSOL ? 3 : 4);
  };

  const balanceTooltip = (
    <div>
      <div>SOL: {formatBalance(totalSolBalance, true)}</div>
      <div>Token: {formatBalance(totalTokenBalance)}</div>
      <div>Wallets: {walletCount}</div>
    </div>
  );

  return (
    <>
      <div
        className="swarm-header"
        style={{
          borderBottom: '1px solid',
          borderBottomColor: token.colorBorder,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 8px',
          minHeight: '40px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            minWidth: 0,
            flex: '1 1 auto',
            marginRight: '8px',
          }}
        >
          <Tooltip title={balanceTooltip}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                minWidth: 0,
                cursor: 'pointer',
              }}
            >
              <InfoCircleOutlined
                style={{
                  color: token.colorPrimary,
                  marginRight: '4px',
                  flexShrink: 0,
                }}
              />
              {walletCount > 0 && (
                <Text
                  style={{
                    fontSize: '12px',
                    color: token.colorTextSecondary,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    minWidth: 0,
                  }}
                >
                   SOL: {formatBalance(totalSolBalance, true)} | Token: {formatBalance(totalTokenBalance)} | {walletCount}w
                 </Text>
              )}
            </div>
          </Tooltip>
        </div>
        <div style={{ flexShrink: 0 }}>
          <Space size="small">
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
            <Tooltip
              title={
                walletCount === 0 ? t('swarm.createWallets') : t('common.clear')
              }
            >
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
                  <Button icon={<ClearOutlined />} type="text" danger />
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
              <>
                <Tooltip title={t('common.refresh')}>
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={onRefresh}
                    type="text"
                  />
                </Tooltip>
                <Tooltip title={t('settings.configuration')}>
                  <Button
                    icon={<SettingOutlined />}
                    onClick={onConfig}
                    type="text"
                  />
                </Tooltip>
              </>
            )}
          </Space>
        </div>
      </div>

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
    </>
  );
};

export default SwarmHeader;
