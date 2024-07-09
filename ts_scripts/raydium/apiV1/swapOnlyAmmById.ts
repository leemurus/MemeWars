import {
  jsonInfo2PoolKeys,
  Liquidity,
  LiquidityPoolKeys,
  Percent,
  Token,
  TokenAmount,
  TokenAccount,
  TxVersion,
} from "@raydium-io/raydium-sdk";
import { Keypair, PublicKey } from "@solana/web3.js";

import { getAMMPoolByAMMId } from "raydium/apiV1/getAmmPoolById";
import { buildAndSendTx } from "raydium/utils";
import { getConnection, getWallet } from "cryptoUtils";

type TestTxInputInfo = {
  targetPool: PublicKey;

  inputTokenAmount: TokenAmount;
  outputToken: Token;

  slippage: number; // percents 0..100
  walletTokenAccounts: TokenAccount[];
  wallet: Keypair;
};

/*
 * Example: 
 * await swapOnlyAmmByPoolId({
    targetPool: ammId,
    inputTokenAmount: new TokenAmount(
      baseToken,
      2.5 * 10 ** baseToken.decimals
    ),
    outputToken: quoteToken,
    slippage: 3,
    walletTokenAccounts: tokenAccounts,
    wallet: getWallet(),
  });
*/
export async function swapOnlyAmmByPoolId(input: TestTxInputInfo) {
  const connection = getConnection();

  // Get pool info
  const targetPoolInfo = await getAMMPoolByAMMId(input.targetPool);
  const poolKeys = jsonInfo2PoolKeys(targetPoolInfo) as LiquidityPoolKeys;

  // Compute amount out
  const { amountOut, minAmountOut } = Liquidity.computeAmountOut({
    poolKeys: poolKeys,
    poolInfo: await Liquidity.fetchInfo({ connection, poolKeys }),
    amountIn: input.inputTokenAmount,
    currencyOut: input.outputToken,
    slippage: new Percent(input.slippage),
  });

  // Create instructions
  const { innerTransactions } = await Liquidity.makeSwapInstructionSimple({
    connection,
    poolKeys,
    userKeys: {
      tokenAccounts: input.walletTokenAccounts,
      owner: input.wallet.publicKey,
    },
    amountIn: input.inputTokenAmount,
    amountOut: minAmountOut,
    fixedSide: "in",
    makeTxVersion: TxVersion.V0,
  });

  console.log(
    "amountOut:",
    amountOut.toFixed(),
    " minAmountOut: ",
    minAmountOut.toFixed()
  );

  return { txids: await buildAndSendTx(getWallet(), innerTransactions) };
}
