import React from 'react';
import type { SwarmWalletListProps } from '@/models';
import { SwarmBalanceLayout, SwarmConfigLayout } from './layouts';

interface ExtendedSwarmWalletListProps extends SwarmWalletListProps {
  showMask?: boolean;
}

const SwarmWalletList: React.FC<ExtendedSwarmWalletListProps> = ({
  wallets,
  onWalletSelection,
  onSelectAll,
  showConfig,
  swarmConfig,
  onConfigChange,
  availableBuyAmounts,
  onAvailableBuyAmountsChange,
  disabled = false,
  showMask = false,
}) => {
  return (
    <div
      className="swarm-wallets"
      style={{ padding: '12px 6px', position: 'relative' }}
    >
      {!showConfig ? (
        <SwarmBalanceLayout
          wallets={wallets}
          onWalletSelection={onWalletSelection}
          onSelectAll={onSelectAll}
          disabled={disabled}
        />
      ) : (
        <SwarmConfigLayout
          wallets={wallets}
          onWalletSelection={onWalletSelection}
          onSelectAll={onSelectAll}
          swarmConfig={swarmConfig}
          onConfigChange={onConfigChange}
          availableBuyAmounts={availableBuyAmounts}
          onAvailableBuyAmountsChange={onAvailableBuyAmountsChange}
          disabled={disabled}
        />
      )}
      {showMask && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            zIndex: 1000,
            pointerEvents: 'all',
            cursor: 'not-allowed',
          }}
        />
      )}
    </div>
  );
};

export default SwarmWalletList;
