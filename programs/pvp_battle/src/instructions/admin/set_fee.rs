use crate::error::PvpErrorCode;
use crate::states::*;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct SetFee<'info> {
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

pub fn set_fee(ctx: Context<SetFee>, fee: u32, fee_decimals: u32) -> Result<()> {
    ctx.accounts.pda_prg_state.fee = fee;
    ctx.accounts.pda_prg_state.fee_decimals = fee_decimals;
    Ok(())
}
