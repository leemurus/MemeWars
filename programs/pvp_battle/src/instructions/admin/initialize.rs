use crate::error::PvpErrorCode;
use crate::states::*;
use anchor_lang::prelude::*;

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
        address = crate::admin::id() @ PvpErrorCode::NonAdminSigner,
    )]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn initialize(ctx: Context<Initialize>, global_settings: Pubkey) -> Result<()> {
    let pda_prg_state = &mut ctx.accounts.pda_prg_state;

    pda_prg_state.battle_number = 0;

    pda_prg_state.fee = 100;
    pda_prg_state.fee_decimals = 3;
    pda_prg_state.global_settings = global_settings;
    pda_prg_state.is_paused = false;

    pda_prg_state.bump = ctx.bumps.pda_prg_state;
    Ok(())
}
