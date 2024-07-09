use anchor_lang::prelude::*;

#[error_code]
pub enum GSErrorCode {
    #[msg("Signer doesn't have admin rights")]
    NonAdminSigner,
}
