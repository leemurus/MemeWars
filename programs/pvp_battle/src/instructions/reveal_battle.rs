use crate::error::PvpErrorCode;
use crate::states::*;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct RevealBattle<'info> {
    #[account(
        mut,
        seeds=[PRG_STATE_SEED.as_bytes()],
        bump = pda_prg_state.bump,
        constraint = pda_prg_state.is_paused @ PvpErrorCode::ProgramPaused,
    )]
    pub pda_prg_state: Account<'info, PrgState>,
}

pub fn reveal_battle(
    _ctx: Context<RevealBattle>,
    _user_answer1: [u8; 10],
    _user_sig1: [u8; 32],
    _user_answer2: [u8; 10],
    _user_sig2: [u8; 32],
) -> Result<Pubkey> {
    Ok(Pubkey::default())
}
