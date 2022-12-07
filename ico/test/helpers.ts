import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber, ethers, Signer } from "ethers";
import seedRandom from "seedrandom";

const rng = seedRandom();

// Token helper functions
export const TOKEN_MULTIPLIER = BigNumber.from(10).pow(18);
export const TOKEN_SUPPLY = TOKEN_MULTIPLIER.mul(500_000);

export const getTokens = (tokenAmount: number) => ethers.utils.parseEther(tokenAmount.toString());

export const ONE_ETHER: BigNumber = ethers.utils.parseEther("1");

export const getRandomInt = (max: number) => {
  return Math.floor(rng() * Math.floor(max));
};
