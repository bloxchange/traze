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
import type { SwarmConfigFormValues } from '../../models';
import { CreateSwarmCommand, SwarmBuyCommand, SwarmSellCommand } from '../../domain/commands';
import ReturnSwarmModal from './ReturnSwarmModal';
import bs58 from 'bs58';
import { useConfiguration, useToken } from '../../hooks';

const Swarm: React.FC<SwarmProps> = ({
  name: initialName,
  wallets = [],
  onNameChange }) => {
  const { t } = useTranslation();
  const [walletList, setWalletList] = useState<WalletInfo[]>(wallets);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [isFeedModalOpen, setIsFeedModalOpen] = useState(false);
  const [name, setName] = useState(initialName);

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

      // Download wallet information if wallets were generated
      if (generateCount > 0) {
        const publicKeysString = newWallets
          .map(wallet => wallet.publicKey)
          .join('\n');
        const privateKeysString = newWallets
          .map(wallet => bs58.encode(wallet.keypair.secretKey))
          .join('\n');

        const content = `Public Keys:\n${publicKeysString}\n\nPrivate Keys:\n${privateKeysString}`;
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `wallets_${name}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

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

  const handleNameChange = (newName: string) => {
    setName(newName);

    onNameChange(newName);
  };

  const { configuration } = useConfiguration();
  const { tokenState } = useToken();
  const [swarmConfig, setSwarmConfig] = useState<SwarmConfigFormValues>();

  const handleBuy = async () => {
    if (!tokenState.currentToken) {
      message.error(t('swarm.noTokenSelected'));
      return;
    }

    if (!swarmConfig) {
      message.error(t('swarm.noConfigSet'));
      return;
    }

    try {
      const buyCommand = new SwarmBuyCommand(
        walletList,
        tokenState.currentToken.mint,
        swarmConfig.buyAmounts,
        swarmConfig.buyDelay,
        swarmConfig.slippageBasisPoints,
        configuration
      );

      await buyCommand.execute();
      message.success(t('swarm.buySuccess'));
    } catch (error) {
      message.error(t('swarm.buyError'));
      console.error('Buy error:', error);
    }
  };

  const handleSell = async () => {
    if (!tokenState.currentToken) {
      message.error(t('swarm.noTokenSelected'));
      return;
    }

    if (!swarmConfig) {
      message.error(t('swarm.noConfigSet'));
      return;
    }

    try {
      const sellCommand = new SwarmSellCommand(
        walletList,
        tokenState.currentToken.mint,
        swarmConfig.sellPercentages,
        swarmConfig.sellDelay,
        swarmConfig.slippageBasisPoints,
        configuration
      );

      await sellCommand.execute();
      message.success(t('swarm.sellSuccess'));
    } catch (error) {
      message.error(t('swarm.sellError'));
      console.error('Sell error:', error);
    }
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
          padding: '0 6px 6px 6px',
          display: 'flex',
          flexDirection: 'column'
        }
      }}
      variant='borderless'
    >
      <SwarmHeader
        name={name}
        onNameChange={handleNameChange}
        onFeed={handleFeed}
        onReturn={handleReturn}
        onClear={handleClear}
        onConfig={() => setShowConfig(true)}
        onShowList={() => setShowConfig(false)}
        showConfig={showConfig}
        walletCount={walletList.length}
      />
      {showConfig ? (
        <SwarmConfig
          initialConfig={swarmConfig}
          onConfigChange={(values) => {
            setSwarmConfig(values);
          }}
        />
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