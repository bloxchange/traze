import React from 'react';
import type { SwarmWalletListProps } from '@/models';
import { SwarmBalanceLayout, SwarmConfigLayout } from './layouts';

const SwarmWalletList: React.FC<SwarmWalletListProps> = ({
  wallets,
  onWalletSelection,
  onSelectAll,
  showConfig,
  swarmConfig,
  onConfigChange,
}) => {
  return (
    <div className="swarm-wallets" style={{ padding: '12px 6px' }}>
      {!showConfig ? (
        <SwarmBalanceLayout
          wallets={wallets}
          onWalletSelection={onWalletSelection}
          onSelectAll={onSelectAll}
        />
      ) : (
        <SwarmConfigLayout
          wallets={wallets}
          onWalletSelection={onWalletSelection}
          onSelectAll={onSelectAll}
          swarmConfig={swarmConfig}
          onConfigChange={onConfigChange}
        />
      )}
    </div>
  );
};

export default SwarmWalletList;
