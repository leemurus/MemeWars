use crate::states::*;
use crate::error::*;
use anchor_lang::prelude::*;

pub fn update_asset(ctx: Context<UpdateAsset>, params: AssetParams) -> Result<()> {
    let pda_asset_info = &mut ctx.accounts.pda_asset_info;
    pda_asset_info.token = params.token;
    pda_asset_info.pair = params.token;
    pda_asset_info.enabled = params.enabled;
    pda_asset_info.tag = params.tag;
    pda_asset_info.bump = ctx.bumps.pda_asset_info;
    Ok(())
}

#[derive(Accounts)]
pub struct UpdateAsset<'info> {
    #[account(
        init_if_needed,
        payer=signer,
        space=8 + AssetInfo::INIT_SPACE,
        seeds=[
            ASSET_INFO_SEED.as_bytes(), 
            &mint.key().as_ref()
        ],
        bump,
    )]
    pub pda_asset_info: Account<'info, AssetInfo>,

    #[account(
        mut,
        address = crate::admin::id() @ GSErrorCode::NonAdminSigner,
    )]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,

    /// CHECK: safety
    pub mint: AccountInfo<'info>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Default, InitSpace)]
pub struct AssetParams {
    token: Pubkey,
    enabled: bool,
    tag: Tag,
}
