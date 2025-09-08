export interface SellConfigValues {
  sellPercentages: string[];
  sellDelay: number;
  sellSlippage: number;
  useJitoBundle: boolean;
}

export interface BuyConfigValues {
  buyAmounts: string[];
  buyDelay: number;
  buySlippage: number;
}

export interface GeneralConfigValues {
  priorityFee: number;
  jitoTipAmount: number;
}

export interface SwarmConfigFormValues
  extends BuyConfigValues,
    SellConfigValues,
    GeneralConfigValues {}

export interface GeneralConfigProps {
  defaultPriorityFee?: number;
  defaultJitoTipAmount?: number;
}

export interface SellConfigProps {
  availablePercentages: string[];
  defaultSellSlippage?: number;
  defaultUseJitoBundle?: boolean;
  onPercentageEdit: () => void;
}

export interface BuyConfigProps {
  availableAmounts: string[];
  defaultBuySlippage?: number;
  onAmountEdit: () => void;
}
