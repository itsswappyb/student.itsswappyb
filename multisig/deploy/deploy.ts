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

  // transfer ownership to Gnosis address
  // const tranferOwnershipTx1 = await spaceCoinICO.transferOwnership(
  //   GNOSIS_SAFE_ADDRESS
  // );
  // await tranferOwnershipTx1.wait();
  // const transferOwnershipTx2 = await spacecoinToken.transferOwnership(
  //   GNOSIS_SAFE_ADDRESS
  // );
  // await transferOwnershipTx2.wait();
  // const tranferOwnershipTx3 = await pool.transferOwnership(GNOSIS_SAFE_ADDRESS);
  // await tranferOwnershipTx3.wait();
  // const transferOwnershipTx4 = await spaceRouter.transferOwnership(
  //   GNOSIS_SAFE_ADDRESS
  // );
  
  // await transferOwnershipTx4.wait();
  const GNOSIS_SAFE_ADDRESS = "0xf137e82F63b3033fe9643E666e66f98D2D9CA16D";

  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using node you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  const SpaceCoinICO = await ethers.getContractFactory("SpaceCoinICO");
  const spaceCoinICO = await SpaceCoinICO.deploy(testMetamaskAddress);
  await spaceCoinICO.deployed();

  const spacecoinTokenAddress = await spaceCoinICO.spacecoinToken();
  const spacecoinToken = await ethers.getContractAt(
    "SpaceCoinToken",
    await spaceCoinICO.spacecoinToken()
  );

  const Pool = await ethers.getContractFactory("Pool");
  const pool = await Pool.deploy(spacecoinTokenAddress);
  await pool.deployed();

  const spaceRouterAddress = await pool.spacecoinRouter();
  const spaceRouter = await ethers.getContractAt(
    "SpaceRouter",
    await pool.spacecoinRouter()
  );

  // Transfer ownership to Gnosis Safe
  const txReceipt1 = await spaceCoinICO.transferOwnership(GNOSIS_SAFE_ADDRESS);
  await txReceipt1.wait();
  console.log("transferred spaceCoinICO");

  const txReceipt3 = await pool.transferOwnership(GNOSIS_SAFE_ADDRESS);
  await txReceipt3.wait();
  console.log("transferred pool");

  console.log("SpaceCoinICO deployed to:", spaceCoinICO.address);
  console.log("Pool deployed to:", pool.address);
  console.log("SpaceCoinToken deployed to:", spacecoinToken.address);
  console.log("SpaceRouter deployed to:", spaceRouter.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
