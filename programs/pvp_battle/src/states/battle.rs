use anchor_lang::prelude::*;

pub const BATTLE_SEED: &str = "pvp_battle";

#[account]
#[derive(InitSpace)]
pub struct Battle {
    pub created_at: u64, // block_timestamp
    pub user_bet1: UserBet,
    pub user_bet2: UserBet,
    pub status: BattleStatus,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Default, InitSpace, PartialEq)]
pub enum BattleStatus {
    #[default]
    Draft,
    PendingMatch,
    PendingReveal,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Default, InitSpace)]
pub struct UserBet {
    pub user: Pubkey,
    pub answer_hash: [u8; 32],
    pub token_amount: u64,
    pub mint: Pubkey,
}
