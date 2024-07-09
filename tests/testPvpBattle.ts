import * as anchor from "@coral-xyz/anchor";
import { web3, Program } from "@coral-xyz/anchor";
import { PvpBattle } from "../target/types/pvp_battle";
import { GlobalSettings } from "../target/types/global_settings";
import * as spl_token from "@solana/spl-token";
import {
  getWalletWithBalance,
  sendTxnFromNonDefaultWallet,
  getNthPDA,
  hash256,
  print,
  getAssociatedTokenAddress,
  createMintAccountAndMint,
  getWallet,
  getBytesFromNumber,
  getTokenAccountBalance,
} from "cryptoUtils";
import { assert } from "chai";
import { sha256 } from "js-sha256";

describe("Test PVP battles", () => {
  anchor.setProvider(anchor.AnchorProvider.env());

  const pvpProgram = anchor.workspace.PvpBattle as Program<PvpBattle>;
  const gsProgram = anchor.workspace.GlobalSettings as Program<GlobalSettings>;

  const PVP_PRG_STATE_SEED = Buffer.from("pvp_prg_state");
  const PVP_BATTLE_SEED = Buffer.from("pvp_battle");

  const [pvpPrgState] = web3.PublicKey.findProgramAddressSync(
    [PVP_PRG_STATE_SEED],
    pvpProgram.programId
  );

  it("Test INITIALIZE not from admin", async () => {
    const anotherWallet = await getWalletWithBalance();

    const txn = await pvpProgram.methods
      .initialize(gsProgram.programId)
      .accounts({ signer: anotherWallet.publicKey }) // change default wallet
      .transaction();

    const sigResult = await sendTxnFromNonDefaultWallet(txn, anotherWallet);
    assert.equal(sigResult.err["InstructionError"][1]["Custom"], 6000);
  });

  it("Test INITIALIZE with non-canonical PDA address", async () => {
    const [nonCanonicalPdaAccount] = getNthPDA(
      [PVP_PRG_STATE_SEED],
      pvpProgram.programId,
      1
    );

    try {
      const tx = await pvpProgram.methods
        .initialize(gsProgram.programId)
        .accounts({
          pdaPrgState: nonCanonicalPdaAccount,
        })
        .rpc({ skipPreflight: true });
    } catch (err) {
      assert.equal(err["code"], 2006); // A seeds constraint was violated
      return;
    }

    throw new Error("Transaction above should fail");
  });

  it("Test INITIALIZE from admin", async () => {
    const tx = await pvpProgram.methods.initialize(gsProgram.programId).rpc();

    const prgStateAccInfo = await pvpProgram.account.prgState.fetch(
      pvpPrgState
    );

    assert.equal(prgStateAccInfo.battleNumber.toNumber(), 0);
    assert.equal(prgStateAccInfo.fee, 100);
    assert.equal(prgStateAccInfo.feeDecimals, 3);
    assert.equal(prgStateAccInfo.isPaused, false);
    assert.deepEqual(prgStateAccInfo.globalSettings, gsProgram.programId);
  });

  it("Test PAUSE from not admin user", async () => {
    const anotherWallet = await getWalletWithBalance();

    const txn = await pvpProgram.methods
      .pause()
      .accounts({ signer: anotherWallet.publicKey }) // change default wallet
      .transaction();

    const sigResult = await sendTxnFromNonDefaultWallet(txn, anotherWallet);
    assert.equal(sigResult.err["InstructionError"][1]["Custom"], 6000);
  });

  it("Test PAUSE from admin user", async () => {
    const tx = await pvpProgram.methods.pause().rpc();

    const prgStateAccInfo = await pvpProgram.account.prgState.fetch(
      pvpPrgState
    );

    assert.equal(prgStateAccInfo.isPaused, true);
  });

  it("Test UNPAUSE from not admin user", async () => {
    const anotherWallet = await getWalletWithBalance();

    const txn = await pvpProgram.methods
      .unpause()
      .accounts({ signer: anotherWallet.publicKey }) // change default wallet
      .transaction();

    const sigResult = await sendTxnFromNonDefaultWallet(txn, anotherWallet);
    assert.equal(sigResult.err["InstructionError"][1]["Custom"], 6000);
  });

  it("Test UNPAUSE from admin user", async () => {
    let prgStateAccInfo = await pvpProgram.account.prgState.fetch(pvpPrgState);
    assert.equal(prgStateAccInfo.isPaused, true);

    const tx = await pvpProgram.methods.unpause().rpc();

    prgStateAccInfo = await pvpProgram.account.prgState.fetch(pvpPrgState);

    assert.equal(prgStateAccInfo.isPaused, false);
  });

  it("Test JOIN_BATTLE", async () => {
    const answer = [2, 1, 0, 3, 4, 5, 8, 7, 6];
    const move = 5;
    const secretKey = "328492349813641964";

    const answer_hash: number[] = sha256.array(
      answer.concat(move).concat(sha256.array(secretKey))
    );

    const [pvpBattle] = web3.PublicKey.findProgramAddressSync(
      [PVP_BATTLE_SEED, getBytesFromNumber(0)],
      pvpProgram.programId
    );

    const tokenAmount = 20 * 10 ** 9;
    const mintTokenAmount = 100 * 10 ** 9;
    const { mint, tokenAccount } = await createMintAccountAndMint(
      getWallet(),
      mintTokenAmount / 10 ** 9
    );
    const prgTokenAccount = getAssociatedTokenAddress(
      mint,
      pvpProgram.programId
    );

    const tx = await pvpProgram.methods
      .joinBattle(answer_hash, new anchor.BN(tokenAmount))
      .accounts({
        mint: mint,
        fromAta: tokenAccount,
        programAta: prgTokenAccount,
        tokenProgram: spl_token.TOKEN_PROGRAM_ID,
      })
      .rpc();

    const prgStateAccInfo = await pvpProgram.account.prgState.fetch(
      pvpPrgState
    );
    const battleAccInfo = await pvpProgram.account.battle.fetch(pvpBattle);
    const fromBalance = await getTokenAccountBalance(tokenAccount);
    const prgBalance = await getTokenAccountBalance(prgTokenAccount);

    assert.equal(prgStateAccInfo.battleNumber.toNumber(), 0);
    assert.equal(
      fromBalance.amount,
      (mintTokenAmount - tokenAmount).toString()
    );
    assert.equal(prgBalance.amount, tokenAmount.toString());

    assert.deepEqual(battleAccInfo.status, { pendingMatch: {} });
    assert.isTrue(battleAccInfo.createdAt.toNumber() > 0);

    assert.deepEqual(battleAccInfo.userBet1.user, getWallet().publicKey);
    assert.deepEqual(battleAccInfo.userBet1.mint, mint);
    assert.equal(battleAccInfo.userBet1.tokenAmount.toNumber(), tokenAmount);
    assert.deepEqual(battleAccInfo.userBet1.answerHash, answer_hash);

    assert.deepEqual(battleAccInfo.userBet2.user, web3.PublicKey.default);
    assert.deepEqual(battleAccInfo.userBet2.mint, web3.PublicKey.default);
    assert.equal(battleAccInfo.userBet2.tokenAmount.toNumber(), 0);
    assert.deepEqual(battleAccInfo.userBet2.answerHash, new Array(32).fill(0));
  });
});
