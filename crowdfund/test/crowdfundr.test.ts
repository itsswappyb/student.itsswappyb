// ----------------------------------------------------------------------------
// REQUIRED: Instructions
// ----------------------------------------------------------------------------
/*
  For this first project, we've provided a significant amount of scaffolding
  in your test suite. We've done this to:

    1. Set expectations, by example, of where the bar for testing is.
    2. Encourage more students to embrace an Advanced Typescript Hardhat setup.
    3. Reduce the amount of time consumed this week by "getting started friction".

  Please note that:

    - We will not be so generous on future projects!
    - The tests provided are about ~90% complete.
    - IMPORTANT:
      - We've intentionally left out some tests that would reveal potential
        vulnerabilities you'll need to identify, solve for, AND TEST FOR!

      - Failing to address these vulnerabilities will leave your contracts
        exposed to hacks, and will certainly result in extra points being
        added to your micro-audit report! (Extra points are _bad_.)

  Your job (in this file):

    - DO NOT delete or change the test names for the tests provided
    - DO complete the testing logic inside each tests' callback function
    - DO add additional tests to test how you're securing your smart contracts
         against potential vulnerabilties you identify as you work through the
         project.

    - You will also find several places where "FILL_ME_IN" has been left for
      you. In those places, delete the "FILL_ME_IN" text, and replace with
      whatever is appropriate.
*/
// ----------------------------------------------------------------------------

import { expect } from "chai";
import { ethers, network, waffle } from "hardhat";
import { BigNumber, providers } from "ethers";
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import {
  Project,
  ProjectFactory,
  ProjectFactory__factory,
  Project__factory,
} from "../typechain";
import { create } from "domain";
import { MockProvider } from "ethereum-waffle";

// use(waffle.solidity);

// ----------------------------------------------------------------------------
// OPTIONAL: Constants and Helper Functions
// ----------------------------------------------------------------------------
// We've put these here for your convenience. Feel free to use them if they
// are helpful!
const SECONDS_IN_DAY: number = 60 * 60 * 24;
const ONE_ETHER: BigNumber = ethers.utils.parseEther("1");
const FIVE_ETHER: BigNumber = ethers.utils.parseEther("5");

// Bump the timestamp by a specific amount of seconds
const timeTravel = async (seconds: number) => {
  await network.provider.send("evm_increaseTime", [seconds]);
  await network.provider.send("evm_mine");
};

// Or, set the time to be a specific amount (in seconds past epoch time)
const setBlockTimeTo = async (seconds: number) => {
  await network.provider.send("evm_setNextBlockTimestamp", [seconds]);
  await network.provider.send("evm_mine");
};
// ----------------------------------------------------------------------------

