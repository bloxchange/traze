export interface SellConfigValues {
  sellPercentages: string[];
  sellDelay: number;
  useJitoBundle: boolean;
}

export interface BuyConfigValues {
  buyAmounts: string[];
  buyDelay: number;
}

export interface GeneralConfigValues {
  slippageBasisPoints: number;
  priorityFee: number;
  jitoTipAmount: number;
}

export interface SwarmConfigFormValues
  extends BuyConfigValues,
    SellConfigValues,
    GeneralConfigValues {}

export interface GeneralConfigProps {
  defaultSlippage?: number;
  defaultPriorityFee?: number;
  defaultJitoTipAmount?: number;
}

export interface SellConfigProps {
  availablePercentages: string[];
  defaultUseJitoBundle?: boolean;
}

export interface BuyConfigProps {
  availableAmounts: string[];
  onAmountEdit: () => void;
}
