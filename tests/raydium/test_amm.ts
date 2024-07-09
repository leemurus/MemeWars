import * as anchor from "@coral-xyz/anchor";

import { getTokenByAddress, getTokenBySymbol } from "raydium/token";
import {
  getEnvironment,
  getWallet,
  createMintAccountAndMint,
  mintToAccount,
  print,
} from "cryptoUtils";
import { PublicKey } from "@solana/web3.js";
import { getWalletTokenAccounts } from "raydium/utils";
import { TokenAmount, TradeV2 } from "@raydium-io/raydium-sdk";

import { createOpenBookAMM } from "raydium/apiV1/createOpenbookAmmMarket";
import { getAMMPoolsToApi } from "raydium/apiV1/getAmmPools";
import { createAMMPool } from "raydium/apiV1/createAmmPool";
import { getAMMPoolByAMMId } from "raydium/apiV1/getAmmPoolById";
import { swapOnlyAmmByPoolId } from "raydium/apiV1/swapOnlyAmmById";

describe("test-raydium", () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const wallet = getWallet();

  it("Create AMM pool with openbook market", async () => {
    let baseMint: PublicKey, quoteMint: PublicKey;

    if (getEnvironment() == "devnet") {
      baseMint = new PublicKey("C9AVgMGR6qFxBif5ve14AUpfgBJS2hVHwwVsiQ2nfYYU");
      quoteMint = new PublicKey("9ikZAuSuoZo1tW5nFh68fRMy8dzgxW3X8yi1TUEpuFuA");
    } else {
      let { mint } = await createMintAccountAndMint(getWallet(), 100);
      baseMint = mint;

      ({ mint } = await createMintAccountAndMint(getWallet(), 100));
      quoteMint = mint;
    }

    const baseToken = await getTokenByAddress(baseMint);
    const quoteToken = await getTokenByAddress(quoteMint);

    const tokenAccounts = await getWalletTokenAccounts(wallet.publicKey);

    // const marketId = new PublicKey(
    //   "3aLasL6PiRgYt4EzCpv8yE7znu55qPRc4T4QtiMZx9n6"
    // );
    const { marketId } = await createOpenBookAMM({
      baseToken: baseToken,
      quoteToken: quoteToken,
      wallet: getWallet(),
    });

    console.log("Created marketId: ", marketId.toString());

    // const ammId = new PublicKey("AgTXUGauMshUpBtveCKgbdKPk8NTd1gPdEGdtAT52aq");
    const { ammId } = await createAMMPool({
      baseToken: baseToken,
      quoteToken: quoteToken,

      addBaseAmount: 20,
      addQuoteAmount: 20,

      targetMarketId: marketId,

      startTime: Math.floor(Date.now() / 1000), // start now
      walletTokenAccounts: tokenAccounts,
      wallet: getWallet(),
    });
    console.log("Created ammId: ", ammId.toString());

    console.log("Fetched pool info: ", await getAMMPoolByAMMId(ammId));

    await swapOnlyAmmByPoolId({
      targetPool: ammId,
      inputTokenAmount: new TokenAmount(
        baseToken,
        5 * 10 ** baseToken.decimals
      ),
      outputToken: quoteToken,
      slippage: 3,
      walletTokenAccounts: tokenAccounts,
      wallet: getWallet(),
    });
  });
});
