use anchor_lang::prelude::*;

pub const PRG_STATE_SEED: &str = "pvp_prg_state";

#[account]
#[derive(InitSpace)]
pub struct PrgState {
    // User
    pub battle_number: u64,

    // Admin
    pub fee: u32,
    pub fee_decimals: u32,
    pub global_settings: Pubkey,
    pub is_paused: bool,

    // Technical
    pub bump: u8,
}