describe("Crowdfundr", () => {
  let deployer: SignerWithAddress;
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;
  let creator: SignerWithAddress;

  let ProjectFactory: ProjectFactory__factory;
  let projectFactory: ProjectFactory;
  // let Project: Project__factory;

  beforeEach(async () => {
    [deployer, alice, bob, creator] = await ethers.getSigners();

    // NOTE: You may need to pass arguments to the `deploy` function if your
    //       ProjectFactory contract's constructor has input parameters
    ProjectFactory = await ethers.getContractFactory("ProjectFactory");
    projectFactory = (await ProjectFactory.deploy()) as ProjectFactory;
    // Project = await ethers.getContractFactory("Project");
    // project = await Project.deploy(5);

    await projectFactory.deployed();
  });

  describe("ProjectFactory: Additional Tests", () => {
    /* 
      TODO: You may add additional tests here if you need to

      NOTE: If you wind up writing Solidity code to protect against a
            vulnerability that is not tested for below, you should add
            at least one test here.

      DO NOT: Delete or change the test names for the tests provided below
    */
  });

  describe("ProjectFactory", () => {
    it("Deploys a contract", () => {
      // eslint-disable-next-line no-unused-expressions
      expect(projectFactory.address).to.be.ok;
    });

    it("Can register a single project", async () => {
      await projectFactory.create(FIVE_ETHER);
      const project = await ethers.getContractAt(
        "Project",
        projectFactory.address
      );

      // eslint-disable-next-line no-unused-expressions
      expect(project.address).to.be.ok;
      expect(project.address).to.equal(projectFactory.address);
    });

    it("Can register multiple projects", async () => {
      await projectFactory.create(FIVE_ETHER);
      await projectFactory.create(FIVE_ETHER);

      const projects = await projectFactory.getProjects();
      const project1 = await projects[0];
      const project2 = await projects[1];

      expect(projects.length).to.equal(2);
      expect(project1).to.not.equal(project2);
    });

    it("Registers projects with the correct owner", async () => {
      await projectFactory.connect(alice).create(FIVE_ETHER);

      const projects = await projectFactory.getProjects();
      const project = await ethers.getContractAt("Project", projects[0]);
      const creatorAddress = await project.creatorAddress();

      expect(alice.address).to.eq(creatorAddress);
    });

    it("Registers projects with a preset funding goal (in units of ether)", async () => {
      await projectFactory.connect(alice).create(FIVE_ETHER);
      const projects = await projectFactory.getProjects();
      const project = await ethers.getContractAt("Project", projects[0]);
      const projectGoal = await project.goalAmount();
      expect(projectGoal).to.equal(FIVE_ETHER);
    });

    it('Emits a "ProjectRegistered" event after registering a project', async () => {
      expect(await projectFactory.create(FIVE_ETHER)).to.emit(
        projectFactory,
        "ProjectRegistered"
      );
    });

    it("Allows multiple contracts to accept ETH simultaneously", async () => {
      await projectFactory.create(FIVE_ETHER);
      await projectFactory.create(FIVE_ETHER);

      const projects = await projectFactory.getProjects();
      const project1 = await projects[0];
      const project2 = await projects[1];

      const project1Instance = await ethers.getContractAt("Project", project1);
      const project2Instance = await ethers.getContractAt("Project", project2);

      await project1Instance.contribute({ value: ONE_ETHER });
      await project2Instance.contribute({ value: ONE_ETHER });

      const project1Balance = await project1Instance.raisedAmount();
      const project2Balance = await project2Instance.raisedAmount();

      expect(project1Balance).to.equal(ONE_ETHER);
      expect(project2Balance).to.equal(ONE_ETHER);
    });
  });

  describe("Project: Additional Tests", () => {
    /* 
      TODO: You may add additional tests here if you need to

      NOTE: If you wind up protecting against a vulnerability that is not
            tested for below, you should add at least one test here.

      DO NOT: Delete or change the test names for the tests provided below
    */
  });

  describe("Project", () => {
    let projectAddress: string;
    let project: Project;

    beforeEach(async () => {
      // TODO: Your ProjectFactory contract will need a `create` method, to
      //       create new Projects
      const txReceiptUnresolved = await projectFactory
        .connect(creator)
        .create(FIVE_ETHER);
      const txReceipt = await txReceiptUnresolved.wait();

      projectAddress = txReceipt.events![0].args![0];
      project = await ethers.getContractAt("Project", projectAddress);
    });

    describe("Contributions", () => {
      describe("Contributors", () => {
        it("Allows the creator to contribute", async () => {
          await project.connect(creator).contribute({ value: ONE_ETHER });

          expect(await project.contributions(creator.address)).to.equal(
            ONE_ETHER
          );
          expect(await project.raisedAmount()).to.equal(ONE_ETHER);
          expect(await project.creatorAddress()).to.equal(creator.address);
        });

        it("Allows any EOA to contribute", async () => {
          await project.connect(alice).contribute({ value: ONE_ETHER });

          expect(await project.contributions(alice.address)).to.equal(
            ONE_ETHER
          );
        });

        it("Allows an EOA to make many separate contributions", async () => {
          await project.connect(alice).contribute({ value: ONE_ETHER });
          await project.connect(alice).contribute({ value: ONE_ETHER });

          expect(await project.contributions(alice.address)).to.equal(
            ONE_ETHER.mul(2)
          );
          expect(await project.raisedAmount()).to.equal(
            ONE_ETHER.add(ONE_ETHER)
          );
        });

        it('Emits a "ContributionMade" event after a contribution is made', async () => {
          await project.connect(alice).contribute({ value: ONE_ETHER });

          expect(await projectFactory.create(FIVE_ETHER))
            .to.emit(projectFactory, "ContributionMade")
            .withArgs(alice.address, ONE_ETHER);
        });
      });

      describe("Minimum ETH Per Contribution", () => {
        it("Reverts contributions below 0.01 ETH", async () => {
          expect(await project.contributions(alice.address)).to.equal(0);
          await expect(
            project.connect(alice).contribute({ value: ONE_ETHER.div(20) })
          ).to.be.revertedWith("Contribution must be 0.1 ETH or greater");
        });

        it("Accepts contributions of exactly 0.01 ETH", async () => {
          await expect(
            project.connect(alice).contribute({ value: ONE_ETHER.div(10) })
          ).to.not.be.revertedWith("Contribution must be 0.1 ETH or greater");

          expect(await project.contributions(alice.address)).to.equal(
            ONE_ETHER.div(10)
          );
        });
      });

      describe("Final Contributions", () => {
        it("Allows the final contribution to exceed the project funding goal", async () => {
          // Note: After this contribution, the project is fully funded and should not
          //       accept any additional contributions. (See next test.)
          await project.connect(alice).contribute({ value: ONE_ETHER.mul(3) });
          await project.connect(alice).contribute({ value: ONE_ETHER });

          expect(await project.contributions(alice.address)).to.equal(
            ONE_ETHER.mul(4)
          );

          await project.connect(alice).contribute({ value: ONE_ETHER.mul(2) });
        });

        it("Prevents additional contributions after a project is fully funded", async () => {
          await project.connect(alice).contribute({ value: ONE_ETHER });
          await project.connect(alice).contribute({ value: ONE_ETHER });

          expect(await project.contributions(alice.address)).to.equal(
            ONE_ETHER.add(ONE_ETHER)
          );

          await project.connect(alice).contribute({ value: FIVE_ETHER });

          await expect(
            project.connect(alice).contribute({ value: ONE_ETHER })
          ).to.be.revertedWith("Project has reached its goal");
        });

        it("Prevents additional contributions after 30 days have passed since Project instance deployment", async () => {
          await project.connect(alice).contribute({ value: ONE_ETHER });

          await timeTravel(SECONDS_IN_DAY * 30);

          await expect(
            project.connect(alice).contribute({ value: ONE_ETHER })
          ).to.be.revertedWith("Project has ended");

          // expect(true).to.be.false;
        });
      });
    });

    describe("Withdrawals", () => {
      let provider: MockProvider;

      beforeEach(async () => {
        provider = waffle.provider;

        await project.connect(alice).contribute({ value: ONE_ETHER });
        await project.connect(bob).contribute({ value: ONE_ETHER.mul(3) });
      });
      describe("Project Status: Active", () => {
        it("Prevents the creator from withdrawing any funds", async () => {
          await expect(
            project.connect(creator).withdraw(ONE_ETHER)
          ).to.be.revertedWith("Project has not reached its goal");
        });

        it("Prevents contributors from withdrawing any funds", async () => {
          await expect(
            project.connect(alice).withdraw(ONE_ETHER)
          ).to.be.revertedWith("Only the creator can withdraw funds");
        });

        it("Prevents non-contributors from withdrawing any funds", async () => {
          await expect(project.connect(alice).refund()).to.be.revertedWith(
            "Not eligible for refund"
          );
        });
      });

      describe("Project Status: Success", () => {
        it("Allows the creator to withdraw some of the contribution balance", async () => {
          const beforeBalance = await provider.getBalance(creator.address);

          await project.connect(alice).contribute({ value: ONE_ETHER });

          const tx = await project.connect(creator).withdraw(ONE_ETHER);

          const receipt = await tx.wait();
          const gasUsed = receipt.gasUsed;
          const gasPrice = receipt.effectiveGasPrice;
          const gasSpent = gasPrice.mul(gasUsed);

          const afterBalance = await provider.getBalance(creator.address);

          const finalBalance = afterBalance.sub(beforeBalance).add(gasSpent);

          expect(finalBalance).to.equal(ONE_ETHER);
        });

        it("Allows the creator to withdraw the entire contribution balance", async () => {
          const beforeBalance = await provider.getBalance(creator.address);

          await project.connect(alice).contribute({ value: ONE_ETHER });

          const tx = await project.connect(creator).withdraw(FIVE_ETHER);

          const receipt = await tx.wait();
          const gasUsed = receipt.gasUsed;
          const gasPrice = receipt.effectiveGasPrice;
          const gasSpent = gasPrice.mul(gasUsed);

          const afterBalance = await provider.getBalance(creator.address);

          const finalBalance = afterBalance.sub(beforeBalance).add(gasSpent);

          expect(finalBalance).to.equal(FIVE_ETHER);
        });

        it("Allows the creator to make multiple withdrawals", async () => {
          const beforeBalance = await provider.getBalance(creator.address);

          await project.connect(alice).contribute({ value: ONE_ETHER });

          const tx = await project.connect(creator).withdraw(ONE_ETHER);
          const tx2 = await project.connect(creator).withdraw(ONE_ETHER);

          const receipt1 = await tx.wait();
          const gasUsed1 = receipt1.gasUsed;
          const gasPrice1 = receipt1.effectiveGasPrice;
          const gasSpent1 = gasPrice1.mul(gasUsed1);

          const receipt2 = await tx2.wait();
          const gasUsed2 = receipt2.gasUsed;
          const gasPrice2 = receipt2.effectiveGasPrice;
          const gasSpent2 = gasPrice2.mul(gasUsed2);

          const totalGasSpent = gasSpent1.add(gasSpent2);

          const afterBalance = await provider.getBalance(creator.address);

          const finalBalance = afterBalance
            .sub(beforeBalance)
            .add(totalGasSpent);

          expect(finalBalance).to.equal(ONE_ETHER.mul(2));
        });

        it("Prevents the creator from withdrawing more than the contribution balance", async () => {
          await project.connect(alice).contribute({ value: ONE_ETHER });

          await expect(
            project.connect(creator).withdraw(FIVE_ETHER.add(1))
          ).to.be.revertedWith("You have no outstanding funds");
        });

        it('Emits a "WithdrawMade" event after a withdrawal is made by the creator', async () => {
          await project.connect(alice).contribute({ value: ONE_ETHER });

          expect(await project.connect(creator).withdraw(FIVE_ETHER))
            .to.emit(project, "WithdrawMade")
            .withArgs(creator.address, FIVE_ETHER);
        });
      });

      it("Prevents contributors from withdrawing any funds", async () => {
        await expect(
          project.connect(alice).withdraw(ONE_ETHER)
        ).to.be.revertedWith("Only the creator can withdraw funds");
        await expect(
          project.connect(bob).withdraw(ONE_ETHER)
        ).to.be.revertedWith("Only the creator can withdraw funds");
      });

      it("Prevents non-contributors from withdrawing any funds", async () => {
        await expect(
          project.connect(deployer).withdraw(ONE_ETHER.add(1))
        ).to.be.revertedWith("Only the creator can withdraw funds");
      });
    });

    describe("Project Status: Failure", () => {
      let provider: MockProvider = waffle.provider;

      beforeEach(async () => {
        provider = waffle.provider;

        await project.connect(alice).contribute({ value: ONE_ETHER });
        await project.connect(bob).contribute({ value: ONE_ETHER.mul(3) });
      });
      it("Prevents the creator from withdrawing any funds (if not a contributor)", async () => {
        await expect(
          project.connect(creator).withdraw(ONE_ETHER.add(1))
        ).to.be.revertedWith("Project has not reached its goal");
      });

      it("Prevents contributors from withdrawing any funds (though they can still refund)", async () => {
        await timeTravel(SECONDS_IN_DAY * 30);

        await expect(
          project.connect(bob).withdraw(ONE_ETHER)
        ).to.be.revertedWith("Only the creator can withdraw funds");

        const beforeBalance = await provider.getBalance(bob.address);

        const tx = await project.connect(bob).refund();

        const receipt = await tx.wait();
        const gasUsed = receipt.gasUsed;
        const gasPrice = receipt.effectiveGasPrice;
        const gasSpent = gasPrice.mul(gasUsed);

        const afterBalance = await provider.getBalance(bob.address);

        const finalBalance = afterBalance.sub(beforeBalance).add(gasSpent);

        expect(finalBalance).to.equal(ONE_ETHER.mul(3));
      });

      it("Prevents non-contributors from withdrawing any funds", async () => {
        await expect(
          project.connect(deployer).withdraw(ONE_ETHER)
        ).to.be.revertedWith("Only the creator can withdraw funds");
      });
    });
  });

  describe("Refunds", () => {
    let projectAddress: string;
    let project: Project;
    let provider: MockProvider;

    beforeEach(async () => {
      // TODO: Your ProjectFactory contract will need a `create` method, to
      //       create new Projects
      const txReceiptUnresolved = await projectFactory
        .connect(creator)
        .create(FIVE_ETHER);
      const txReceipt = await txReceiptUnresolved.wait();

      projectAddress = txReceipt.events![0].args![0];
      project = await ethers.getContractAt("Project", projectAddress);

      provider = waffle.provider;

      await project.connect(alice).contribute({ value: ONE_ETHER });
      await project.connect(bob).contribute({ value: ONE_ETHER.mul(3) });
    });

    it("Allows contributors to be refunded when a project fails", async () => {
      await timeTravel(SECONDS_IN_DAY * 30);

      const beforeBalance = await provider.getBalance(bob.address);

      const tx = await project.connect(bob).refund();

      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed;
      const gasPrice = receipt.effectiveGasPrice;
      const gasSpent = gasPrice.mul(gasUsed);

      const afterBalance = await provider.getBalance(bob.address);

      const finalBalance = afterBalance.sub(beforeBalance).add(gasSpent);

      expect(finalBalance).to.equal(ONE_ETHER.mul(3));
    });

    it("Prevents contributors from being refunded if a project has not failed", async () => {
      await expect(project.connect(bob).refund()).to.be.revertedWith(
        "Not eligible for refund"
      );
    });

    it('Emits a "RefundReceived" event after a a contributor receives a refund', async () => {
      await timeTravel(SECONDS_IN_DAY * 30);

      const tx = await project.connect(alice).refund();

      expect(tx)
        .to.emit(project, "RefundReceived")
        .withArgs(alice.address, ONE_ETHER);
    });
  });

  describe("Cancellations (creator-triggered project failures)", () => {
    let projectAddress: string;
    let project: Project;
    let provider: MockProvider;

    beforeEach(async () => {
      // TODO: Your ProjectFactory contract will need a `create` method, to
      //       create new Projects
      const txReceiptUnresolved = await projectFactory
        .connect(creator)
        .create(FIVE_ETHER);
      const txReceipt = await txReceiptUnresolved.wait();

      projectAddress = txReceipt.events![0].args![0];
      project = await ethers.getContractAt("Project", projectAddress);

      provider = waffle.provider;

      await project.connect(alice).contribute({ value: ONE_ETHER });
      await project.connect(bob).contribute({ value: ONE_ETHER.mul(3) });
    });

    it("Allows the creator to cancel the project if < 30 days since deployment has passed ", async () => {
      expect(await project.connect(creator).cancelProject())
        .to.emit(project, "ProjectCancelled")
        .withArgs();

      expect(await project.connect(creator).isCancelled()).to.equal(true);
    });

    it("Prevents the creator from canceling the project if at least 30 days have passed", async () => {
      await timeTravel(SECONDS_IN_DAY * 31);

      await expect(project.connect(creator).cancelProject()).to.be.revertedWith(
        "Can't cancel project after deadline"
      );
    });

    it('Emits a "ProjectCancelled" event after a project is cancelled by the creator', async () => {
      expect(await project.connect(creator).cancelProject())
        .to.emit(project, "ProjectCancelled")
        .withArgs();
    });
  });

  describe("NFT Contributor Badges", () => {
    let projectAddress: string;
    let project: Project;
    let provider: MockProvider;

    beforeEach(async () => {
      // TODO: Your ProjectFactory contract will need a `create` method, to
      //       create new Projects
      const txReceiptUnresolved = await projectFactory
        .connect(creator)
        .create(FIVE_ETHER);
      const txReceipt = await txReceiptUnresolved.wait();

      projectAddress = txReceipt.events![0].args![0];
      project = await ethers.getContractAt("Project", projectAddress);

      provider = await waffle.provider;
    });
    it("Awards a contributor with a badge when they make a single contribution of at least 1 ETH", async () => {
      await project.connect(alice).contribute({ value: ONE_ETHER });
      expect(await project.balanceOf(alice.address)).to.equal(1);
    });

    it("Awards a contributor with a badge when they make multiple contributions to a single project that sum to at least 1 ETH", async () => {
      const halfEth = ethers.utils.parseEther("0.5");
      await project.connect(alice).contribute({ value: halfEth });
      await project.connect(alice).contribute({ value: halfEth });

      expect(await project.balanceOf(alice.address)).to.equal(1);
      expect(await project.balanceOf(deployer.address)).to.equal(0);
    });

    it("Does not award a contributor with a badge if their total contribution to a single project sums to < 1 ETH", async () => {
      const halfEth = ethers.utils.parseEther("0.5");
      await project.connect(alice).contribute({ value: halfEth });

      expect(await project.balanceOf(alice.address)).to.equal(0);
    });

    it("Awards a contributor with a second badge when their total contribution to a single project sums to at least 2 ETH", async () => {
      await project.connect(alice).contribute({ value: ONE_ETHER });
      expect(await project.balanceOf(alice.address)).to.equal(1);
      await project.connect(alice).contribute({ value: ONE_ETHER });
      expect(await project.balanceOf(alice.address)).to.equal(2);
    });

    it("Does not award a contributor with a second badge if their total contribution to a single project is > 1 ETH but < 2 ETH", async () => {
      const halfEth = ethers.utils.parseEther("0.5");
      await project.connect(alice).contribute({ value: halfEth });
      await project.connect(alice).contribute({ value: ONE_ETHER });

      expect(await project.balanceOf(alice.address)).to.equal(1);
    });

    it("Awards contributors with different NFTs for contributions to different projects", async () => {
      const artistBobTx = await projectFactory.connect(bob).create(FIVE_ETHER);
      const artistBobTxReceipt = await artistBobTx.wait();

      projectAddress = artistBobTxReceipt.events![0].args![0];
      const bobProject = await ethers.getContractAt("Project", projectAddress);

      await project.connect(alice).contribute({ value: ONE_ETHER });
      const creatorProjectBalance = await project.balanceOf(alice.address);

      await bobProject.connect(alice).contribute({ value: ONE_ETHER.mul(2) });
      const bobProjectBalance = await bobProject.balanceOf(alice.address);

      expect(creatorProjectBalance).to.equal(1);
      expect(bobProjectBalance).to.equal(2);
    });

    it("Allows contributor badge holders to trade the NFT to another address", async () => {
      await project.connect(alice).contribute({ value: ONE_ETHER });
      const aliceProjectBalance = await project.balanceOf(alice.address);
      expect(aliceProjectBalance).to.equal(1);

      await project.connect(alice).transferBadge(bob.address, 0);
      const bobProjectBalance = await project.balanceOf(bob.address);
      expect(await project.balanceOf(alice.address)).to.equal(0);

      expect(bobProjectBalance).to.equal(1);
    });

    it("Allows contributor badge holders to trade the NFT to another address even after its related project fails", async () => {
      await project.connect(alice).contribute({ value: ONE_ETHER });

      await timeTravel(SECONDS_IN_DAY * 31);

      const aliceProjectBalance = await project.balanceOf(alice.address);
      expect(aliceProjectBalance).to.equal(1);

      await project.connect(alice).transferBadge(bob.address, 0);
      const bobProjectBalance = await project.balanceOf(bob.address);
      expect(await project.balanceOf(alice.address)).to.equal(0);

      expect(bobProjectBalance).to.equal(1);
    });
  });
});
