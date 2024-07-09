use anchor_lang::prelude::*;

pub const PRG_STATE_SEED: &str = "global_settings_prg_state";

#[account]
#[derive(InitSpace)]
pub struct PrgState {
    pub fee_recipient: Pubkey,
    pub bump: u8,
}
