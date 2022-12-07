import { Contract } from "ethers";
import {
  ICO_CONTRACT_ABI,
  ICO_CONTRACT_ADDRESS,
  POOL_CONTRACT_ABI,
  POOL_CONTRACT_ADDRESS,
} from "../constants";

export const getEtherBalance = async (provider, address, contract = false) => {
  try {
    if (contract) {
      const balance = await provider.getBalance(POOL_CONTRACT_ADDRESS);
      return balance;
    } else {
      const balance = await provider.getBalance(address);
      return balance;
    }
  } catch (err) {
    console.error(err);
    return 0;
  }
};

export const getSpcTokenBalance = async (provider, address) => {
  try {
    const tokenContract = new Contract(
      ICO_CONTRACT_ADDRESS,
      ICO_CONTRACT_ABI,
      provider
    );
    const balanceOfSpcTokens = await tokenContract.balanceOf(address);
    return balanceOfSpcTokens;
  } catch (err) {
    console.error(err);
  }
};

export const getLPTokenBalance = async (provider, address) => {
  try {
    const poolContract = new Contract(
      POOL_CONTRACT_ADDRESS,
      POOL_CONTRACT_ABI,
      provider
    );
    const balanceOfLPTokens = await poolContract.balanceOf(address);
    return balanceOfLPTokens;
  } catch (err) {
    console.error(err);
  }
};

export const getSpcReserveTokens = async (provider) => {
  try {
    const poolContract = new Contract(
      POOL_CONTRACT_ADDRESS,
      POOL_CONTRACT_ABI,
      provider
    );
    const reserve = await poolContract.getSpcReserve();
    return reserve;
  } catch (err) {
    console.error(err);
  }
};
