import { struct, bool, u64, type Layout } from '@coral-xyz/borsh';

export class BondingCurveAccount {
  public discriminator: bigint;
  public virtualTokenReserves: bigint;
  public virtualSolReserves: bigint;
  public realTokenReserves: bigint;
  public realSolReserves: bigint;
  public tokenTotalSupply: bigint;
  public complete: boolean;

  constructor(
    discriminator: bigint,
    virtualTokenReserves: bigint,
    virtualSolReserves: bigint,
    realTokenReserves: bigint,
    realSolReserves: bigint,
    tokenTotalSupply: bigint,
    complete: boolean
  ) {
    this.discriminator = discriminator;
    this.virtualTokenReserves = virtualTokenReserves;
    this.virtualSolReserves = virtualSolReserves;
    this.realTokenReserves = realTokenReserves;
    this.realSolReserves = realSolReserves;
    this.tokenTotalSupply = tokenTotalSupply;
    this.complete = complete;
  }

  getBuyPrice(amount: bigint): bigint {
    if (this.complete) {
      throw new Error('Curve is complete');
    }

    if (amount <= 0n) {
      return 0n;
    }

    // Calculate the product of virtual reserves
    const n = this.virtualSolReserves * this.virtualTokenReserves;

    // Calculate the new virtual sol reserves after the purchase
    const i = this.virtualSolReserves + amount;

    // Calculate the new virtual token reserves after the purchase
    const r = n / i + 1n;

    // Calculate the amount of tokens to be purchased
    const s = this.virtualTokenReserves - r;

    // Return the minimum of the calculated tokens and real token reserves
    return s < this.realTokenReserves ? s : this.realTokenReserves;
  }

  getSellPrice(amount: bigint, feeBasisPoints: bigint): bigint {
    if (this.complete) {
      throw new Error('Curve is complete');
    }

    if (amount <= 0n) {
      return 0n;
    }

    // Calculate the proportional amount of virtual sol reserves to be received
    const n = (amount * this.virtualSolReserves) / (this.virtualTokenReserves + amount);

    // Calculate the fee amount in the same units
    const a = (n * feeBasisPoints) / 10000n;

    // Return the net amount after deducting the fee
    return n - a;
  }

  getMarketCapSOL(): bigint {
    if (this.virtualTokenReserves === 0n) {
      return 0n;
    }

    return (this.tokenTotalSupply * this.virtualSolReserves) / this.virtualTokenReserves;
  }

  getFinalMarketCapSOL(feeBasisPoints: bigint): bigint {
    const totalSellValue = this.getBuyOutPrice(this.realTokenReserves, feeBasisPoints);

    const totalVirtualValue = this.virtualSolReserves + totalSellValue;

    const totalVirtualTokens = this.virtualTokenReserves - this.realTokenReserves;

    if (totalVirtualTokens === 0n) {
      return 0n;
    }

    return (this.tokenTotalSupply * totalVirtualValue) / totalVirtualTokens;
  }

  getBuyOutPrice(amount: bigint, feeBasisPoints: bigint): bigint {
    const solTokens = amount < this.virtualTokenReserves ? this.virtualTokenReserves : amount;

    const totalSellValue =
      (solTokens * this.virtualSolReserves) / (this.virtualTokenReserves - solTokens) + 1n;

    const fee = (totalSellValue * feeBasisPoints) / 10000n;

    return totalSellValue + fee;
  }

  public static fromBuffer(buffer: Buffer): BondingCurveAccount {
    const structure: Layout<BondingCurveAccount> = struct([
      u64('discriminator'),
      u64('virtualTokenReserves'),
      u64('virtualSolReserves'),
      u64('realTokenReserves'),
      u64('realSolReserves'),
      u64('tokenTotalSupply'),
      bool('complete'),
    ]);

    const value = structure.decode(buffer);

    return new BondingCurveAccount(
      BigInt(value.discriminator),
      BigInt(value.virtualTokenReserves),
      BigInt(value.virtualSolReserves),
      BigInt(value.realTokenReserves),
      BigInt(value.realSolReserves),
      BigInt(value.tokenTotalSupply),
      value.complete
    );
  }
}
