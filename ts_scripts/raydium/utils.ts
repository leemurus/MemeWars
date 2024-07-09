import {
  Keypair,
  Connection,
  SendOptions,
  Signer,
  Transaction,
  VersionedTransaction,
  PublicKey,
} from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";

import {
  TxVersion,
  InnerSimpleV0Transaction,
  buildSimpleTransaction,
  TokenAccount,
  SPL_ACCOUNT_LAYOUT,
  TOKEN_PROGRAM_ID,
} from "@raydium-io/raydium-sdk";
import { getConnection, print } from "../cryptoUtils";

export async function sendTx(
  connection: Connection,
  payer: Keypair | Signer,
  txs: (VersionedTransaction | Transaction)[],
  options?: SendOptions
): Promise<string[]> {
  const txids: string[] = [];
  for (const iTx of txs) {
    if (iTx instanceof VersionedTransaction) {
      iTx.sign([payer]);
      txids.push(await connection.sendTransaction(iTx, options));
    } else {
      txids.push(await connection.sendTransaction(iTx, [payer], options));
    }
  }

  for (const txId of txids) {
    console.log("Wait tx:", txId);
    const result = await connection.confirmTransaction(txId);
    console.log(`Result for tx ${txId}:`);
    print(result);
  }

  return txids;
}

export async function buildAndSendTx(
  wallet: Keypair,
  innerSimpleV0Transaction: InnerSimpleV0Transaction[],
  options?: SendOptions
): Promise<string[]> {
  const connection: Connection = anchor.getProvider().connection;

  const willSendTx = await buildSimpleTransaction({
    connection: connection,
    makeTxVersion: TxVersion.V0,
    payer: wallet.publicKey,
    innerTransactions: innerSimpleV0Transaction,
    addLookupTableInfo: undefined,
  });

  return await sendTx(connection, wallet, willSendTx, options);
}

export async function getWalletTokenAccounts(
  wallet: PublicKey
): Promise<TokenAccount[]> {
  const walletTokenAccount = await getConnection().getTokenAccountsByOwner(
    wallet,
    {
      programId: TOKEN_PROGRAM_ID,
    }
  );
  return walletTokenAccount.value.map((i) => ({
    pubkey: i.pubkey,
    programId: i.account.owner,
    accountInfo: SPL_ACCOUNT_LAYOUT.decode(i.account.data),
  }));
}
