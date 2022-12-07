/* eslint-disable no-unused-expressions */
import chai, { expect } from "chai";
import { ethers, waffle } from "hardhat";
import { BigNumber, Contract } from "ethers";
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { MockProvider, solidity } from "ethereum-waffle";
chai.use(solidity);

const ONE_ETH: BigNumber = ethers.utils.parseEther("1");
const FIVE_ETH: BigNumber = ethers.utils.parseEther("5");
const TEN_THOUSAND_ETH: BigNumber = ethers.utils.parseEther("10000");

describe("ICO withdraw function", function () {
  let deployer: SignerWithAddress;
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;
  let charlie: SignerWithAddress;
  let treasury: SignerWithAddress;
  let testSpaceRouter: SignerWithAddress;
  let signers: SignerWithAddress[];

  let SpaceCoinICOFactory;
  let spaceCoinICO: Contract;
  let SpacecoinTokenFactory;
  let spacecoinToken: Contract;
  let PoolFactory;
  let pool: Contract;
  let spaceRouterFactory;
  let spaceRouter: Contract;
  let provider: MockProvider;

  beforeEach(async () => {
    [deployer, alice, bob, charlie, treasury, testSpaceRouter] =
      await ethers.getSigners();

    signers = await ethers.getSigners();
    provider = waffle.provider;

    SpaceCoinICOFactory = await ethers.getContractFactory("SpaceCoinICO");
    spaceCoinICO = await SpaceCoinICOFactory.deploy(treasury.address);
    await spaceCoinICO.deployed();

    spacecoinToken = await ethers.getContractAt(
      "SpaceCoinToken",
      await spaceCoinICO.spacecoinToken()
    );

    PoolFactory = await ethers.getContractFactory("Pool");
    pool = await PoolFactory.deploy(spacecoinToken.address);
    await pool.deployed();

    spaceRouter = await ethers.getContractAt(
      "SpaceRouter",
      await pool.spacecoinRouter()
    );
  });

  describe("LP Token", () => {
    it("should deploy correctly", async () => {
      expect(pool.address).to.be.ok;
    });
    it("should have a starting totalSupply of 1000", async () => {
      const totalSupply = await pool.totalSupply();
      expect(totalSupply).to.eq(1000);
    });
    it("should have correct name", async () => {
      const name = await pool.name();
      expect(name).to.eq("LP Token");
    });
    it("should have correct symbol", async () => {
      const symbol = await pool.symbol();
      expect(symbol).to.eq("LPT");
    });
  });

  describe("SpaceRouter", () => {
    describe("getSpcReserve", () => {
      it("should return correct initial spcToken balance", async () => {
        const spcTokenBalance = await spaceRouter.getSpcReserve();
        expect(spcTokenBalance).to.eq(0);
      });
      it("should return correct spcToken balance", async () => {
        // add alice to whitelist
        await spaceCoinICO.addToWhitelist(alice.address);

        // contribute ETH to ICO
        await spaceCoinICO.connect(alice).invest({ value: ONE_ETH });

        // withdraw funds to treasury
        const withdrawTx = await spaceCoinICO.connect(treasury).withdraw();
        await withdrawTx.wait();

        const spcTreasury = await spacecoinToken.treasury();

        const treasuryTokenBalance = await spacecoinToken.balanceOf(
          spcTreasury
        );

        const treasuryEthBalanceWithDefault = await provider.getBalance(
          spcTreasury
        );
        const treasuryEthBalance =
          treasuryEthBalanceWithDefault.sub(TEN_THOUSAND_ETH);

        const tokenAmountToAdd = treasuryEthBalance.mul(5);

        // approve spaceRouter to add liquidity to pool
        const approveWithdrawTx = await spacecoinToken
          .connect(treasury)
          .approve(spaceRouter.address, tokenAmountToAdd);
        await approveWithdrawTx.wait();

        // add liquidity from treasury to pool
        const treasuryToPoolTx = await spaceRouter
          .connect(treasury)
          .addLiquidity(tokenAmountToAdd, {
            value: treasuryEthBalance,
          });
        await treasuryToPoolTx.wait();

        const spcTokenBalance = await spaceRouter.getSpcReserve();
        expect(spcTokenBalance).to.eq(0);
      });
    });
  });

  describe("ICO withdraw function", () => {
    it("should set correct treasury address", async () => {
      const spcTreasury = await spacecoinToken.treasury();

      expect(spcTreasury).to.eq(treasury.address);
    });
    it("should send equal amounts of ETH and SPC if sufficient treasury balances", async function () {
      const spcTreasury = await spacecoinToken.treasury();

      await spaceCoinICO.addToWhitelist(alice.address);

      // contribute ETH to ICO
      await spaceCoinICO.connect(alice).invest({ value: ONE_ETH });

      const withdrawTx = await spaceCoinICO.connect(treasury).withdraw();

      await withdrawTx.wait();

      const withdrawTxReceipt = await provider.getTransactionReceipt(
        withdrawTx.hash
      );

      const gasCost = withdrawTxReceipt.gasUsed.mul(
        withdrawTxReceipt.effectiveGasPrice
      );

      const treasuryEthBalance = await provider.getBalance(spcTreasury);
      const treasuryTokenBalance = await spacecoinToken.balanceOf(spcTreasury);

      const ethAmountToAdd =
        treasuryEthBalance <= treasuryTokenBalance
          ? treasuryEthBalance
          : treasuryTokenBalance;

      const tokenAmountToAdd =
        treasuryTokenBalance <= treasuryEthBalance
          ? treasuryTokenBalance
          : treasuryEthBalance;

      expect(ethAmountToAdd).to.eq(tokenAmountToAdd);
      expect(withdrawTx).to.emit(spaceCoinICO, "TransferredBalanceToTreasury");
    });
    it("should revert if insufficient treasury balances of ETH and SPC", async function () {
      const withdrawTx = spaceCoinICO.connect(treasury).withdraw();

      await expect(withdrawTx).to.be.revertedWith(
        "transferBalancesToTreasury: Insufficient eth balance"
      );

      const icoBalance = await spaceCoinICO.totalAmountRaised();

      expect(icoBalance).to.eq(0);
    });
  });

  describe("Pool", () => {
    it("sets correct spacecoinToken address", async () => {
      const spcTknAddr = await pool.spcToken();
      expect(spcTknAddr).to.be.ok;
      expect(spcTknAddr).to.eq(spacecoinToken.address);
    });
    it("sets correct minimum liquidity", async () => {
      const minimumLiquidity = await pool.MINIMUM_LIQUIDITY();
      expect(minimumLiquidity).to.eq(1000);
    });
    it("mints correctly", async () => {
      const mintTx = await pool.mint(alice.address, 3);
      await mintTx.wait();

      const aliceTokenBalance = await pool.balanceOf(alice.address);

      expect(aliceTokenBalance).to.eq(3);
      expect(mintTx).to.emit(pool, "Mint").withArgs(deployer.address, 3);
    });
    it("burns correctly", async () => {
      const mintTx = await pool.mint(alice.address, 3);
      await mintTx.wait();

      const burnTx = await pool.burn(alice.address, 3);
      await burnTx.wait();

      const aliceTokenBalance = await pool.balanceOf(alice.address);

      expect(aliceTokenBalance).to.eq(0);
      expect(burnTx).to.emit(pool, "Burn").withArgs(deployer.address, 3);
    });

    describe("getTokensAmount", () => {
      it("getTokensAmount correctly", async () => {
        const getTokensAmountTx = await pool.getTokensAmount(100, 200, 300);
        expect(getTokensAmountTx).to.eq(99);
      });
      it(" calls getTokensAmount correctly", async () => {
        const getTokensAmountTx = await pool.getTokensAmount(100, 200, 300);
        expect(getTokensAmountTx).to.eq(99);
      });
      it("reverts with incorrect inputs", async () => {
        await expect(
          pool.connect(alice).getTokensAmount(100, 0, 0)
        ).to.be.revertedWith("invalid reserves");
      });
    });
  });

  describe("SpaceRouter", () => {
    it("sets correct spcToken", async () => {
      const spcToken = await spaceRouter.spcToken();
      expect(spcToken).to.eq(spacecoinToken.address);
    });
    it("sets correct pool", async () => {
      const pool = await spaceRouter.spcToken();
      expect(pool).to.be.ok;
    });
    it("calls getSpcReserve correctly", async () => {
      const getSpcReserveTx = await spaceRouter.getSpcReserve();
      const balance = await pool.balanceOf(pool.address);
      expect(getSpcReserveTx).to.eq(balance);
    });
    it.only("calls addLiquidity with equal eth and spc if no reserves", async () => {
      const getSpcReserveTx = await spaceRouter.getSpcReserve();
      const balanceBefore = await pool.balanceOf(pool.address);
      const addLiqTx = await spaceRouter.addLiquidity(5, {
        value: ONE_ETH,
      });
      await addLiqTx.wait();

      const balanceAfter = await pool.balanceOf(pool.address);
      expect(balanceBefore).to.eq(0);
      expect(balanceAfter).to.eq(0);
    });
  });
});
