use anchor_lang::prelude::*;

#[error_code]
pub enum PvpErrorCode {
    #[msg("Signer doesn't have admin rights")]
    NonAdminSigner,
    #[msg("Program paused for executions")]
    ProgramPaused,
    #[msg("Incorrect battle state for execution")]
    IncorrectBattleState,
}
