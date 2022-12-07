import { Contract, utils } from "ethers";
import {
  ICO_CONTRACT_ABI,
  ICO_CONTRACT_ADDRESS,
  POOL_CONTRACT_ABI,
  POOL_CONTRACT_ADDRESS,
} from "../constants";

export const addLiquidity = async (
  signer,
  addSpcAmountWei,
  addEthAmountWei
) => {
  try {
    const tokenContract = new Contract(
      ICO_CONTRACT_ADDRESS,
      ICO_CONTRACT_ABI,
      signer
    );

    const poolContract = new Contract(
      POOL_CONTRACT_ADDRESS,
      POOL_CONTRACT_ABI,
      signer
    );

    let tx = await tokenContract.approve(
      POOL_CONTRACT_ADDRESS,
      addSpcAmountWei.toString()
    );
    await tx.wait();
    tx = await poolContract.addLiquidity(addSpcAmountWei, {
      value: addEthAmountWei,
    });
    await tx.wait();
  } catch (err) {
    console.error(err);
  }
};

export const calculateSpc = async (
  addEther = "0",
  etherBalanceContract,
  spcTokenReserve
) => {
  const addEtherAmountWei = utils.parseEther(addEther);

  const spcTokenAmount = addEtherAmountWei
    .mul(spcTokenReserve)
    .div(etherBalanceContract);
  return spcTokenAmount;
};
