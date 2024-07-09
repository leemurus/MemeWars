import { Currency, Token, TOKEN_PROGRAM_ID } from "@raydium-io/raydium-sdk";
import { PublicKey } from "@solana/web3.js";
import * as spl_token from "@solana/spl-token";
import { getConnection, getEnvironment } from "../cryptoUtils";

export const DEVNET_TOKENS = {
  SOL: new Currency(9, "SOL", "SOL"),
  WSOL: new Token(
    TOKEN_PROGRAM_ID,
    new PublicKey("So11111111111111111111111111111111111111112"),
    9,
    "WSOL",
    "WSOL"
  ),
  USDC: new Token(
    TOKEN_PROGRAM_ID,
    new PublicKey("Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr"),
    6,
    "USDC-DEV",
    "USDC-DEV"
  ),
};

export const MAINNET_TOKENS = {
  SOL: new Currency(9, "SOL", "SOL"),
  WSOL: new Token(
    TOKEN_PROGRAM_ID,
    new PublicKey("So11111111111111111111111111111111111111112"),
    9,
    "WSOL",
    "WSOL"
  ),
  USDC: new Token(
    TOKEN_PROGRAM_ID,
    new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"),
    6,
    "USDC",
    "USDC"
  ),

  USDT: new Token(
    TOKEN_PROGRAM_ID,
    new PublicKey("Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB"),
    6,
    "USDT",
    "USDT"
  ),
  RAY: new Token(
    TOKEN_PROGRAM_ID,
    new PublicKey("4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R"),
    6,
    "RAY",
    "RAY"
  ),
  "RAY_USDC-LP": new Token(
    TOKEN_PROGRAM_ID,
    new PublicKey("FGYXP4vBkMEtKhxrmEBcWN8VNmXX8qNgEJpENKDETZ4Y"),
    6,
    "RAY-USDC",
    "RAY-USDC"
  ),
};

export function getTokenBySymbol(symbol: string): Token {
  if (getEnvironment() == "devnet") {
    return DEVNET_TOKENS[symbol];
  } else {
    return MAINNET_TOKENS[symbol];
  }
}

export async function getTokenByAddress(address: PublicKey): Promise<Token> {
  const mintInfo = await spl_token.getMint(getConnection(), address);

  return new Token(
    TOKEN_PROGRAM_ID,
    address,
    mintInfo.decimals,
    `TOKEN-${address.toString()}`,
    `TOKEN-${address.toString()}`
  );
}
