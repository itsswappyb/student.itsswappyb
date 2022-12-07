import { Contract } from "ethers";
import {
  POOL_CONTRACT_ABI,
  POOL_CONTRACT_ADDRESS,
  ICO_CONTRACT_ABI,
  ICO_CONTRACT_ADDRESS,
} from "../constants";

export const getTokensFromSwap = async (
  swapAmountWei,
  provider,
  ethSelected,
  ethBalance,
  reservedSpc
) => {
  const poolContract = new Contract(
    POOL_CONTRACT_ADDRESS,
    POOL_CONTRACT_ABI,
    provider
  );
  let amountOfTokens;

  if (ethSelected) {
    amountOfTokens = await poolContract.getAmountOfTokens(
      swapAmountWei,
      ethBalance,
      reservedSpc
    );
  } else {
    amountOfTokens = await poolContract.getAmountOfTokens(
      swapAmountWei,
      reservedSpc,
      ethBalance
    );
  }

  return amountOfTokens;
};

export const swapTokens = async (
  signer,
  swapAmountWei,
  tokenToBeReceivedAfterSwap,
  ethSelected
) => {
  const poolContract = new Contract(
    POOL_CONTRACT_ADDRESS,
    POOL_CONTRACT_ABI,
    signer
  );
  const icoContract = new Contract(
    ICO_CONTRACT_ADDRESS,
    ICO_CONTRACT_ABI,
    signer
  );
  let tx;
  if (ethSelected) {
    tx = await poolContract.swapEthForSpc(tokenToBeReceivedAfterSwap, {
      value: swapAmountWei,
    });
  } else {
    tx = await icoContract.approve(
      POOL_CONTRACT_ADDRESS,
      swapAmountWei.toString()
    );
    await tx.wait();
    tx = await poolContract.swapSpcForEth(
      swapAmountWei,
      tokenToBeReceivedAfterSwap
    );
  }
  await tx.wait();
};
