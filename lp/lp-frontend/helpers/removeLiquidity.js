import { Contract, providers, utils, BigNumber } from "ethers";
import { POOL_CONTRACT_ABI, POOL_CONTRACT_ADDRESS } from "../constants";

export const removeLiquidity = async (signer, removeLPTokensWei) => {
  const poolContract = new Contract(
    POOL_CONTRACT_ADDRESS,
    POOL_CONTRACT_ABI,
    signer
  );
  const tx = await poolContract.removeLiquidity(removeLPTokensWei);
  await tx.wait();
};

export const getTokensAfterRemove = async (
  provider,
  removeLPTokenWei,
  ethBalance,
  spcTokenReserve
) => {
  try {
    const poolContract = new Contract(
      POOL_CONTRACT_ADDRESS,
      POOL_CONTRACT_ABI,
      provider
    );

    const totalSupply = await poolContract.totalSupply();
    const removeEther = ethBalance.mul(removeLPTokenWei).div(totalSupply);
    const removeSpc = spcTokenReserve.mul(removeLPTokenWei).div(totalSupply);
    return {
      removeEther,
      removeSpc,
    };
  } catch (err) {
    console.error(err);
  }
};
