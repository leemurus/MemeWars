use crate::error::PvpErrorCode;
use crate::states::*;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct ForceRevokeBattle<'info> {
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

pub fn force_revoke_battle(ctx: Context<ForceRevokeBattle>, battle_id: Pubkey) -> Result<()> {
    msg!("Revoked battle with id {} {}", battle_id, ctx.program_id);
    Ok(())
}
