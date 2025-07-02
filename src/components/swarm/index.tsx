import React, { useState, useEffect } from 'react';
import { Card, message } from 'antd';
import { useTranslation } from 'react-i18next';
import './index.css';
import CreateSwarmModal from './CreateSwarmModal';
import FeedSwarmModal from './FeedSwarmModal';
import SwarmHeader from './SwarmHeader';
import SwarmWalletList from './SwarmWalletList';
import SwarmFooter from './SwarmFooter';
import type { WalletInfo, SwarmProps } from '../../models/wallet';
import type { SwarmConfigFormValues } from '../../models';
import { CreateSwarmCommand, SwarmBuyCommand, SwarmSellCommand } from '../../domain/commands';
import ReturnSwarmModal from './ReturnSwarmModal';
import bs58 from 'bs58';
import { useConfiguration, useToken } from '@/hooks';
import { SwarmJitoFlushCommand } from '@/domain/commands/SwarmJitoFlushCommand';
import { SwarmFlushCommand } from '@/domain/commands/SwarmFlushCommand';
import { globalEventEmitter } from '../../domain/infrastructure/events/EventEmitter';
import { EVENTS, type BalanceChangeData } from '../../domain/infrastructure/events/types';
import { Connection } from '@solana/web3.js';
import { getBalance, getTokenBalance } from '../../domain/rpc';

const Swarm: React.FC<SwarmProps> = ({ name: initialName, wallets = [], onNameChange }) => {
  const { configuration } = useConfiguration();
  const { tokenState } = useToken();
  const { t } = useTranslation();
  const [walletList, setWalletList] = useState<WalletInfo[]>(wallets);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [swarmConfig, setSwarmConfig] = useState<SwarmConfigFormValues>({
    buyAmounts: [],
    sellPercentages: [],
    buyDelay: 0,
    sellDelay: 0,
    slippageBasisPoints: 4900,
    priorityFee: 0.0001,
    jitoTipAmount: 0.0001,
    useJitoBundle: false,
  });
  const [isFeedModalOpen, setIsFeedModalOpen] = useState(false);
  const [name, setName] = useState(initialName);

  const handleFeed = () => {
    setIsFeedModalOpen(true);
  };

  const handleFeedSubmit = (_: string, amount: number) => {
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

  const handleCreateModalSubmit = async (privateKeys: string[], generateCount: number) => {
    try {
      const createCommand = new CreateSwarmCommand(
        privateKeys,
        generateCount,
        configuration.rpcUrl,
        tokenState.currentToken?.mint
      );

      const newWallets = await createCommand.execute();

      // Download wallet information if wallets were generated
      if (generateCount > 0) {
        const publicKeysString = newWallets.map((wallet) => wallet.publicKey).join('\n');

        const privateKeysString = newWallets
          .map((wallet) => bs58.encode(wallet.keypair.secretKey))
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
    setWalletList((prevList) =>
      prevList.map((wallet) =>
        wallet.publicKey === publicKey ? { ...wallet, selected: checked } : wallet
      )
    );
  };

  const handleSelectAll = (checked: boolean) => {
    setWalletList((prevList) => prevList.map((wallet) => ({ ...wallet, selected: checked })));
  };

  const handleNameChange = (newName: string) => {
    setName(newName);

    onNameChange(newName);
  };

  const handleRefresh = async () => {
    try {
      const connection = new Connection(configuration.rpcUrl);
      const updatedWallets = await Promise.all(
        walletList.map(async (wallet) => {
          const newSolBalance = await getBalance(connection, wallet.publicKey);
          let newTokenBalance = wallet.tokenBalance;
          
          if (tokenState.currentToken) {
            newTokenBalance = await getTokenBalance(
              connection,
              wallet.publicKey,
              tokenState.currentToken.mint
            );
          }

          return {
            ...wallet,
            solBalance: newSolBalance,
            tokenBalance: newTokenBalance
          };
        })
      );

      setWalletList(updatedWallets);
      message.success(t('common.refreshSuccess'));
    } catch (error) {
      console.error('Refresh error:', error);
      message.error(t('common.refreshError'));
    }
  };

  useEffect(() => {
    // Subscribe to balance changes for each wallet
    const subscriptions = walletList.map(wallet => {
      const callback = async (data: BalanceChangeData) => {
        if (data.owner.toBase58() === wallet.publicKey) {
          setWalletList(prevList =>
            prevList.map(w =>
              w.publicKey === wallet.publicKey
                ? {
                    ...w,
                    solBalance: data.tokenMint === '' ? w.solBalance + data.amount : w.solBalance,
                    tokenBalance: data.tokenMint !== '' && tokenState.currentToken && 
                                data.tokenMint === tokenState.currentToken.mint ? 
                                w.tokenBalance + data.amount : w.tokenBalance
                  }
                : w
            )
          );
        }
      };

      const eventName = `${EVENTS.BalanceChanged}_${wallet.publicKey}`;
      globalEventEmitter.on<BalanceChangeData>(eventName, callback);
      return { eventName, callback };
    });

    // Cleanup subscriptions
    return () => {
      subscriptions.forEach(({ eventName, callback }) => {
        globalEventEmitter.off<BalanceChangeData>(eventName, callback);
      });
    };
  }, [walletList, configuration.rpcUrl, tokenState.currentToken]);

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
        swarmConfig.priorityFee,
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
        swarmConfig.priorityFee,
        configuration
      );

      await sellCommand.execute();

      message.success(t('swarm.sellSuccess'));
    } catch (error) {
      message.error(t('swarm.sellError'));

      console.error('Sell error:', error);
    }
  };

  const handleFlush = async () => {
    if (!tokenState.currentToken?.mint) {
      message.error(t('swarm.noTokenSelected'));
      return;
    }

    try {
      if (swarmConfig.useJitoBundle) {
        const command = new SwarmJitoFlushCommand(
          walletList,
          tokenState.currentToken.mint,
          BigInt(swarmConfig.slippageBasisPoints),
          swarmConfig.jitoTipAmount,
          swarmConfig.priorityFee,
          configuration
        );

        await command.execute();
      } else {
        const command = new SwarmFlushCommand(
          walletList,
          tokenState.currentToken.mint,
          BigInt(swarmConfig.slippageBasisPoints),
          swarmConfig.priorityFee,
          configuration
        );

        await command.execute();
      }
      message.success(t('swarm.flushSuccess'));
    } catch (error) {
      message.error(t('swarm.flushError'));

      console.error('Flush error:', error);
    }
  };

  return (
    <Card
      className="swarm-card"
      styles={{
        body: {
          height: '100%',
          padding: '0 6px 6px 6px',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
      variant="borderless"
    >
      <SwarmHeader
        name={name}
        onNameChange={handleNameChange}
        onFeed={handleFeed}
        onReturn={handleReturn}
        onClear={handleClear}
        onConfig={() => setShowConfig(true)}
        onShowList={() => setShowConfig(false)}
        onRefresh={handleRefresh}
        showConfig={showConfig}
        walletCount={walletList.length}
      />
      <SwarmWalletList
        wallets={walletList}
        onWalletSelection={handleWalletSelection}
        onSelectAll={handleSelectAll}
        showConfig={showConfig}
        swarmConfig={swarmConfig}
        onConfigChange={setSwarmConfig}
      />
      <SwarmFooter onBuy={handleBuy} onSell={handleSell} onFlush={handleFlush} />
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
