import {
  CREATE_CPMM_POOL_PROGRAM,
  CREATE_CPMM_POOL_FEE_ACC,
  DEV_CREATE_CPMM_POOL_PROGRAM,
  DEV_CREATE_CPMM_POOL_FEE_ACC,
  TxVersion,
} from "@raydium-io/raydium-sdk-v2";
import BN from "bn.js";

import { getEnvironment } from "cryptoUtils";

import { initSdk } from "./init";
import { web3 } from "@coral-xyz/anchor";

export async function createCPMMPool(
  mintA: web3.PublicKey,
  mintB: web3.PublicKey
): Promise<{ txId: string; poolId: web3.PublicKey }> {
  const raydium = await initSdk({ loadToken: true });
  const env = getEnvironment();

  // check token list here: https://api-v3.raydium.io/mint/list
  const mintATokenInfo = await raydium.token.getTokenInfo(mintA);
  const mintBTokenInfo = await raydium.token.getTokenInfo(mintB);

  const { execute, extInfo } = await raydium.cpmm.createPool({
    programId:
      env == "devnet" ? DEV_CREATE_CPMM_POOL_PROGRAM : CREATE_CPMM_POOL_PROGRAM,
    poolFeeAccount:
      env == "devnet" ? DEV_CREATE_CPMM_POOL_FEE_ACC : CREATE_CPMM_POOL_FEE_ACC,
    mintA: mintATokenInfo,
    mintB: mintBTokenInfo,
    mintAAmount: new BN(5 * 10 ** mintATokenInfo.decimals),
    mintBAmount: new BN(5 * 10 ** mintBTokenInfo.decimals),
    startTime: new BN(0),
    associatedOnly: false,
    ownerInfo: {
      useSOLBalance: true,
    },
    txVersion: TxVersion.V0,
  });

  const { txId } = await execute();
  console.log("Created pool info:", extInfo.address, ". In txn id: ", txId);

  return { txId: txId, poolId: extInfo.address.poolId };
}
