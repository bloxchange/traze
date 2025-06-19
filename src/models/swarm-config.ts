export interface SellConfigValues {
  sellPercentages: string[];
  sellDelay: number;
}

export interface BuyConfigValues {
  buyAmounts: string[];
  buyDelay: number;
}

export interface SwarmConfigFormValues extends BuyConfigValues, SellConfigValues {}

export interface SellConfigProps {
  availablePercentages: string[];
}

export interface BuyConfigProps {
  availableAmounts: string[];
  onAmountEdit: () => void;
}