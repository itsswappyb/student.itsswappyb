# Design Exercise

Q. How would you extend your LP contract to award additional rewards – say, a separate ERC-20 token – to further incentivize liquidity providers to deposit into your pool?

A. I would create another ERC-20 token, similar to Uniswap's UNI token (say, STAR token). A portion of this supply could be distributed to Liquidity Providers in addition to the LP token rewards they receive.

These tokens, would be useless on their own (since they don't have liquidity!). So we can create another pool that facilates swaps between STAR tokens and another ERC-20, preferably a stable coin like DAI. This increases the incentives for more LPs to provide liquidity, which creates network effects.

Putting more fuel to the fire, if we added a staking contract that calculates a profitable yield for depositing your tokens, the incentives become much larger.

# Details

SpaceCoinICO deployed to: 0xEEdcAF56634099740BaF37df2e4AA247B2753f31
Pool deployed to: 0xd5F5E3d3509714f5B35108E769195e7132f696fE
SpaceCoinToken deployed to: 0x3c6dF3DffC0094cfb25d0a47c43Bc8685A957014
SpaceRouter deployed to: 0x629E2270DA219Ab7D2EAda0AE406667c5Cfbf3ab

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
