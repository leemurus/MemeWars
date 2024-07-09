use crate::error::*;
use crate::program::PvpBattle;
use crate::states::*;
use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{self, Mint, TokenAccount, Transfer as SplTransfer};
use anchor_spl::token_interface::TokenInterface;

#[derive(Accounts)]
pub struct JoinBattle<'info> {
    #[account(
        mut,
        seeds=[PRG_STATE_SEED.as_bytes()],
        bump = pda_prg_state.bump,
        constraint = !pda_prg_state.is_paused @ PvpErrorCode::ProgramPaused,
    )]
    pub pda_prg_state: Account<'info, PrgState>,

    #[account(
        init_if_needed,
        payer=signer,
        space=8 + Battle::INIT_SPACE,
        seeds=[
            BATTLE_SEED.as_bytes(),
            &pda_prg_state.battle_number.to_le_bytes(),
        ],
        bump,
    )]
    pub battle: Account<'info, Battle>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = signer,
        associated_token::token_program = token_program,
    )]
    pub from_ata: Account<'info, TokenAccount>,
    #[account(
        init_if_needed,
        payer=signer,
        associated_token::mint = mint,
        associated_token::authority = pvp_program,
        associated_token::token_program = token_program,
    )]
    pub program_ata: Account<'info, TokenAccount>,
    pub mint: Account<'info, Mint>,
    pub token_program: Interface<'info, TokenInterface>,

    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,

    /// Program to create an ATA
    pub associated_token_program: Program<'info, AssociatedToken>,

    pub pvp_program: Program<'info, PvpBattle>,
}

pub fn join_battle(
    ctx: Context<JoinBattle>,
    answer_hash: [u8; 32],
    token_amount: u64,
) -> Result<Pubkey> {
    let battle = &mut ctx.accounts.battle;
    let user_bet = UserBet {
        user: ctx.accounts.signer.key(),
        answer_hash: answer_hash,
        token_amount: token_amount,
        mint: ctx.accounts.from_ata.mint,
    };

    msg!("BATTLE {}", battle.key());

    if battle.status == BattleStatus::Draft {
        battle.user_bet1 = user_bet;
        battle.status = BattleStatus::PendingMatch;
        battle.created_at = Clock::get()?.unix_timestamp as u64;
    } else if battle.status == BattleStatus::PendingMatch {
        battle.user_bet2 = user_bet;
        ctx.accounts.pda_prg_state.battle_number += 1;
        battle.status = BattleStatus::PendingReveal;
    } else {
        return err!(PvpErrorCode::IncorrectBattleState);
    }

    let cpi_accounts = SplTransfer {
        from: ctx.accounts.from_ata.to_account_info(),
        to: ctx.accounts.program_ata.to_account_info(),
        authority: ctx.accounts.signer.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let token_transfer_res =
        token::transfer(CpiContext::new(cpi_program, cpi_accounts), token_amount);

    if token_transfer_res.is_ok() {
        return Ok(ctx.accounts.battle.key());
    } else {
        return Err(token_transfer_res.unwrap_err());
    }
}
