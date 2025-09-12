import React, { useState, useEffect } from 'react';
import {
  Space,
  Input,
  Button,
  Tooltip,
  theme,
  Popconfirm,
  Modal,
  Typography,
} from 'antd';
import {
  ClearOutlined,
  PlusCircleOutlined,
  SettingOutlined,
  UnorderedListOutlined,
  EditOutlined,
  ReloadOutlined,
  InfoCircleOutlined,
  AimOutlined,
} from '@ant-design/icons';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { CoinOutlined, CoinBackOutlined } from '../icons';
import { useTranslation } from 'react-i18next';
import { formatBalance } from '../../utils/formatBalance';
import { GetTokenInformationCommand } from '../../domain/commands/GetTokenInformationCommand';
import { useToken } from '../../hooks/useToken';
import { WalletMonitoringService } from '../../domain/infrastructure/WalletMonitoringService';
import { globalEventEmitter } from '../../domain/infrastructure/events/EventEmitter';
import {
  EVENTS,
  type MintTokenDetectedData,
} from '../../domain/infrastructure/events/types';
import { SwarmBuyCommand } from '../../domain/commands/SwarmBuyCommand';
import { message } from 'antd';

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
  disabled?: boolean;
  showMask?: boolean;
  targetWallet?: string;
  onTargetWalletChange?: (wallet: string) => void;
  wallets?: Array<any>;
  swarmConfig?: any;
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
  disabled = false,
  showMask = false,
  targetWallet = '',
  onTargetWalletChange,
  wallets = [],
  swarmConfig,
}) => {
  const { t } = useTranslation();
  const { token } = theme.useToken();
  const { tokenState } = useToken();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newName, setNewName] = useState(initialName);
  const [tokenDecimals, setTokenDecimals] = useState<number>(6); // Default to 6 decimals
  const [isSnippingModalVisible, setIsSnippingModalVisible] = useState(false);
  const [walletAddress, setWalletAddress] = useState(targetWallet);
  const [isMonitoring, setIsMonitoring] = useState(false);

  // Fetch token decimals when current token changes
  useEffect(() => {
    const fetchTokenDecimals = async () => {
      if (tokenState.currentToken?.mint) {
        try {
          const tokenInfo = await new GetTokenInformationCommand(
            tokenState.currentToken.mint
          ).execute();
          setTokenDecimals(tokenInfo.decimals);
        } catch (error) {
          console.warn('Failed to get token decimals, using default:', error);
          setTokenDecimals(6); // Fallback to 6 decimals
        }
      }
    };

    fetchTokenDecimals();
  }, [tokenState.currentToken?.mint]);

  // Handle wallet monitoring when target wallet changes
  useEffect(() => {
    const monitoringService = WalletMonitoringService.getInstance();

    const startMonitoring = async () => {
      if (targetWallet && targetWallet.trim()) {
        try {
          await monitoringService.startMonitoring(targetWallet.trim());
          setIsMonitoring(true);
          console.log(`🎯 Started monitoring target wallet: ${targetWallet}`);
        } catch (error) {
          console.error('Failed to start wallet monitoring:', error);
          setIsMonitoring(false);
        }
      } else {
        await monitoringService.stopAllMonitoring();
        setIsMonitoring(false);
        console.log('🛑 Stopped wallet monitoring');
      }
    };

    startMonitoring();

    // Cleanup function
    return () => {
      monitoringService.stopAllMonitoring();
      setIsMonitoring(false);
    };
  }, [targetWallet]);

  // Function to trigger automatic swarm buy for detected token
  const triggerAutomaticSwarmBuy = async (tokenMint: string) => {
    if (!wallets || wallets.length === 0) {
      console.warn('⚠️ No wallets available for automatic swarm buy');
      return;
    }

    if (!swarmConfig) {
      console.warn(
        '⚠️ No swarm configuration available for automatic swarm buy'
      );
      return;
    }

    try {
      console.log(`🚀 Triggering automatic swarm buy for token: ${tokenMint}`);

      const buyCommand = new SwarmBuyCommand(
        wallets,
        tokenMint,
        swarmConfig.buyAmounts,
        swarmConfig.buyDelay,
        swarmConfig.buySlippage,
        swarmConfig.priorityFee,
        tokenState.buyComputeUnitsConsumed,
        tokenState.buyCostUnits
      );

      await buyCommand.execute();

      message.success(
        `🎯 Automatic swarm buy executed for token: ${tokenMint.slice(0, 8)}...`
      );
      console.log(`✅ Automatic swarm buy completed for token: ${tokenMint}`);
    } catch (error) {
      message.error(
        `❌ Automatic swarm buy failed for token: ${tokenMint.slice(0, 8)}...`
      );
      console.error('Automatic swarm buy error:', error);
    }
  };

  // Listen for mint token detection events
  useEffect(() => {
    const handleMintTokenDetected = (data: MintTokenDetectedData) => {
      console.log('🪙 Mint token detected in SwarmHeader:', data);

      // Only trigger automatic buy if we're monitoring the wallet that detected the mint
      if (data.walletAddress === targetWallet?.trim()) {
        console.log(
          `🎯 Target wallet ${data.walletAddress} detected mint token: ${data.tokenMint}`
        );
        triggerAutomaticSwarmBuy(data.tokenMint);
      }
    };

    globalEventEmitter.on(EVENTS.MintTokenDetected, handleMintTokenDetected);

    return () => {
      globalEventEmitter.off(EVENTS.MintTokenDetected, handleMintTokenDetected);
    };
  }, [
    targetWallet,
    wallets,
    swarmConfig,
    tokenState.buyComputeUnitsConsumed,
    tokenState.buyCostUnits,
  ]);

  // Helper function to format raw token balance
  const formatTokenBalance = (rawBalance: number) => {
    const formattedBalance = rawBalance / Math.pow(10, tokenDecimals);
    return formatBalance(formattedBalance);
  };

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

  /**
   * Handle snipping modal operations
   */
  const showSnippingModal = () => {
    setWalletAddress(targetWallet);
    setIsSnippingModalVisible(true);
  };

  const handleSnippingOk = () => {
    if (onTargetWalletChange) {
      onTargetWalletChange(walletAddress.trim());
    }
    setIsSnippingModalVisible(false);
  };

  const handleSnippingCancel = () => {
    setIsSnippingModalVisible(false);
  };

  const handleWalletAddressChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setWalletAddress(e.target.value);
  };

  const handleClearWallet = () => {
    setWalletAddress('');
    if (onTargetWalletChange) {
      onTargetWalletChange('');
    }
  };

  const balanceTooltip = (
    <div>
      <div>SOL: {formatBalance(totalSolBalance / LAMPORTS_PER_SOL, true)}</div>
      <div>Token: {formatTokenBalance(totalTokenBalance)}</div>
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
          position: 'relative',
        }}
      >
        {showMask && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              zIndex: 10,
              cursor: 'not-allowed',
            }}
          />
        )}
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
                  SOL: {formatBalance(totalSolBalance / LAMPORTS_PER_SOL, true)}{' '}
                  | Token: {formatTokenBalance(totalTokenBalance)} |{' '}
                  {walletCount}w
                </Text>
              )}
            </div>
          </Tooltip>
        </div>
        <div style={{ flexShrink: 0 }}>
          <Space size="small">
            <Tooltip title={t('swarm.editName')}>
              <Button
                icon={<EditOutlined />}
                onClick={showModal}
                type="text"
                disabled={disabled}
              />
            </Tooltip>
            <Tooltip title={t('swarm.feed')}>
              <Button
                icon={<CoinOutlined style={{ color: token.colorPrimary }} />}
                onClick={onFeed}
                type="text"
                disabled={disabled}
              />
            </Tooltip>
            <Tooltip title={t('swarm.return')}>
              <Button
                icon={
                  <CoinBackOutlined style={{ color: token.colorWarning }} />
                }
                onClick={onReturn}
                type="text"
                disabled={disabled}
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
                  disabled={disabled}
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
                    disabled={disabled}
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
                  disabled={disabled}
                />
              </Tooltip>
            ) : (
              <>
                <Tooltip title={t('common.refresh')}>
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={onRefresh}
                    type="text"
                    disabled={disabled}
                  />
                </Tooltip>
                <Tooltip title={t('swarm.snipping', 'Target Wallet')}>
                  <Button
                    icon={
                      <AimOutlined
                        style={{
                          color: targetWallet ? token.colorPrimary : undefined,
                          animation: targetWallet
                            ? 'blink 1s infinite'
                            : 'none',
                        }}
                      />
                    }
                    onClick={showSnippingModal}
                    type="text"
                    disabled={disabled}
                  />
                </Tooltip>
                <Tooltip title={t('settings.configuration')}>
                  <Button
                    icon={<SettingOutlined />}
                    onClick={onConfig}
                    type="text"
                    disabled={disabled}
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

      {/* Snipping Modal */}
      <Modal
        title={t('swarm.targetWallet', 'Target Wallet')}
        open={isSnippingModalVisible}
        onOk={handleSnippingOk}
        onCancel={handleSnippingCancel}
        okText={t('common.confirm')}
        cancelText={t('common.cancel')}
      >
        <div style={{ marginBottom: '16px' }}>
          <Input
            value={walletAddress}
            onChange={handleWalletAddressChange}
            placeholder={t('swarm.enterWalletAddress', 'Enter wallet address')}
            readOnly={!!targetWallet}
            autoFocus={!targetWallet}
            suffix={
              <Button
                type="text"
                size="small"
                icon={<ClearOutlined />}
                onClick={handleClearWallet}
                disabled={!walletAddress.trim()}
                style={{
                  padding: '0 4px',
                  height: '20px',
                  minWidth: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              />
            }
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !targetWallet) {
                handleSnippingOk();
              }
            }}
          />
        </div>
      </Modal>

      {/* CSS for blink animation */}
      <style>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0.3; }
        }
      `}</style>
    </>
  );
};

export default SwarmHeader;
