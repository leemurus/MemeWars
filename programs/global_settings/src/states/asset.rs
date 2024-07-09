use anchor_lang::prelude::*;

pub const ASSET_INFO_SEED: &str = "asset_info";

#[account]
#[derive(InitSpace)]
pub struct AssetInfo {
    pub token: Pubkey,
    pub pair: Pubkey,
    pub enabled: bool,
    pub tag: Tag,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Default, InitSpace)]
pub enum Tag {
    #[default]
    Default,
}
