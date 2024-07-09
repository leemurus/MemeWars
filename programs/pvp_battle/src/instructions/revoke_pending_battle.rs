use crate::error::PvpErrorCode;
use crate::states::*;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct RevokePendingBattle<'info> {
    #[account(
        mut,
        seeds=[PRG_STATE_SEED.as_bytes()],
        bump = pda_prg_state.bump,
        constraint = pda_prg_state.is_paused @ PvpErrorCode::ProgramPaused,
    )]
    pub pda_prg_state: Account<'info, PrgState>,
}

pub fn revoke_pending_battle(_ctx: Context<RevokePendingBattle>) -> Result<()> {
    Ok(())
}
