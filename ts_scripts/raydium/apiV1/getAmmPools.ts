import {
  ApiPoolInfo,
  ApiPoolInfoV4,
  LIQUIDITY_STATE_LAYOUT_V4,
  Liquidity,
  MARKET_STATE_LAYOUT_V3,
  Market,
  MAINNET_PROGRAM_ID,
  DEVNET_PROGRAM_ID,
} from "@raydium-io/raydium-sdk";
import { AddressLookupTableAccount, PublicKey } from "@solana/web3.js";
import { getConnection, getEnvironment } from "cryptoUtils";

/*
 * Return all accounts that represents amm pool with market information.
 */
export async function getAMMPools(
  programId: string,
  findLookupTableAddress: boolean = false
): Promise<ApiPoolInfoV4[]> {
  const connection = getConnection();
  const filterDefKey = PublicKey.default.toString();

  const allAmmAccounts = await connection.getProgramAccounts(
    new PublicKey(programId),
    { filters: [{ dataSize: LIQUIDITY_STATE_LAYOUT_V4.span }] }
  );

  const ammAccountsData = allAmmAccounts
    .map((i) => ({
      id: i.pubkey,
      programId: i.account.owner,
      ...LIQUIDITY_STATE_LAYOUT_V4.decode(i.account.data),
    }))
    .filter((i) => i.marketProgramId.toString() !== filterDefKey);

  const allMarketProgramIds = new Set<string>(
    ammAccountsData.map((i) => i.marketProgramId.toString())
  );

  const marketInfo: {
    [marketId: string]: {
      marketProgramId: string;
      marketAuthority: string;
      marketBaseVault: string;
      marketQuoteVault: string;
      marketBids: string;
      marketAsks: string;
      marketEventQueue: string;
    };
  } = {};

  console.log("AMM accounts number fetched:", ammAccountsData.length);
  for (const itemMarketProgram of allMarketProgramIds) {
    const allMarketsInfo = await connection.getProgramAccounts(
      new PublicKey(itemMarketProgram),
      { filters: [{ dataSize: MARKET_STATE_LAYOUT_V3.span }] }
    );
    for (const itemAccount of allMarketsInfo) {
      const itemMarketInfo = MARKET_STATE_LAYOUT_V3.decode(
        itemAccount.account.data
      );
      marketInfo[itemAccount.pubkey.toString()] = {
        marketProgramId: itemAccount.account.owner.toString(),
        marketAuthority: Market.getAssociatedAuthority({
          programId: itemAccount.account.owner,
          marketId: itemAccount.pubkey,
        }).publicKey.toString(),
        marketBaseVault: itemMarketInfo.baseVault.toString(),
        marketQuoteVault: itemMarketInfo.quoteVault.toString(),
        marketBids: itemMarketInfo.bids.toString(),
        marketAsks: itemMarketInfo.asks.toString(),
        marketEventQueue: itemMarketInfo.eventQueue.toString(),
      };
    }
  }

  const ammFormatData = (
    ammAccountsData
      .map((itemAmm) => {
        const itemMarket = marketInfo[itemAmm.marketId.toString()];
        if (itemMarket === undefined) return undefined;

        const format: ApiPoolInfoV4 = {
          id: itemAmm.id.toString(),
          baseMint: itemAmm.baseMint.toString(),
          quoteMint: itemAmm.quoteMint.toString(),
          lpMint: itemAmm.lpMint.toString(),
          baseDecimals: itemAmm.baseDecimal.toNumber(),
          quoteDecimals: itemAmm.quoteDecimal.toNumber(),
          lpDecimals: itemAmm.baseDecimal.toNumber(),
          version: 4,
          programId: itemAmm.programId.toString(),
          authority: Liquidity.getAssociatedAuthority({
            programId: itemAmm.programId,
          }).publicKey.toString(),
          openOrders: itemAmm.openOrders.toString(),
          targetOrders: itemAmm.targetOrders.toString(),
          baseVault: itemAmm.baseVault.toString(),
          quoteVault: itemAmm.quoteVault.toString(),
          withdrawQueue: itemAmm.withdrawQueue.toString(),
          lpVault: itemAmm.lpVault.toString(),
          marketVersion: 3,
          marketId: itemAmm.marketId.toString(),
          ...itemMarket,
          lookupTableAccount: filterDefKey,
        };
        return format;
      })
      .filter((i) => i !== undefined) as ApiPoolInfoV4[]
  ).reduce((a, b) => {
    a[b.id] = b;
    return a;
  }, {} as { [id: string]: ApiPoolInfoV4 });

  if (findLookupTableAddress) {
    const ltas = await connection.getProgramAccounts(
      new PublicKey("AddressLookupTab1e1111111111111111111111111"),
      {
        filters: [
          {
            memcmp: {
              offset: 22,
              bytes: "RayZuc5vEK174xfgNFdD9YADqbbwbFjVjY4NM8itSF9",
            },
          },
        ],
      }
    );
    for (const itemLTA of ltas) {
      const keyStr = itemLTA.pubkey.toString();
      const ltaForamt = new AddressLookupTableAccount({
        key: itemLTA.pubkey,
        state: AddressLookupTableAccount.deserialize(itemLTA.account.data),
      });
      for (const itemKey of ltaForamt.state.addresses) {
        const itemKeyStr = itemKey.toString();
        if (ammFormatData[itemKeyStr] === undefined) continue;
        ammFormatData[itemKeyStr].lookupTableAccount = keyStr;
      }
    }
  }

  return Object.values(ammFormatData);
}

export async function getAMMPoolsToApi(
  findLookupTableAddress: boolean = false
): Promise<ApiPoolInfo> {
  const programId =
    getEnvironment() == "devnet"
      ? DEVNET_PROGRAM_ID.AmmV4
      : MAINNET_PROGRAM_ID.AmmV4;

  return {
    official: [],
    unOfficial: await getAMMPools(programId.toString(), findLookupTableAddress),
  };
}
