import React, { useState } from 'react';
import { Card, message } from 'antd';
import { useTranslation } from 'react-i18next';
import './index.css';
import CreateSwarmModal from './CreateSwarmModal';
import FeedSwarmModal from './FeedSwarmModal';
import SwarmHeader from './SwarmHeader';
import SwarmWalletList from './SwarmWalletList';
import SwarmFooter from './SwarmFooter';
import { SwarmConfig } from './config';
import type { WalletInfo, SwarmProps } from '../../models/wallet';
import { CreateSwarmCommand } from '../../domain/commands';
import ReturnSwarmModal from './ReturnSwarmModal';

const Swarm: React.FC<SwarmProps> = ({
  name: initialName,
  wallets,
  onNameChange }) => {
  const { t } = useTranslation();
  const [walletList, setWalletList] = useState<WalletInfo[]>(wallets);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [isFeedModalOpen, setIsFeedModalOpen] = useState(false);

  const handleFeed = () => {
    setIsFeedModalOpen(true);
  };

  const handleFeedSubmit = (_: string, amount: number) => {
    // TODO: Implement actual feed logic here
    message.success(t('swarm.feedSuccess', { amount }));
    setIsFeedModalOpen(false);
  };

  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);

  const handleReturn = () => {
    setIsReturnModalOpen(true);
  };

  const handleReturnSubmit = (targetWallet: string) => {
    message.success(t('swarm.returnSuccess', { targetWallet }));
    setIsReturnModalOpen(false);
  };

  const handleClear = () => {
    if (walletList.length === 0) {
      setIsCreateModalOpen(true);
    } else {
      setWalletList([]);
      message.success(t('Wallets cleared successfully'));
    }
  };

  const handleCreateModalSubmit = (privateKeys: string[], generateCount: number) => {
    try {
      const createCommand = new CreateSwarmCommand(privateKeys, generateCount);
      const newWallets = createCommand.execute();
      setWalletList(newWallets);
      setIsCreateModalOpen(false);
      message.success(t('swarm.walletsCreatedSuccess'));
    } catch {
      message.error(t('swarm.createModal.invalidPrivateKey'));
    }
  };

  const handleWalletSelection = (publicKey: string, checked: boolean) => {
    setWalletList(prevList =>
      prevList.map(wallet =>
        wallet.publicKey === publicKey ? { ...wallet, selected: checked } : wallet
      )
    );
  };

  const handleSelectAll = (checked: boolean) => {
    setWalletList(prevList =>
      prevList.map(wallet => ({ ...wallet, selected: checked }))
    );
  };

  const handleBuy = () => {
    // Implement buy logic
  };

  const handleSell = () => {
    // Implement sell logic
  };

  const handleFlush = () => {
    // Implement flush logic
  };

  return (
    <Card
      className="swarm-card"
      styles={{
        body: {
          height: '100%',
          padding: 6,
          display: 'flex',
          flexDirection: 'column'
        }
      }}
    >
      <SwarmHeader
        name={initialName}
        onNameChange={onNameChange}
        onFeed={handleFeed}
        onReturn={handleReturn}
        onClear={handleClear}
        onConfig={() => setShowConfig(true)}
        onShowList={() => setShowConfig(false)}
        showConfig={showConfig}
        walletCount={walletList.length}
      />
      {showConfig ? (
        <SwarmConfig />
      ) : (
        <>
          <SwarmWalletList
            wallets={walletList}
            onWalletSelection={handleWalletSelection}
            onSelectAll={handleSelectAll}
          />
          <SwarmFooter
            onBuy={handleBuy}
            onSell={handleSell}
            onFlush={handleFlush}
          />
        </>
      )}
      <CreateSwarmModal
        open={isCreateModalOpen}
        onCancel={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateModalSubmit}
      />
      <FeedSwarmModal
        open={isFeedModalOpen}
        onCancel={() => setIsFeedModalOpen(false)}
        onSubmit={handleFeedSubmit}
        wallets={walletList}
      />
      <ReturnSwarmModal
        open={isReturnModalOpen}
        onCancel={() => setIsReturnModalOpen(false)}
        onSubmit={handleReturnSubmit}
        wallets={walletList}
      />
    </Card>
  );
};

export default Swarm;