/* eslint-disable prettier/prettier */
import chai, { expect } from "chai";
import { ethers, network, waffle } from "hardhat";
import { BigNumber, BigNumberish, providers } from "ethers";
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import { SpaceCoinToken__factory } from "../typechain/factories/SpaceCoinToken__factory";
import { SpaceCoinToken } from "../typechain";
import { solidity } from "ethereum-waffle";

import { TOKEN_MULTIPLIER, TOKEN_SUPPLY, getTokens } from "./helpers";

chai.use(solidity);

// -----------------------------------------------------------------------------

describe("SpaceCoinToken", () => {
  let deployer: SignerWithAddress;
  let treasury: SignerWithAddress;
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;

  let SpaceCoinToken: SpaceCoinToken__factory;
  let spaceCoinToken: SpaceCoinToken;

  beforeEach(async () => {
    [deployer, treasury, alice, bob] = await ethers.getSigners();

    SpaceCoinToken = await ethers.getContractFactory("SpaceCoinToken");
    spaceCoinToken = await SpaceCoinToken.deploy(500_000, treasury.address);

    await spaceCoinToken.deployed();
  });

  it("should deploy", async () => {
    // eslint-disable-next-line no-unused-expressions
    expect(spaceCoinToken.address).to.be.ok;
  });

  it("shoule have the correct name", async () => {
    expect(await spaceCoinToken.name()).to.equal("Space Coin Token");
  });

  it("should have the correct symbol", async () => {
    expect(await spaceCoinToken.symbol()).to.equal("SPC");
  });

  it("should have the correct decimals", async () => {
    expect(await spaceCoinToken.decimals()).to.equal(18);
  });

  it("should have the correct total supply", async () => {
    const tokenSupply = await spaceCoinToken.totalSupply();
    expect(tokenSupply).to.equal(TOKEN_SUPPLY);
  });

  it("should set no tax by default", async () => {
    expect(await spaceCoinToken.isTaxed()).to.equal(false);
  });

  it("should have the correct balance of deployer", async () => {
    expect(await spaceCoinToken.balanceOf(deployer.address)).to.equal(TOKEN_SUPPLY);
  });

  it("should have the correct balance of alice", async () => {
    expect(await spaceCoinToken.balanceOf(alice.address)).to.equal(0);
  });

  it("should have the correct balance of bob", async () => {
    expect(await spaceCoinToken.balanceOf(bob.address)).to.equal(0);
  });

  describe("Transfer function", () => {
    it("should transfer the correct amount when tax is off", async () => {
      const TRANSFER_AMOUNT = 100;

      const deployerBeforeBalance = await spaceCoinToken.balanceOf(deployer.address);

      await spaceCoinToken.connect(deployer).transfer(alice.address, TRANSFER_AMOUNT);
      const deployerAfterBalance = await spaceCoinToken.balanceOf(deployer.address);

      const aliceBalance = await spaceCoinToken.balanceOf(alice.address);

      const netDeployerBalance = deployerBeforeBalance.sub(deployerAfterBalance);

      expect(deployerBeforeBalance).to.equal(TOKEN_SUPPLY);
      expect(deployerAfterBalance).to.equal(TOKEN_SUPPLY.sub(TRANSFER_AMOUNT));
      expect(netDeployerBalance).to.equal(TRANSFER_AMOUNT);
      expect(aliceBalance).to.equal(TRANSFER_AMOUNT);
    });
  });

  describe("Taxation on transfer", () => {
    it("should toggle taxation correctly", async () => {
      const initialTaxState = await spaceCoinToken.isTaxed();
      await spaceCoinToken.toggleTax();
      const finalTaxState = await spaceCoinToken.isTaxed();

      expect(initialTaxState).to.equal(false);
      expect(finalTaxState).to.equal(true);
    });
    it("should only allow deployer/owner to toggle tax", async () => {
      const initialTaxState = await spaceCoinToken.isTaxed();
      await expect(spaceCoinToken.connect(alice).toggleTax()).to.be.revertedWith("Only the owner can do this");

      await spaceCoinToken.toggleTax();
      const secondTaxState = await spaceCoinToken.isTaxed();

      await spaceCoinToken.toggleTax();
      const finalTaxState = await spaceCoinToken.isTaxed();

      expect(initialTaxState).to.equal(false);
      expect(secondTaxState).to.equal(true);
      expect(finalTaxState).to.equal(false);
    });
    it("should transfer the correct tax amount to treasury", async () => {
      const TRANSFER_AMOUNT = 100;
      const expectedTaxAmount = (TRANSFER_AMOUNT * 2) / 100;

      const treasury = await spaceCoinToken.treasury();

      await spaceCoinToken.toggleTax();

      const deployerBeforeBalance = await spaceCoinToken.balanceOf(deployer.address);

      await spaceCoinToken.connect(deployer).transfer(alice.address, TRANSFER_AMOUNT);

      const deployerAfterBalance = await spaceCoinToken.balanceOf(deployer.address);

      const aliceBalance = await spaceCoinToken.balanceOf(alice.address);

      const treasuryBalance = await spaceCoinToken.balanceOf(treasury);

      expect(deployerAfterBalance).to.equal(deployerBeforeBalance.sub(TRANSFER_AMOUNT));
      expect(treasuryBalance).to.equal(expectedTaxAmount);
      expect(aliceBalance).to.equal(TRANSFER_AMOUNT - expectedTaxAmount);
    });
  });
});
