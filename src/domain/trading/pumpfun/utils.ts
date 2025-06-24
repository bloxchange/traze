import { BONDING_CURVE_SEED, DEFAULT_COMMITMENT } from "@/domain/infrastructure/consts";
import { PublicKey, type Commitment } from "@solana/web3.js";

export function getBondingCurvePDA(mint: PublicKey, programId: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(BONDING_CURVE_SEED), mint.toBuffer()],
    programId
  )[0];
}

export async function getBondingCurveAccount(
  bondingCurvePda: PublicKey,
  commitment: Commitment = DEFAULT_COMMITMENT
) {
  const tokenAccount = await this.connection.getAccountInfo(
    bondingCurvePda,
    commitment
  );
  if (!tokenAccount) {
    return null;
  }
  return BondingCurveAccount.fromBuffer(tokenAccount!.data);
}