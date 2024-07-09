import * as anchor from "@coral-xyz/anchor";
import { web3, Program, BN } from "@coral-xyz/anchor";
import { GlobalSettings } from "../target/types/global_settings";
import { assert } from "chai";
import { getWalletWithBalance, sendTxnFromNonDefaultWallet } from "cryptoUtils";

describe("Test global settings", () => {
  anchor.setProvider(anchor.AnchorProvider.env());

  const gsProgram = anchor.workspace.GlobalSettings as Program<GlobalSettings>;

  const SYSTEM_PROGRAM = web3.SystemProgram.programId;
  const GS_PRG_STATE_SEED = Buffer.from("global_settings_prg_state");
  const ASSET_INFO_SEED = Buffer.from("asset_info");

  const [gsPrgState] = web3.PublicKey.findProgramAddressSync(
    [GS_PRG_STATE_SEED],
    gsProgram.programId
  );

  it("Initialize from not admin", async () => {
    const anotherWallet = await getWalletWithBalance();
    const txn = await gsProgram.methods
      .initialize()
      .accounts({
        signer: anotherWallet.publicKey,
      })
      .transaction();

    const sigResult = await sendTxnFromNonDefaultWallet(txn, anotherWallet);

    assert.equal(sigResult.err["InstructionError"][1]["Custom"], 6000);
  });

  it("Initialize", async () => {
    // about 0.00118124 SOL
    const tx = await gsProgram.methods.initialize().accounts({}).rpc();

    const pdaGSPrgStateAccInfo = await gsProgram.account.prgState.fetch(
      gsPrgState
    );

    assert.equal(
      pdaGSPrgStateAccInfo.feeRecipient.toString(),
      SYSTEM_PROGRAM.toString()
    );
  });

  it("Add WSOL token", async () => {
    const WSOL = new anchor.web3.PublicKey(
      "So11111111111111111111111111111111111111112"
    );

    const [pdaAssetInfo, bump] = anchor.web3.PublicKey.findProgramAddressSync(
      [ASSET_INFO_SEED, WSOL.toBuffer()],
      gsProgram.programId
    );

    // about 0.00141788 SOL
    const tx = await gsProgram.methods
      .updateAsset({ token: WSOL, enabled: true, tag: { default: {} } })
      .accounts({
        mint: WSOL,
      })
      .rpc();

    const pdaAssetInfoAccInfo = await gsProgram.account.assetInfo.fetch(
      pdaAssetInfo
    );

    assert.deepEqual(pdaAssetInfoAccInfo.token, WSOL);
    assert.deepEqual(pdaAssetInfoAccInfo.pair, WSOL);
    assert.equal(pdaAssetInfoAccInfo.enabled, true);
    assert.equal(pdaAssetInfoAccInfo.bump, bump);
    assert.deepEqual(pdaAssetInfoAccInfo.tag, { default: {} });
  });

  it("Update after creating WSOL token", async () => {
    const WSOL = new anchor.web3.PublicKey(
      "So11111111111111111111111111111111111111112"
    );

    const [pdaAssetInfo, bump] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("asset_info"), WSOL.toBuffer()],
      gsProgram.programId
    );

    let pdaAssetInfoAccInfo = await gsProgram.account.assetInfo.fetch(
      pdaAssetInfo
    );

    assert.deepEqual(pdaAssetInfoAccInfo.token, WSOL);
    assert.deepEqual(pdaAssetInfoAccInfo.pair, WSOL);
    assert.equal(pdaAssetInfoAccInfo.enabled, true);
    assert.equal(pdaAssetInfoAccInfo.bump, bump);
    assert.deepEqual(pdaAssetInfoAccInfo.tag, { default: {} });

    // about 0.00141788 SOL
    const tx = await gsProgram.methods
      .updateAsset({ token: WSOL, enabled: false, tag: { default: {} } })
      .accounts({
        mint: WSOL,
      })
      .rpc();

    pdaAssetInfoAccInfo = await gsProgram.account.assetInfo.fetch(pdaAssetInfo);

    assert.deepEqual(pdaAssetInfoAccInfo.token, WSOL);
    assert.deepEqual(pdaAssetInfoAccInfo.pair, WSOL);
    assert.equal(pdaAssetInfoAccInfo.enabled, false);
    assert.equal(pdaAssetInfoAccInfo.bump, bump);
    assert.deepEqual(pdaAssetInfoAccInfo.tag, { default: {} });
  });

  it("Add USDT token", async () => {
    const USDT = new anchor.web3.PublicKey(
      "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB"
    );

    const [pdaAssetInfo, bump] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("asset_info"), USDT.toBuffer()],
      gsProgram.programId
    );

    // about 0.00141788 SOL
    const tx = await gsProgram.methods
      .updateAsset({ token: USDT, enabled: false, tag: { default: {} } })
      .accounts({
        mint: USDT,
      })
      .rpc();

    const pdaAssetInfoAccInfo = await gsProgram.account.assetInfo.fetch(
      pdaAssetInfo
    );

    assert.deepEqual(pdaAssetInfoAccInfo.token, USDT);
    assert.deepEqual(pdaAssetInfoAccInfo.pair, USDT);
    assert.equal(pdaAssetInfoAccInfo.enabled, false);
    assert.equal(pdaAssetInfoAccInfo.bump, bump);
    assert.deepEqual(pdaAssetInfoAccInfo.tag, { default: {} });
  });
});
