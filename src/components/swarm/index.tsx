import React, { useState, useEffect, useRef } from 'react';
import { Card, App as AntdApp } from 'antd';
import { useTranslation } from 'react-i18next';
import './index.css';
import CreateSwarmModal from './CreateSwarmModal';
import FeedSwarmModal from './FeedSwarmModal';
import SwarmHeader from './SwarmHeader';
import SwarmWalletList from './SwarmWalletList';
import SwarmFooter from './SwarmFooter';
import type { WalletInfo, SwarmProps } from '../../models/wallet';
import type { SwarmConfigFormValues } from '../../models';
import {
  CreateSwarmCommand,
  SwarmBuyCommand,
  SwarmBuyAllSolCommand,
  SwarmBuyTillRunOutCommand,
  SwarmSellCommand,
  GetWalletBalanceCommand,
} from '../../domain/commands';
import { SwarmSellTillRunOutCommand } from '../../domain/commands/SwarmSellTillRunOutCommand';
import ReturnSwarmModal from './ReturnSwarmModal';
import bs58 from 'bs58';
import { useConfiguration, useToken } from '@/hooks';
import { SwarmJitoFlushCommand } from '@/domain/commands/SwarmJitoFlushCommand';
import { SwarmFlushCommand } from '@/domain/commands/SwarmFlushCommand';
import { globalEventEmitter } from '../../domain/infrastructure/events/EventEmitter';
import {
  EVENTS,
  type BalanceChangeData,
  type BalanceFetchedData,
  type SwarmCreatedData,
  type SwarmClearedData,
  type StopSignalData,
} from '../../domain/infrastructure/events/types';

/**
 * Generate a unique component ID for tracking operations
 */
