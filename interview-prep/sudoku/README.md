# Vulnerabilities

**[H-1]** Re-entrancy vulnerability when creating rewards
On line 34, the tokens are transfered from the sender/caller to the exchange contract before the reward is stored.

**[H-2]** Re-entrancy vulnerability when claiming rewards
On line 67, the challenge is being marked as solved after the transfer call.

**[H-3]** Missing check in claim rewards
The `claimRewards` function sets the challenge as being solved, but there needs to be a check to see if the challenge has already been solved so that the user does not get undeserving rewards.

**[H-4]** Not transferring rewards correctly
On line 66 in SudokuExchange.sol, the `claimRewards` function incorrectly transfers the token rewards to the exchange contract address instead of `msg.sender`.

**[H-5]** Incorrect use of memory variable
On line 63 of SudokuExchange.sol, `challengeReward` should be a storage variable instead of a memory variable, otherwise the state variable won't get updated.

# Gas Optimizations

- In SudokuExchange.sol, the `challengeReward` struct doesn't need to store the ERC20 token. You could intialize that once via the constructor.
- On line 63 of SudokuExchange.sol, the `challengeReward` memory variable can be initialized before the require statement on line 52. This way, we can use that memory variable in the require block and save an additional read from the blockchain.
- Both functions `createReward` and `claimReward` can be marked as external instead of public. This is because public function parameters are copied to memory (costs more gas) whereas external function parameters are read from calldata directly.
- In SudokuChalenge.sol, uint8[41] could be used to store 2 sudoku square values in one uint8 since values only go from 0 through 9 and we only need 4 bits to represent 0 - 9.
# Code Quality Issues
- In SudokuExchange.sol, `rewardChallenges` can be marked as public so that bounty hunters are aware of available challenges with a bounty.
- In SudokuExchange.sol, `claimReward` should have a check to ensure that the person claiming the reward is not the person creating the reward.

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
