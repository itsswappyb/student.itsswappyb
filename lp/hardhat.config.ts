import * as dotenv from "dotenv";

import { HardhatUserConfig, task } from "hardhat/config";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";

dotenv.config();

const GOERLI_ALCHEMY_API_URL = process.env.GOERLI_ALCHEMY_API_URL;
const GOERLI_PRIVATE_KEY = process.env.GOERLI_PRIVATE_KEY;
const RINKEBY_ALCHEMY_API_URL = process.env.RINKEBY_ALCHEMY_API_URL;
const RINKEBY_PRIVATE_KEY = process.env.RINKEBY_PRIVATE_KEY;

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

const config = {
  solidity: "0.8.4",
  networks: {
    goerli: {
      url: GOERLI_ALCHEMY_API_URL || "",
      accounts:
        process.env.GOERLI_PRIVATE_KEY !== undefined
          ? [process.env.GOERLI_PRIVATE_KEY]
          : [],
    },
    rinkeby: {
      url: RINKEBY_ALCHEMY_API_URL || "",
      accounts:
        process.env.RINKEBY_API_URL !== undefined
          ? [process.env.RINKEBY_API_URL]
          : [],
    },
    // ropsten: {
    //   url: process.env.ROPSTEN_URL || "",
    //   accounts:
    //     process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    // },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};

export default config;