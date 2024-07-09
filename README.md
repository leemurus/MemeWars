# MemeWars

Draft game project in the Solana blockchain between meme tokens

# Structure

- `programs` - the main logic of the project in the form of smart contracts in the Rust (Anchor) programming language in the Solana blockchain
- `tests` - testing project logic and raidium
- `ts_scripts` - a self-written set of tools for more convenient writing of tests and functions for working with the Radium

# Commands

- `anchor build` - build project
- `anchor test` - test project (build + deploy + test)
- `anchor clean` - remove all artifacts from the target directory except program keypairs
