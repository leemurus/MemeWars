import { Raydium, parseTokenAccountResp } from "@raydium-io/raydium-sdk-v2";
import { getWallet, getEnvironment, getConnection } from "cryptoUtils";
import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";

export async function initSdk(params?: { loadToken?: boolean }) {
  const raydium = await Raydium.load({
    owner: getWallet(),
    connection: getConnection(),
    cluster: getEnvironment() == "devnet" ? "devnet" : "mainnet",
    disableFeatureCheck: true,
    disableLoadToken: !params?.loadToken,
  });

  /**
   * By default: sdk will automatically fetch token account data when need it
   * or any sol balace changed. if you want to handle token account by yourself,
   * set token account data after init sdk code below shows how to do it.
   * note: after call raydium.account.updateTokenAccount, raydium will not
   *  automatically fetch token account
   */

  // disable daemon
  raydium.account.updateTokenAccount(await fetchTokenAccountData());
  return raydium;
}

export const fetchTokenAccountData = async () => {
  const owner = getWallet();
  const connection = getConnection();

  const solAccountResp = await connection.getAccountInfo(owner.publicKey);
  const tokenAccountResp = await connection.getTokenAccountsByOwner(
    owner.publicKey,
    { programId: TOKEN_PROGRAM_ID }
  );
  const token2022Req = await connection.getTokenAccountsByOwner(
    owner.publicKey,
    { programId: TOKEN_2022_PROGRAM_ID }
  );
  const tokenAccountData = parseTokenAccountResp({
    owner: owner.publicKey,
    solAccountResp,
    tokenAccountResp: {
      context: tokenAccountResp.context,
      value: [...tokenAccountResp.value, ...token2022Req.value],
    },
  });
  return tokenAccountData;
};
