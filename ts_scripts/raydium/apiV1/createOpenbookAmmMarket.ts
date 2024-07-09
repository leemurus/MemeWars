import { Keypair, PublicKey } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";

import {
  MAINNET_PROGRAM_ID,
  DEVNET_PROGRAM_ID,
  Token,
  TxVersion,
  MarketV2,
} from "@raydium-io/raydium-sdk";
import { getEnvironment, getWallet, print } from "cryptoUtils";
import { buildAndSendTx } from "raydium/utils";
import { getTokenBySymbol } from "raydium/token";

type MarketTxInputInfo = {
  baseToken: Token;
  quoteToken: Token;
  wallet: Keypair;
};

/*
 * Why it is so expensive: https://www.binance.com/en/square/post/6451902202665
 */
export async function createOpenBookAMM(
  input: MarketTxInputInfo
): Promise<{ txids: string[]; marketId: PublicKey }> {
  const env: string = getEnvironment();

  const createMarketInstruments =
    await MarketV2.makeCreateMarketInstructionSimple({
      connection: anchor.getProvider().connection,
      wallet: input.wallet.publicKey,
      baseInfo: input.baseToken,
      quoteInfo: input.quoteToken,
      lotSize: 1, // default 1
      tickSize: 0.01, // default 0.01
      dexProgramId:
        env == "devnet"
          ? DEVNET_PROGRAM_ID.OPENBOOK_MARKET
          : MAINNET_PROGRAM_ID.OPENBOOK_MARKET,
      makeTxVersion: TxVersion.V0,
    });

  console.log("Market info:", createMarketInstruments.address);
  const marketId = createMarketInstruments.address.marketId;

  return {
    txids: await buildAndSendTx(
      input.wallet,
      createMarketInstruments.innerTransactions,
      { skipPreflight: true } // necessary
    ),
    marketId: marketId,
  };
}

export async function example() {
  const { txids, marketId } = await createOpenBookAMM({
    baseToken: getTokenBySymbol("WSOL"),
    quoteToken: getTokenBySymbol("USDC"),
    wallet: getWallet(),
  });
}
