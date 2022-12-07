// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat";
import { TestNftMarketplace } from "../typechain/TestNftMarketplace";

async function main() {
    // Hardhat always runs the compile task when running scripts with its command
    // line interface.
    //
    // If this script is run directly using `node` you may want to call compile
    // manually to make sure everything is compiled
    // await hre.run('compile');

    // We get the contract to deploy
    // We get the contract to deployy
    const Collector = await ethers.getContractFactory("Collector");
    const TestNftMarketplace = await ethers.getContractFactory(
        "TestNftMarketplace"
    );
    const collector = await Collector.deploy();
    const testNftMarketplace = await TestNftMarketplace.deploy();

    await collector.deployed();
    await testNftMarketplace.deployed();

    console.log("Collector deployed to:", collector.address);
    console.log("TestNftMarketplace deployed to:", testNftMarketplace.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
