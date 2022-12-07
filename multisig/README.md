# Deliverables
SpaceCoinICO: https://rinkeby.etherscan.io/address/0x53f8d687A20Ce7186487538A0b69f758dd84eE6a
Pool: https://rinkeby.etherscan.io/address/0xfDF3219ef26856390A2538F953344BDF8B749952


My LP project is structured such that the ICO contract deploys the Space Coin Token contract and the Pool contract deploys the SpaceRouter contract. As such, it made sense to only call `transferOwnership` on only the ICO and Pool contracts.

- Contract Interaction: https://gnosis-safe.io/app/rin:0xf137e82F63b3033fe9643E666e66f98D2D9CA16D/transactions/multisig_0xf137e82F63b3033fe9643E666e66f98D2D9CA16D_0xd9d7378a29504aca23fe5cbf6abc6ac90fc4345ab12960cbbf70b813d9271ed4

- Gnosis Wallet: https://gnosis-safe.io/app/rin:0xf137e82F63b3033fe9643E666e66f98D2D9CA16D


# Design Exercise
In general, the 1 of N would be the least secure as a potential hacker would fewer points of failure to overcome. It would also increase the risk of failure/vulnerability due to a single user/device as it poses a single owner dependency.

The tradeoff here is that more waller signers would reduce the potential for a single point of failure vulnerability, BUT, incase of loss of wallet ownership, recovery of the multisig wallet becomes more difficult as you would have to import recovery seed phrases for each signer, which could be problematic/tedious.



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
