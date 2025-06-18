import React, { useState } from 'react';
import { Card, message } from 'antd';
import { useTranslation } from 'react-i18next';
import './index.css';
import CreateSwarmModal from './CreateSwarmModal';
import SwarmHeader from './SwarmHeader';
import SwarmWalletList from './SwarmWalletList';
import SwarmFooter from './SwarmFooter';
import SwarmConfig from './SwarmConfig';
import { Keypair } from '@solana/web3.js';

interface WalletInfo {
  publicKey: string;
  solBalance: number;
  tokenBalance: number;
  selected: boolean;
}

interface SwarmProps {
  name: string;
  wallets: string[];
  onNameChange?: (newName: string) => void;
}

const Swarm: React.FC<SwarmProps> = ({
  name: initialName,
  wallets,
  onNameChange }) => {
  const { t } = useTranslation();
  const [walletList, setWalletList] = useState<WalletInfo[]>(
    wallets.map(wallet => ({
      publicKey: wallet,
      solBalance: 0,
      tokenBalance: 0,
      selected: false
    }))
  );

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [showConfig, setShowConfig] = useState(false);

  const handleFeed = () => {
    // Implement feed logic
  };

  const handleReturn = () => {
    // Implement return logic
  };

  const handleClear = () => {
    if (walletList.length === 0) {
      setIsCreateModalOpen(true);
    } else {
      setWalletList([]);
      message.success(t('Wallets cleared successfully'));
    }
  };

  const handleCreateSubmit = (publicKeys: string[], generateCount: number) => {
    const newWallets = publicKeys.map(key => ({
      publicKey: key,
      solBalance: 0,
      tokenBalance: 0,
      selected: false
    }));

    const generatedWallets = Array.from({ length: generateCount }, () => ({
      publicKey: Keypair.generate().publicKey.toString(),
      solBalance: 0,
      tokenBalance: 0,
      selected: false
    }));

    setWalletList([...newWallets, ...generatedWallets]);
    setIsCreateModalOpen(false);
    message.success(t('Wallets created successfully'));
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
    <>
      <CreateSwarmModal
        open={isCreateModalOpen}
        onCancel={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateSubmit}
      />
      <Card className="swarm" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
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
          <SwarmConfig onBack={() => setShowConfig(false)} />
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
      </Card>
    </>
  );
};

export default Swarm;