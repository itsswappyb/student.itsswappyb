/* eslint-disable no-unused-expressions */
/* eslint-disable prettier/prettier */
import chai, { expect } from "chai";
import { ethers, network, waffle } from "hardhat";
import { BigNumber, BigNumberish, providers } from "ethers";
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import { SpaceCoinICO__factory } from "../typechain/factories/SpaceCoinICO__factory";
import { SpaceCoinICO, SpaceCoinToken } from "../typechain";

import { ONE_ETHER, getRandomInt } from "./helpers";
import seedRandom from "seedrandom";

import { solidity } from "ethereum-waffle";
chai.use(solidity);

describe("Space Coin ICO", () => {
  let deployer: SignerWithAddress;
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;
  let charlie: SignerWithAddress;
  let dan: SignerWithAddress;
  let evan: SignerWithAddress;
  let fiona: SignerWithAddress;
  let gary: SignerWithAddress;
  let harry: SignerWithAddress;
  let ian: SignerWithAddress;
  let joe: SignerWithAddress;

  let signers: SignerWithAddress[];

  let SpaceCoinICOFactory: SpaceCoinICO__factory;
  let spaceCoinICO: SpaceCoinICO;
  let spacecoinToken: SpaceCoinToken;

  beforeEach(async () => {
    [deployer, alice, bob, charlie, dan, evan, fiona, gary, harry, ian, joe] = await ethers.getSigners();

    signers = await ethers.getSigners();

    SpaceCoinICOFactory = await ethers.getContractFactory("SpaceCoinICO");
    spaceCoinICO = await SpaceCoinICOFactory.deploy(joe.address);

    spacecoinToken = await ethers.getContractAt("SpaceCoinToken", await spaceCoinICO.spacecoinToken());

    await spaceCoinICO.deployed();
  });

  it("should deploy", async () => {
    // eslint-disable-next-line no-unused-expressions
    expect(spaceCoinICO.address).to.be.ok;
  });

  describe("Initial state variables", () => {
    it("Admin is the deployer", async () => {
      expect(await spaceCoinICO.admin()).to.equal(deployer.address);
    });

    it("should set the icoPhase as Phase Seed", async () => {
      expect(await spaceCoinICO.icoPhase()).to.equal(0);
    });
    it("should have the correct goalAmount", async () => {
      expect(await spaceCoinICO.goalAmount()).to.equal(ONE_ETHER.mul(30_000));
    });

    it("should set the totalAmountRaised to 0", async () => {
      expect(await spaceCoinICO.totalAmountRaised()).to.equal(0);
    });

    it("should set the totalContributionLimit to 15,000 ether", async () => {
      expect(await spaceCoinICO.totalContributionLimit()).to.equal(ONE_ETHER.mul(15_000));
    });

    it("should set the individualContributionLimit to 1,500 ether", async () => {
      expect(await spaceCoinICO.individualContributionLimit()).to.equal(ONE_ETHER.mul(1_500));
    });
    it("should set the tokenPrice to 5", async () => {
      expect(await spaceCoinICO.tokenPrice()).to.equal(5);
    });

    it("should set the isPaused to false", async () => {
      expect(await spaceCoinICO.isPaused()).to.be.false;
    });
  });

  describe("Phase Seed", () => {
    it("should have the correct icoPhase", async () => {
      expect(await spaceCoinICO.icoPhase()).to.equal(0);
    });

    it("should not allow non-whitelisted users to invest", async () => {
      expect(await spaceCoinICO.isWhitelisted(deployer.address)).to.be.false;
      await expect(spaceCoinICO.invest({ value: ONE_ETHER })).to.be.revertedWith("Only whitelisted addresses can invest in the seed phase");
    });

    it("should not allow whitelisted users to invest more that individualContributionLimit", async () => {
      await spaceCoinICO.addToWhitelist([deployer.address]);

      expect(await spaceCoinICO.isWhitelisted(deployer.address)).to.be.true;
      await expect(spaceCoinICO.invest({ value: ONE_ETHER.mul(1600) })).to.be.revertedWith("Limit reached!");
    });

    it("should not allow whitelisted users to invest if beyond totalContributionLimit", async () => {
      await spaceCoinICO.addToWhitelist([
        alice.address,
        bob.address,
        deployer.address,
        charlie.address,
        dan.address,
        evan.address,
        fiona.address,
        gary.address,
        harry.address,
        ian.address,
        joe.address,
      ]);

      await spaceCoinICO.invest({ value: ONE_ETHER.mul(1_500) });
      await spaceCoinICO.connect(alice).invest({ value: ONE_ETHER.mul(1_500) });
      await spaceCoinICO.connect(bob).invest({ value: ONE_ETHER.mul(1_500) });
      await spaceCoinICO.connect(charlie).invest({ value: ONE_ETHER.mul(1_500) });
      await spaceCoinICO.connect(dan).invest({ value: ONE_ETHER.mul(1_500) });
      await spaceCoinICO.connect(evan).invest({ value: ONE_ETHER.mul(1_500) });
      await spaceCoinICO.connect(fiona).invest({ value: ONE_ETHER.mul(1_500) });
      await spaceCoinICO.connect(gary).invest({ value: ONE_ETHER.mul(1_500) });
      await spaceCoinICO.connect(harry).invest({ value: ONE_ETHER.mul(1_500) });
      await spaceCoinICO.connect(ian).invest({ value: ONE_ETHER.mul(1_500) });

      // const signers = getRandomSigners(10);
      // for (const signer of signers) {
      //   await spaceCoinICO.connect(signer).invest({ value: ONE_ETHER.mul(1500) });
      // }

      await expect(spaceCoinICO.connect(joe).invest({ value: ONE_ETHER })).to.be.revertedWith("Limit reached!");
    });

    it("should correctly allow whitelisted users to invest", async () => {
      await spaceCoinICO.addToWhitelist([deployer.address]);

      expect(await spaceCoinICO.isWhitelisted(deployer.address)).to.be.true;

      const tx = await spaceCoinICO.invest({ value: ONE_ETHER });
      await tx.wait();

      expect(await spaceCoinICO.totalAmountRaised()).to.equal(ONE_ETHER);
      expect(await spaceCoinICO.contributions(deployer.address)).to.equal(ONE_ETHER);
      expect(tx).to.emit(spaceCoinICO, "Invest").withArgs(deployer.address, ONE_ETHER);
    });
  });

  describe("Phase General", () => {
    beforeEach(async () => {
      await spaceCoinICO.movePhase(0);
    });

    it("should have the correct icoPhase", async () => {
      expect(await spaceCoinICO.icoPhase()).to.equal(1);
    });

    it("should have a totalContributionLimit of 30,000 ether", async () => {
      expect(await spaceCoinICO.totalContributionLimit()).to.equal(ONE_ETHER.mul(30_000));
    });

    it("should have a individualContributionLimit of 1,000 ether", async () => {
      expect(await spaceCoinICO.individualContributionLimit()).to.equal(ONE_ETHER.mul(1_000));
    });

    it("should not allow individual contributions above the individualContributionLimit", async () => {
      await expect(spaceCoinICO.invest({ value: ONE_ETHER.mul(1600) })).to.be.revertedWith("Limit reached!");
    });

    it("should allow individual contributions upto the individualContributionLimit", async () => {
      const txDeployer = await spaceCoinICO.invest({ value: ONE_ETHER.mul(1_000) });
      const txAlice = await spaceCoinICO.connect(alice).invest({ value: ONE_ETHER.mul(10) });
      expect(txDeployer).to.emit(spaceCoinICO, "Invest").withArgs(deployer.address, ONE_ETHER.mul(1_000));
      expect(txAlice).to.emit(spaceCoinICO, "Invest").withArgs(alice.address, ONE_ETHER.mul(10));
    });

    it("should not allow investors to invest if above totalContributionLimit", async () => {
      for (let i = 0; i < 30; i++) {
        const signer = signers[i];
        await spaceCoinICO.connect(signer).invest({ value: ONE_ETHER.mul(1000) });
      }

      // await expect(spaceCoinICO.connect(alice).invest({ value: ONE_ETHER })).not.to.be.reverted;
      await expect(spaceCoinICO.connect(signers[30]).invest({ value: ONE_ETHER })).to.be.revertedWith("Limit reached!");
    });

    it("should allow investors to invest if below totalContributionLimit", async () => {
      for (let i = 0; i < 29; i++) {
        const signer = signers[i];
        await spaceCoinICO.connect(signer).invest({ value: ONE_ETHER.mul(1000) });
      }

      await expect(spaceCoinICO.connect(signers[29]).invest({ value: ONE_ETHER })).not.to.be.reverted;
    });
  });

  describe("Phase Open", () => {
    beforeEach(async () => {
      await spaceCoinICO.movePhase(0);
      await spaceCoinICO.movePhase(1);
    });

    it("should have the correct icoPhase", async () => {
      expect(await spaceCoinICO.icoPhase()).to.equal(2);
    });

    it("should have a totalContributionLimit of 30,000 ether", async () => {
      expect(await spaceCoinICO.totalContributionLimit()).to.equal(ONE_ETHER.mul(30_000));
    });
  });

  describe("Claim Tokens", () => {
    it("should revert claimSpaceTokens if not in Phase Open", async () => {
      await expect(spaceCoinICO.claimSpaceTokens()).to.be.revertedWith("ICO is not open");
    });

    it("should revert if there are not contributions from address", async () => {
      await spaceCoinICO.movePhase(0);
      await spaceCoinICO.movePhase(1);

      await expect(spaceCoinICO.claimSpaceTokens()).to.be.revertedWith("You have no contributions");
    });

    it("should calculate token rewards corectly", async () => {
      await spaceCoinICO.movePhase(0);

      const contributionAmount = ONE_ETHER.mul(5);
      await spaceCoinICO.connect(alice).invest({ value: contributionAmount });

      await spaceCoinICO.movePhase(1);

      const claimTx = await spaceCoinICO.connect(alice).claimSpaceTokens();
      await claimTx.wait();

      const tokenPrice = await spaceCoinICO.tokenPrice();
      const expectedTokenReward = contributionAmount.mul(tokenPrice);

      const aliceTokenBalance = await spacecoinToken.balanceOf(alice.address);

      expect(aliceTokenBalance).to.equal(expectedTokenReward);
    });
  });
});
