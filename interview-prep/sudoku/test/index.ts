/* eslint-disable camelcase */
import chai, { expect } from "chai";
import { ethers } from "hardhat";
import { solidity } from "ethereum-waffle";

import {
  SudokuChallenge,
  SudokuChallenge__factory,
  SudokuExchange__factory,
  SudokuExchange,
} from "../typechain";

chai.use(solidity);

const testChallenge = [
  3, 0, 6, 5, 0, 8, 4, 0, 0, 5, 2, 0, 0, 0, 0, 0, 0, 0, 0, 8, 7, 0, 0, 0, 0, 3,
  1, 0, 0, 3, 0, 1, 0, 0, 8, 0, 9, 0, 0, 8, 6, 3, 0, 0, 5, 0, 5, 0, 0, 9, 0, 6,
  0, 0, 1, 3, 0, 0, 0, 0, 2, 5, 0, 0, 0, 0, 0, 0, 0, 0, 7, 4, 3, 0, 0, 0, 0, 2,
  5, 0, 3,
];

describe("Sudoku Tests", () => {
  let SudokuChallenge: SudokuChallenge__factory;
  let sudokuChallenge: SudokuChallenge;
  let SudokuExchange: SudokuExchange__factory;
  let sudokuExchange: SudokuExchange;
  beforeEach(async () => {
    SudokuChallenge = await ethers.getContractFactory("SudokuChallenge");
    sudokuChallenge = await SudokuChallenge.deploy(
      // @ts-ignore
      testChallenge
    );
    await sudokuChallenge.deployed();
    SudokuExchange = await ethers.getContractFactory("SudokuExchange");
    sudokuExchange = await SudokuExchange.deploy();
    await sudokuExchange.deployed();
  });

  it("SudokuChallenge has correct challenge instance", async () => {
    const challengeArr = [];

    for (let i = 0; i < testChallenge.length; i++) {
      const challenge = await sudokuChallenge.challenge(i);
      challengeArr.push(challenge);
    }

    expect(testChallenge).to.deep.equal(challengeArr);
  });
});

describe("Greeter", function () {
  it("Should return the new greeting once it's changed", async function () {
    const Greeter = await ethers.getContractFactory("Greeter");
    const greeter = await Greeter.deploy("Hello, world!");
    await greeter.deployed();

    expect(await greeter.greet()).to.equal("Hello, world!");

    const setGreetingTx = await greeter.setGreeting("Hola, mundo!");

    // wait until the transaction is mined
    await setGreetingTx.wait();

    expect(await greeter.greet()).to.equal("Hola, mundo!");
  });
});