const generateComponentId = (): string => {
  return `swarm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const Swarm: React.FC<SwarmProps> = ({
  name: initialName,
  wallets = [],
  onNameChange,
}) => {
  const { message } = AntdApp.useApp();
  const { configuration } = useConfiguration();
  const { tokenState } = useToken();
  const { t } = useTranslation();
  const [walletList, setWalletList] = useState<WalletInfo[]>(wallets);

  // Component ID for tracking operations
  const componentId = useRef<string>(generateComponentId());

  // State to track running operations
  const [runningOperations, setRunningOperations] = useState<{
    buyTillRunOut: boolean;
    sellTillRunOut: boolean;
  }>({ buyTillRunOut: false, sellTillRunOut: false });

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [swarmConfig, setSwarmConfig] = useState<SwarmConfigFormValues>({
    buyAmounts: [],
    sellPercentages: [],
    buyDelay: 0,
    sellDelay: 0,
    buySlippage: 500,
    sellSlippage: 4900,
    priorityFee: 0.0001,
    jitoTipAmount: 0.0001,
    useJitoBundle: false,
  });
  const [availableBuyAmounts, setAvailableBuyAmounts] = useState([
    '0.1',
    '0.5',
    '1',
    '2',
    '5',
  ]);
  const [availableSellPercentages, setAvailableSellPercentages] = useState([
    '25',
    '50',
    '75',
    '100',
  ]);
  const [isFeedModalOpen, setIsFeedModalOpen] = useState(false);
  const [name, setName] = useState(initialName);
  const [totalSolBalance, setTotalSolBalance] = useState(0);
  const [totalTokenBalance, setTotalTokenBalance] = useState(0);
  const [targetWallet, setTargetWallet] = useState('');

  // Calculate total balances from wallet list
  const calculateTotalBalances = (wallets: WalletInfo[]) => {
    const solTotal = wallets.reduce(
      (sum, wallet) => sum + wallet.solBalance,
      0
    );
    const tokenTotal = wallets.reduce(
      (sum, wallet) => sum + wallet.tokenBalance,
      0
    );
    setTotalSolBalance(solTotal);
    setTotalTokenBalance(tokenTotal);
  };

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
      // Emit SwarmCleared event before clearing
      if (walletList.length > 0) {
        const swarmClearedData: SwarmClearedData = {
          walletPublicKeys: walletList.map((wallet) => wallet.publicKey),
        };
        globalEventEmitter.emit(EVENTS.SwarmCleared, swarmClearedData);
      }

      setWalletList([]);
      setTotalSolBalance(0);
      setTotalTokenBalance(0);

      message.success(t('Wallets cleared successfully'));
    }
  };

  const handleCreateModalSubmit = async (
    privateKeys: string[],
    generateCount: number
  ) => {
    try {
      const createCommand = new CreateSwarmCommand(
        privateKeys,
        generateCount,
        tokenState.currentToken?.mint
      );

      const newWallets = await createCommand.execute();

      // Download wallet information if wallets were generated
      if (generateCount > 0) {
        const publicKeysString = newWallets
          .map((wallet) => wallet.publicKey)
          .join('\n');

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
      calculateTotalBalances(newWallets);

      // Emit SwarmCreated event
      if (tokenState.currentToken && newWallets.length > 0) {
        const swarmCreatedData: SwarmCreatedData = {
          wallets: newWallets.map((wallet) => ({
            publicKey: wallet.publicKey,
            solBalance: wallet.solBalance,
            tokenBalance: wallet.tokenBalance,
          })),
          tokenMint: tokenState.currentToken.mint,
        };
        globalEventEmitter.emit(EVENTS.SwarmCreated, swarmCreatedData);
      }

      setIsCreateModalOpen(false);

      message.success(t('swarm.walletsCreatedSuccess'));
    } catch {
      message.error(t('swarm.createModal.invalidPrivateKey'));
    }
  };

  const handleWalletSelection = (publicKey: string, checked: boolean) => {
    setWalletList((prevList) =>
      prevList.map((wallet) =>
        wallet.publicKey === publicKey
          ? { ...wallet, selected: checked }
          : wallet
      )
    );
  };

  const handleSelectAll = (checked: boolean) => {
    setWalletList((prevList) =>
      prevList.map((wallet) => ({ ...wallet, selected: checked }))
    );
  };

  const handleNameChange = (newName: string) => {
    setName(newName);

    onNameChange(newName);
  };

  /**
   * Handle target wallet change for snipping functionality
   */
  const handleTargetWalletChange = (wallet: string) => {
    setTargetWallet(wallet);
  };

  const handleRefresh = async () => {
    try {
      if (!tokenState.currentToken) {
        message.error(t('swarm.noTokenSelected'));
        return;
      }

      // Execute GetWalletBalanceCommand for each wallet
      await Promise.all(
        walletList.map(async (wallet) => {
          const command = new GetWalletBalanceCommand(
            wallet.publicKey,
            tokenState.currentToken!.mint
          );
          await command.execute();
        })
      );

      message.success(t('common.refreshSuccess'));
    } catch (error) {
      console.error('Refresh error:', error);
      message.error(t('common.refreshError'));
    }
  };

  useEffect(() => {
    // Subscribe to balance changes for each wallet
    const balanceChangeSubscriptions = walletList.map((wallet) => {
      const callback = async (data: BalanceChangeData) => {
        if (data.owner.toBase58() === wallet.publicKey) {
          if (configuration.balanceUpdateMode === 'rpc') {
            // Use GetWalletBalanceCommand to fetch fresh balances
            if (tokenState.currentToken) {
              const command = new GetWalletBalanceCommand(
                wallet.publicKey,
                tokenState.currentToken.mint
              );
              await command.execute();
            }
          } else {
            setWalletList((prevList) => {
              const updatedList = prevList.map((w) =>
                w.publicKey === wallet.publicKey
                  ? {
                      ...w,
                      solBalance:
                        data.tokenMint === ''
                          ? w.solBalance + data.amount
                          : w.solBalance,
                      tokenBalance:
                        data.tokenMint !== '' &&
                        tokenState.currentToken &&
                        data.tokenMint === tokenState.currentToken.mint
                          ? w.tokenBalance + data.amount
                          : w.tokenBalance,
                    }
                  : w
              );
              calculateTotalBalances(updatedList);
              return updatedList;
            });
          }
        }
      };

      const eventName = `${EVENTS.BalanceChanged}_${wallet.publicKey}`;
      globalEventEmitter.on<BalanceChangeData>(eventName, callback);
      return { eventName, callback };
    });

    // Subscribe to balance fetched events for each wallet
    const balanceFetchedSubscriptions = walletList.map((wallet) => {
      const callback = (data: BalanceFetchedData) => {
        if (data.owner.toBase58() === wallet.publicKey) {
          setWalletList((prevList) => {
            const updatedList = prevList.map((w) =>
              w.publicKey === wallet.publicKey
                ? {
                    ...w,
                    solBalance: data.solBalance,
                    tokenBalance: data.tokenBalance,
                  }
                : w
            );
            calculateTotalBalances(updatedList);
            return updatedList;
          });
        }
      };

      const eventName = `${EVENTS.BalanceFetched}_${wallet.publicKey}`;
      globalEventEmitter.on<BalanceFetchedData>(eventName, callback);
      return { eventName, callback };
    });

    const allSubscriptions = [
      ...balanceChangeSubscriptions,
      ...balanceFetchedSubscriptions,
    ];

    // Cleanup subscriptions
    return () => {
      balanceChangeSubscriptions.forEach(({ eventName, callback }) => {
        globalEventEmitter.off<BalanceChangeData>(eventName, callback);
      });
      balanceFetchedSubscriptions.forEach(({ eventName, callback }) => {
        globalEventEmitter.off<BalanceFetchedData>(eventName, callback);
      });
    };
  }, [walletList, tokenState.currentToken, configuration.balanceUpdateMode]);

  // Calculate total balances when wallet list changes
  useEffect(() => {
    calculateTotalBalances(walletList);
  }, [walletList.length]); // Only recalculate when wallet count changes, not on balance updates

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
        swarmConfig.buySlippage,
        swarmConfig.priorityFee,
        tokenState.buyComputeUnitsConsumed,
        tokenState.buyCostUnits
      );

      await buyCommand.execute();

      message.success(t('swarm.buySuccess'));
    } catch (error) {
      message.error(t('swarm.buyError'));

      console.error('Buy error:', error);
    }
  };

  const handleBuyAllSol = async () => {
    if (!tokenState.currentToken) {
      message.error(t('swarm.noTokenSelected'));

      return;
    }

    if (!swarmConfig) {
      message.error(t('swarm.noConfigSet'));

      return;
    }

    try {
      const buyAllSolCommand = new SwarmBuyAllSolCommand(
        walletList,
        tokenState.currentToken.mint,
        swarmConfig.buyDelay,
        swarmConfig.buySlippage,
        swarmConfig.priorityFee,
        tokenState.buyComputeUnitsConsumed,
        tokenState.buyCostUnits
      );

      await buyAllSolCommand.execute();

      message.success(t('swarm.buySuccess'));
    } catch (error) {
      message.error(t('swarm.buyError'));

      console.error('Buy All SOL error:', error);
    }
  };

  const handleBuyAllInOne = async () => {
    if (!tokenState.currentToken) {
      message.error(t('swarm.noTokenSelected'));
      return;
    }

    if (!swarmConfig) {
      message.error(t('swarm.noConfigSet'));
      return;
    }

    try {
      // Set operation as running
      setRunningOperations((prev) => ({ ...prev, buyTillRunOut: true }));

      const buyTillRunOutCommand = new SwarmBuyTillRunOutCommand(
        walletList,
        tokenState.currentToken.mint,
        swarmConfig.buyAmounts,
        swarmConfig.buyDelay,
        swarmConfig.buySlippage,
        swarmConfig.priorityFee,
        tokenState.buyComputeUnitsConsumed,
        tokenState.buyCostUnits,
        componentId.current
      );

      await buyTillRunOutCommand.execute();
      message.success(t('swarm.buySuccess'));
    } catch (error) {
      message.error(t('swarm.buyError'));
      console.error('Buy All in One error:', error);
    } finally {
      // Reset operation state
      setRunningOperations((prev) => ({ ...prev, buyTillRunOut: false }));
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
        swarmConfig.sellSlippage,
        swarmConfig.priorityFee,
        tokenState.sellComputeUnitsConsumed,
        tokenState.sellCostUnits
      );

      await sellCommand.execute();

      message.success(t('swarm.sellSuccess'));
    } catch (error) {
      message.error(t('swarm.sellError'));

      console.error('Sell error:', error);
    }
  };

  const handleSellTillRunOut = async () => {
    if (!tokenState.currentToken) {
      message.error(t('swarm.noTokenSelected'));
      return;
    }

    if (!swarmConfig) {
      message.error(t('swarm.noConfigSet'));
      return;
    }

    try {
      // Set operation as running
      setRunningOperations((prev) => ({ ...prev, sellTillRunOut: true }));

      const sellTillRunOutCommand = new SwarmSellTillRunOutCommand(
        walletList,
        tokenState.currentToken.mint,
        swarmConfig.sellPercentages,
        swarmConfig.sellDelay,
        swarmConfig.sellSlippage,
        swarmConfig.priorityFee,
        tokenState.sellComputeUnitsConsumed,
        tokenState.sellCostUnits,
        componentId.current
      );

      await sellTillRunOutCommand.execute();
      message.success(t('swarm.sellTillRunOutSuccess'));
    } catch (error) {
      message.error(t('swarm.sellTillRunOutError'));
      console.error('Sell Till Run Out error:', error);
    } finally {
      // Reset operation state
      setRunningOperations((prev) => ({ ...prev, sellTillRunOut: false }));
    }
  };

  /**
   * Handle stopping buy till run out operation
   */
  const handleStopBuyTillRunOut = () => {
    const stopData: StopSignalData = {
      componentId: componentId.current,
      operation: 'buyTillRunOut',
    };
    globalEventEmitter.emit(EVENTS.StopSignal, stopData);
    setRunningOperations((prev) => ({ ...prev, buyTillRunOut: false }));
  };

  /**
   * Handle stopping sell till run out operation
   */
  const handleStopSellTillRunOut = () => {
    const stopData: StopSignalData = {
      componentId: componentId.current,
      operation: 'sellTillRunOut',
    };
    globalEventEmitter.emit(EVENTS.StopSignal, stopData);
    setRunningOperations((prev) => ({ ...prev, sellTillRunOut: false }));
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
          BigInt(swarmConfig.sellSlippage),
          swarmConfig.jitoTipAmount,
          swarmConfig.priorityFee,
          configuration
        );

        await command.execute();
      } else {
        const command = new SwarmFlushCommand(
          walletList,
          tokenState.currentToken.mint,
          BigInt(swarmConfig.sellSlippage),
          swarmConfig.priorityFee,
          tokenState.sellComputeUnitsConsumed,
          tokenState.sellCostUnits
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
        totalSolBalance={totalSolBalance}
        totalTokenBalance={totalTokenBalance}
        disabled={
          runningOperations.buyTillRunOut || runningOperations.sellTillRunOut
        }
        showMask={
          runningOperations.buyTillRunOut || runningOperations.sellTillRunOut
        }
        targetWallet={targetWallet}
        onTargetWalletChange={handleTargetWalletChange}
        wallets={walletList}
        swarmConfig={swarmConfig}
      />
      <SwarmWalletList
        wallets={walletList}
        onWalletSelection={handleWalletSelection}
        onSelectAll={handleSelectAll}
        showConfig={showConfig}
        swarmConfig={swarmConfig}
        onConfigChange={setSwarmConfig}
        availableBuyAmounts={availableBuyAmounts}
        onAvailableBuyAmountsChange={setAvailableBuyAmounts}
        availableSellPercentages={availableSellPercentages}
        onAvailableSellPercentagesChange={setAvailableSellPercentages}
        disabled={
          runningOperations.buyTillRunOut || runningOperations.sellTillRunOut
        }
        showMask={
          runningOperations.buyTillRunOut || runningOperations.sellTillRunOut
        }
      />
      <SwarmFooter
        onBuy={handleBuy}
        onBuyAllSol={handleBuyAllSol}
        onBuyAllInOne={handleBuyAllInOne}
        onSell={handleSell}
        onSellTillRunOut={handleSellTillRunOut}
        onFlush={handleFlush}
        runningOperations={runningOperations}
        onStopBuyTillRunOut={handleStopBuyTillRunOut}
        onStopSellTillRunOut={handleStopSellTillRunOut}
      />
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
