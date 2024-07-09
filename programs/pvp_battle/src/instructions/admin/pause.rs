use crate::error::PvpErrorCode;
use crate::states::*;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct Pause<'info> {
    #[account(
        mut,
        seeds=[PRG_STATE_SEED.as_bytes()],
        bump = pda_prg_state.bump,
    )]
    pub pda_prg_state: Account<'info, PrgState>,

    #[account(
        address = crate::admin::id() @ PvpErrorCode::NonAdminSigner,
    )]
    pub signer: Signer<'info>,
}

pub fn pause(ctx: Context<Pause>) -> Result<()> {
    ctx.accounts.pda_prg_state.is_paused = true;
    Ok(())
}
