// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat";

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  const testMetamaskAddress = "0x76d19953cb0af9A514ADA27DBaAed5d5D1969803";
  // We get the contract to deploy
  const SpaceCoinICO = await ethers.getContractFactory("SpaceCoinICO");
  const spaceCoinICO = await SpaceCoinICO.deploy(testMetamaskAddress);
  await spaceCoinICO.deployed();

  const spacecoinToken = await spaceCoinICO.spacecoinToken();

  const Pool = await ethers.getContractFactory("Pool");
  const pool = await Pool.deploy(spacecoinToken);
  await pool.deployed();

  const spaceRouter = await pool.spacecoinRouter();

  console.log("SpaceCoinICO deployed to:", spaceCoinICO.address);
  console.log("Pool deployed to:", pool.address);
  console.log("SpaceCoinToken deployed to:", spacecoinToken);
  console.log("SpaceRouter deployed to:", spaceRouter);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
