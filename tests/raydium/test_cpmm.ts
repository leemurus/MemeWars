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

import { createCPMMPool } from "raydium/apiV2/createCpmmPool";
import { swapOnlyCpmmById } from "raydium/apiV2/swapOnlyCpmmById";

describe("test-raydium", () => {
  anchor.setProvider(anchor.AnchorProvider.env());

  it("Create CPMM pool", async () => {
    let baseMint: PublicKey, quoteMint: PublicKey;

    if (getEnvironment() == "devnet") {
      baseMint = new PublicKey("C9AVgMGR6qFxBif5ve14AUpfgBJS2hVHwwVsiQ2nfYYU");
      quoteMint = new PublicKey("9ikZAuSuoZo1tW5nFh68fRMy8dzgxW3X8yi1TUEpuFuA");
    } else {
      let { mint } = await createMintAccountAndMint(getWallet(), 10);
      baseMint = mint;

      ({ mint } = await createMintAccountAndMint(getWallet(), 10));
      quoteMint = mint;
    }

    const baseToken = await getTokenByAddress(baseMint);
    const quoteToken = await getTokenByAddress(quoteMint);

    // const { poolId } = await createCPMMPool(baseMint, quoteMint);
    const poolId = new PublicKey(
      "Ay6XxSKj2MHCUjVtzzPkjjtXzCXBWBWAgYH3whgj7koW"
    );
    console.log("Created poolId:", poolId.toString());

    // It doesn't work
    await swapOnlyCpmmById(poolId, 7 * 10 ** baseToken.decimals);
  });
});
