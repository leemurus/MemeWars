import {
  ApiV3PoolInfoStandardItemCpmm,
  CurveCalculator,
} from "@raydium-io/raydium-sdk-v2";
import { initSdk } from "./init";
import BN from "bn.js";
import { web3 } from "@coral-xyz/anchor";

export async function swapOnlyCpmmById(
  poolId: web3.PublicKey,
  inputAmount: number
): Promise<{ txId: string }> {
  const raydium = await initSdk();

  // it doesn't work
  const data = await raydium.api.fetchPoolById({
    ids: poolId.toString(),
  });
  const poolInfo = data[0] as ApiV3PoolInfoStandardItemCpmm;
  const rpcData = await raydium.cpmm.getRpcPoolInfo(poolInfo.id, true);

  // swap pool mintA for mintB
  const swapResult = CurveCalculator.swap(
    new BN(inputAmount),
    rpcData.baseReserve,
    rpcData.quoteReserve,
    rpcData.configInfo!.tradeFeeRate
  );

  const { execute } = await raydium.cpmm.swap({
    poolInfo,
    swapResult,
    baseIn: true,
  });

  const { txId } = await execute();
  console.log(
    `Swapped: ${poolInfo.mintA.symbol} to ${poolInfo.mintB.symbol}:`,
    { txId }
  );

  return { txId: txId };
}
