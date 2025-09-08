import { Keypair } from '@solana/web3.js';
import type { SwarmConfigFormValues } from './swarm-config';

export interface WalletInfo {
  publicKey: string;
  keypair: Keypair;
  solBalance: number;
  tokenBalance: number;
  selected: boolean;
}

export interface SwarmProps {
  name: string;
  wallets: WalletInfo[];
  onNameChange: (name: string) => void;
}

export interface SwarmWalletListProps {
  wallets: WalletInfo[];
  onWalletSelection: (publicKey: string, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  showConfig: boolean;
  swarmConfig: SwarmConfigFormValues;
  onConfigChange: (values: SwarmConfigFormValues) => void;
  availableBuyAmounts: string[];
  onAvailableBuyAmountsChange: (amounts: string[]) => void;
  availableSellPercentages: string[];
  onAvailableSellPercentagesChange: (percentages: string[]) => void;
  disabled?: boolean;
}

export interface CreateSwarmModalProps {
  open: boolean;
  onCancel: () => void;
  onSubmit: (privateKeys: string[], generateCount: number) => Promise<void>;
}

export interface FeedSwarmModalProps {
  open: boolean;
  onCancel: () => void;
  onSubmit: (sourceWallet: string, amount: number) => void;
  wallets: string[];
}
