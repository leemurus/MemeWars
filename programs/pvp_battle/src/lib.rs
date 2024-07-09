pub mod error;
pub mod instructions;
pub mod states;

use anchor_lang::prelude::*;
use instructions::*;

declare_id!("PVPjBGSfMFEfQmdaWUemUjcTnLz4KcUaZjRiPsJ8JKh");

pub mod admin {
    use anchor_lang::prelude::declare_id;
    #[cfg(any(feature = "devnet", feature = "localnet"))]
    declare_id!("2qW9QJ1Do2VXw4B9FzcgpFWQUdRKQKk3DGJLdxKfsCdE");
    #[cfg(not(feature = "devnet"))]
    declare_id!("2qW9QJ1Do2VXw4B9FzcgpFWQUdRKQKk3DGJLdxKfsCdE");
}

#[program]
pub mod pvp_battle {
    use super::*;

    // ================================ ADMIN ==================================

    pub fn initialize(ctx: Context<Initialize>, global_settings: Pubkey) -> Result<()> {
        instructions::initialize(ctx, global_settings)
    }

    pub fn pause(ctx: Context<Pause>) -> Result<()> {
        instructions::pause(ctx)
    }

    pub fn unpause(ctx: Context<Unpause>) -> Result<()> {
        instructions::unpause(ctx)
    }

    pub fn set_fee(ctx: Context<SetFee>, fee: u32, fee_decimals: u32) -> Result<()> {
        instructions::set_fee(ctx, fee, fee_decimals)
    }

    // =============================== PUBLIC ==================================

    // Return PDA of joined battle
    pub fn join_battle(
        ctx: Context<JoinBattle>,
        answer_hash: [u8; 32],
        token_amount: u64,
    ) -> Result<Pubkey> {
        instructions::join_battle(ctx, answer_hash, token_amount)
    }

    // Return address of the winner
    pub fn reveal_battle(
        ctx: Context<RevealBattle>,
        user_answer1: [u8; 10],
        user_sig1: [u8; 32],
        user_answer2: [u8; 10],
        user_sig2: [u8; 32],
    ) -> Result<Pubkey> {
        instructions::reveal_battle(ctx, user_answer1, user_sig1, user_answer2, user_sig2)
    }

    pub fn revoke_pending_battle(ctx: Context<RevokePendingBattle>) -> Result<()> {
        instructions::revoke_pending_battle(ctx)
    }
}
