import * as anchor from "@coral-xyz/anchor";
import * as spl_token from "@solana/spl-token";
import * as web3 from "@solana/web3.js";
import * as toml from "toml";
import { readFileSync } from "fs";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { sha256 } from "js-sha256";

function parseAnchorToml(): any {
  try {
    const data = toml.parse(readFileSync("Anchor.toml").toString());
    return data;
  } catch (error) {
    console.error("Error parsing Anchor.toml:", error);
    return null;
  }
}

export function print(value: any) {
  console.log(JSON.stringify(value, null, 4));
}

export function getEnvironment(): "mainnet" | "devnet" | "localnet" {
  return parseAnchorToml().provider.cluster.toLowerCase();
}

export function getWallet(): web3.Keypair {
  return NodeWallet.local().payer;
}

export function getPublicKey(): web3.PublicKey {
  return anchor.getProvider().publicKey;
}

export function getConnection(): web3.Connection {
  return anchor.getProvider().connection;
}

export async function getRecentBlockhash(): Promise<string> {
  return (await getConnection().getLatestBlockhash("finalized")).blockhash;
}

/*
The same result:
  hash256(new Uint8Array([211, 212])); 
  hash256([211, 212]); 
*/
export function hash256(
  data: string | number[] | ArrayBuffer | Uint8Array
): number[] {
  return sha256.array(data);
}

export async function airdropToAccount(account: web3.PublicKey) {
  const connection = getConnection();
  const airdropSignature = await connection.requestAirdrop(
    account,
    5 * web3.LAMPORTS_PER_SOL // 5 is max
  );
  await connection.confirmTransaction(airdropSignature, "confirmed");
}

export async function getWalletWithBalance(): Promise<web3.Keypair> {
  const wallet = web3.Keypair.generate();
  await airdropToAccount(wallet.publicKey);
  return wallet;
}

export async function sendTxnFromNonDefaultWallet(
  txn: web3.Transaction,
  wallet: web3.Keypair
): Promise<web3.SignatureResult> {
  const connection = getConnection();
  txn.feePayer = wallet.publicKey;

  const txID = await connection.sendTransaction(txn, [wallet], {
    skipPreflight: true,
  });
  return (await connection.confirmTransaction(txID)).value;
}

export async function getWalletTokenAccounts(
  wallet?: web3.PublicKey
): Promise<{}> {
  wallet = wallet ? wallet : getPublicKey();

  const walletTokenAccount =
    await getConnection().getParsedTokenAccountsByOwner(wallet, {
      programId: spl_token.TOKEN_PROGRAM_ID, // filter by program
    });
  return walletTokenAccount.value.map((i) => ({
    pubkey: i.pubkey,
    account: i.account,
  }));
}

export async function createMintAccount(
  payer: web3.Keypair
): Promise<web3.PublicKey> {
  const mintAccountPublicKey = await spl_token.createMint(
    getConnection(),
    payer,
    payer.publicKey,
    null,
    9 // We are using 9 to match the CLI decimal default exactly
  );

  return mintAccountPublicKey;
}

export async function mintToAccount(
  payer: web3.Keypair,
  mint: web3.PublicKey,
  mintValue: number,
  toAccount?: web3.PublicKey
): Promise<web3.PublicKey> {
  toAccount = toAccount ? toAccount : payer.publicKey;
  const connection = getConnection();

  const tokenAccount = await spl_token.getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    mint,
    toAccount
  );

  let tokenInfo = await spl_token.getMint(connection, mint);

  await spl_token.mintTo(
    connection,
    payer,
    mint,
    tokenAccount.address,
    payer.publicKey,
    mintValue * 10 ** tokenInfo.decimals
  );

  return tokenAccount.address;
}

export async function createMintAccountAndMint(
  payer: web3.Keypair,
  mintValue: number,
  toAccount?: web3.PublicKey
): Promise<{ mint: web3.PublicKey; tokenAccount: web3.PublicKey }> {
  const mint: web3.PublicKey = await spl_token.createMint(
    getConnection(),
    payer,
    payer.publicKey,
    null,
    9 // We are using 9 to match the CLI decimal default exactly
  );

  toAccount = toAccount ? toAccount : payer.publicKey;
  const connection = getConnection();

  const tokenAccount = await spl_token.getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    mint,
    toAccount
  );

  let tokenInfo = await spl_token.getMint(connection, mint);

  await spl_token.mintTo(
    connection,
    payer,
    mint,
    tokenAccount.address,
    payer.publicKey,
    mintValue * 10 ** tokenInfo.decimals
  );

  return { mint: mint, tokenAccount: tokenAccount.address };
}

export function getNthPDA(
  seeds: (Buffer | Uint8Array)[],
  programId: web3.PublicKey,
  nth: number
): [web3.PublicKey, number] {
  if (nth < 0) {
    throw new Error("Nth can't be negative");
  }

  for (let bump = 255; bump >= 0; bump--) {
    try {
      const pda = web3.PublicKey.createProgramAddressSync(
        seeds.concat([Buffer.from([bump])]),
        programId
      );
      if (nth == 0) {
        return [pda, bump];
      }
      nth -= 1;
    } catch (error) {}
  }

  throw new Error(`No such PDA for nth=${nth}. Try to reduce variable`);
}

export function getAssociatedTokenAddress(
  mint: web3.PublicKey,
  owner: web3.PublicKey
): web3.PublicKey {
  return spl_token.getAssociatedTokenAddressSync(mint, owner);
}

export async function getTokenAccountBalance(
  tokenAccount: web3.PublicKey
): Promise<web3.TokenAmount> {
  const balance = await anchor
    .getProvider()
    .connection.getTokenAccountBalance(tokenAccount);
  return balance.value;
}

export function getBytesFromNumber(x: number): Buffer {
  const bytes = Buffer.alloc(8);
  bytes.writeBigInt64LE(BigInt(x));
  return bytes;
}
