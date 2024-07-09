pub mod error;
pub mod instructions;
pub mod states;

use anchor_lang::prelude::*;
use instructions::*;

declare_id!("GSoG5Tz9LVWzLrEvLgo9q4JqJYWk2Prx9VjzrAeTzYFk");

pub mod admin {
    use anchor_lang::prelude::declare_id;
    #[cfg(any(feature = "devnet", feature = "localnet"))]
    declare_id!("2qW9QJ1Do2VXw4B9FzcgpFWQUdRKQKk3DGJLdxKfsCdE");
    #[cfg(not(feature = "devnet"))]
    declare_id!("2qW9QJ1Do2VXw4B9FzcgpFWQUdRKQKk3DGJLdxKfsCdE");
}

#[program]
pub mod global_settings {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        instructions::initialize(ctx)
    }

    pub fn update_asset(ctx: Context<UpdateAsset>, params: AssetParams) -> Result<()> {
        instructions::update_asset(ctx, params)
    }
}
