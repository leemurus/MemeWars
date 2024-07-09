import { BN } from "bn.js";

import {
  Liquidity,
  MAINNET_PROGRAM_ID,
  DEVNET_PROGRAM_ID,
  TxVersion,
  TokenAccount,
  Token,
} from "@raydium-io/raydium-sdk";
import { Keypair, PublicKey } from "@solana/web3.js";
import { buildAndSendTx, getWalletTokenAccounts } from "raydium/utils";
import { getConnection, getEnvironment, getWallet } from "cryptoUtils";
import { getTokenBySymbol } from "raydium/token";

type TestTxInputInfo = {
  baseToken: Token;
  quoteToken: Token;

  addBaseAmount: number;
  addQuoteAmount: number;

  targetMarketId: PublicKey;

  startTime: number; // seconds
  walletTokenAccounts: TokenAccount[];
  wallet: Keypair;
};

export async function createAMMPool(
  input: TestTxInputInfo
): Promise<{ ammId: PublicKey; txids: string[] }> {
  const env = getEnvironment();

  console.log(
    "Pool price:",
    (input.addBaseAmount * 10 ** input.baseToken.decimals) /
      (input.addQuoteAmount * 10 ** input.quoteToken.decimals)
  );

  const initPoolInstructionResponse =
    await Liquidity.makeCreatePoolV4InstructionV2Simple({
      connection: getConnection(),
      programId:
        env == "devnet" ? DEVNET_PROGRAM_ID.AmmV4 : MAINNET_PROGRAM_ID.AmmV4,
      marketInfo: {
        marketId: input.targetMarketId,
        programId:
          env == "devnet"
            ? DEVNET_PROGRAM_ID.OPENBOOK_MARKET
            : MAINNET_PROGRAM_ID.OPENBOOK_MARKET,
      },
      baseMintInfo: input.baseToken,
      quoteMintInfo: input.quoteToken,
      baseAmount: new BN(input.addBaseAmount * 10 ** input.baseToken.decimals),
      quoteAmount: new BN(
        input.addQuoteAmount * 10 ** input.quoteToken.decimals
      ),
      startTime: new BN(Math.floor(input.startTime)),
      ownerInfo: {
        feePayer: input.wallet.publicKey,
        wallet: input.wallet.publicKey,
        tokenAccounts: input.walletTokenAccounts,
        useSOLBalance: true,
      },
      associatedOnly: false,
      checkCreateATAOwner: true,
      makeTxVersion: TxVersion.V0,
      feeDestinationId:
        env == "devnet"
          ? new PublicKey("3XMrhbv989VxAMi3DErLV9eJht1pHppW5LbKxe9fkEFR")
          : new PublicKey("7YttLkHDoNj9wyDur5pM1ejNaAvT9X4eqaYcHQqtj2G5"),
    });

  return {
    txids: await buildAndSendTx(
      input.wallet,
      initPoolInstructionResponse.innerTransactions
    ),
    ammId: initPoolInstructionResponse.address.ammId,
  };
}

async function example() {
  const wallet = getWallet();
  const walletTokenAccounts = await getWalletTokenAccounts(wallet.publicKey);

  const { txids, ammId } = await createAMMPool({
    baseToken: getTokenBySymbol("WSOL"),
    quoteToken: getTokenBySymbol("USDC"),

    addBaseAmount: 10000,
    addQuoteAmount: 10000,

    targetMarketId: new PublicKey( // amm market id
      "5BdkM5qwP6ynQnnX4WJmYyhxVyn1GECD36WrXUXoQBQ2"
    ),

    startTime: Math.floor(Date.now() / 1000), // start now
    walletTokenAccounts: walletTokenAccounts,
    wallet: wallet,
  });
}
