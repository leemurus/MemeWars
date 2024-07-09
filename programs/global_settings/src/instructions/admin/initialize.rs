use crate::error::GSErrorCode;
use crate::states::*;
use anchor_lang::prelude::*;

pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
    let pda_prg_state = &mut ctx.accounts.pda_prg_state;

    pda_prg_state.fee_recipient = Pubkey::default();
    pda_prg_state.bump = ctx.bumps.pda_prg_state;
    Ok(())
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer=signer,
        space=8 + PrgState::INIT_SPACE,
        seeds=[PRG_STATE_SEED.as_bytes()],
        bump,
    )]
    pub pda_prg_state: Account<'info, PrgState>,

    #[account(
        mut,
        address = crate::admin::id() @ GSErrorCode::NonAdminSigner,
    )]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
}
