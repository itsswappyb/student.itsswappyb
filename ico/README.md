# Space Coin Token Specs
- OpenZeppelin has a contract library for ERC-20 [docs](https://docs.openzeppelin.com/contracts/4.x/). Use this library when creating your token.
- 500,000 max total supply
- A 2% tax on every transfer that gets put into a treasury account
  - A flag that toggles this tax on/off, controllable by owner, initialized to false


# Spacecoin ICO Specs
- The smart contract aims to raise 30,000 Ether by performing an ICO
- The ICO contains 3 phases: Phase Seed, Phase General, and Phase Open
  - **Phase Seed**
    - only avaiable to whitelisted private investors
    - maximum total private contritbution limit = 15,000 ether
    - individual contribution = 1,500 ether
  - **Phase General**
    - maximum total private contritbution limit = 30,000 ether (inclusive of private phase, i.e., Phase Seed).
    - individual contribution limit = 1,000 ether
  - **Phase Open**
    - individual contribution limit = 0
    - should immediately release ERC20-compatible (Spacecoin) tokens for all contributors at an exchange rate of 5 tokens to 1 Ether.
  - **Owner**
    - Owner of the contract can pause/resume contract at will.
    - Move a phase forwards (but not backwards) at will
  
# Design Exercise
- I would set a lock in period that would essentially serve as the deadline from the date (block.timestamp) since Phase Open.
- The Vesting period would have stages/phase, much like the ICO. After each stage, I would calculate a percentage of the tokens that can be withdrawn and set this as the "allowed" withdrawal amount.
- This will continue until all the stages are complete.
# Advanced Sample Hardhat Project

This project demonstrates an advanced Hardhat use case, integrating other tools commonly used alongside Hardhat in the ecosystem.

The project comes with a sample contract, a test for that contract, a sample script that deploys that contract, and an example of a task implementation, which simply lists the available accounts. It also comes with a variety of other tools, preconfigured to work with the project code.

Try running some of the following tasks:

```shell
npx hardhat accounts
npx hardhat compile
npx hardhat clean
npx hardhat test
npx hardhat node
npx hardhat help
REPORT_GAS=true npx hardhat test
npx hardhat coverage
npx hardhat run scripts/deploy.ts
TS_NODE_FILES=true npx ts-node scripts/deploy.ts
npx eslint '**/*.{js,ts}'
npx eslint '**/*.{js,ts}' --fix
npx prettier '**/*.{json,sol,md}' --check
npx prettier '**/*.{json,sol,md}' --write
npx solhint 'contracts/**/*.sol'
npx solhint 'contracts/**/*.sol' --fix
```

# Etherscan verification

To try out Etherscan verification, you first need to deploy a contract to an Ethereum network that's supported by Etherscan, such as Ropsten.

In this project, copy the .env.example file to a file named .env, and then edit it to fill in the details. Enter your Etherscan API key, your Ropsten node URL (eg from Alchemy), and the private key of the account which will send the deployment transaction. With a valid .env file in place, first deploy your contract:

```shell
hardhat run --network ropsten scripts/deploy.ts
```

Then, copy the deployment address and paste it in to replace `DEPLOYED_CONTRACT_ADDRESS` in this command:

```shell
npx hardhat verify --network ropsten DEPLOYED_CONTRACT_ADDRESS "Hello, Hardhat!"
```

# Performance optimizations

For faster runs of your tests and scripts, consider skipping ts-node's type checking by setting the environment variable `TS_NODE_TRANSPILE_ONLY` to `1` in hardhat's environment. For more details see [the documentation](https://hardhat.org/guides/typescript.html#performance-optimizations).
