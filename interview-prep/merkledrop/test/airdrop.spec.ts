import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { MerkleTree } from "merkletreejs";
import {
  TypedDataField,
  TypedDataSigner,
} from "@ethersproject/abstract-signer";
import keccak256 from "keccak256";
import { Airdrop, ERC20, MacroToken } from "../typechain";
import { AbiCoder } from "ethers/lib/utils";
import { BigNumber } from "ethers";

const provider = ethers.provider;
let account1: SignerWithAddress;
let account2: SignerWithAddress;
let rest: SignerWithAddress[];

let macroToken: MacroToken;
let airdrop: Airdrop;
let merkleRoot: string;

type leaf = {
  address: string;
  amount: number;
};

let mockAirdropLeaves: leaf[];
let leafNodes: string[];
let merkleTree: MerkleTree;
let defaultEncoder: AbiCoder;

const MINT_AMOUNT = ethers.utils.parseEther("10000");
const bufferToHex = (buffer: Buffer) => "0x" + buffer.toString("hex");

const createEIP712Signer = ({
  domain,
  types,
}: {
  domain: Record<string, any>;
  types: Record<string, TypedDataField[]>;
}) => {
  return async (signer: TypedDataSigner, params: Record<string, any>) => {
    const signedData = await signer._signTypedData(domain, types, params);
    return ethers.utils.splitSignature(signedData);
  };
};

const getClaimSignature = async (
  signer: TypedDataSigner,
  contractAddress: string,
  params: {
    claimer: string;
    amount: number;
  }
) => {
  const signature = await signer._signTypedData(
    {
      name: "Airdrop",
      version: "v1",
      chainId: provider.network.chainId,
      verifyingContract: contractAddress,
    },
    {
      Claim: [
        { name: "claimer", type: "address" },
        { name: "amount", type: "uint256" },
      ],
    },
    params
  );
  return signature;
};

describe("Airdrop", function () {
  before(async () => {
    [account1, account2, ...rest] = await ethers.getSigners();

    macroToken = (await (
      await ethers.getContractFactory("MacroToken")
    ).deploy("Macro Token", "MACRO")) as MacroToken;
    await macroToken.deployed();

    const mockAmount = 5;

    const leaf1 = {
      address: account1.address,
      amount: mockAmount,
    };

    const leaf2 = {
      address: account2.address,
      amount: mockAmount,
    };

    mockAirdropLeaves = [leaf1, leaf2];

    leafNodes = mockAirdropLeaves.map((_leaf) => {
      const bytes = ethers.utils.defaultAbiCoder.encode(
        ["address", "uint256"],
        [_leaf.address, _leaf.amount]
      );

      return ethers.utils.keccak256(bytes);
    });

    merkleTree = new MerkleTree(leafNodes, ethers.utils.keccak256, {
      sort: true,
    });

    merkleRoot = merkleTree.getHexRoot();
  });

  beforeEach(async () => {
    airdrop = await (
      await ethers.getContractFactory("Airdrop")
    ).deploy(merkleRoot, account1.address, macroToken.address);
    await airdrop.deployed();

    // mint macro tokens to the airdrop account
    await macroToken.mint(airdrop.address, MINT_AMOUNT);
  });

  it("should have correct aidrop token balance", async () => {
    const airdropTokenBalance = await macroToken.balanceOf(airdrop.address);
    expect(airdropTokenBalance).to.eq(MINT_AMOUNT);
  });

  describe("macrotoken", () => {
    it("correctly sets owner", async () => {
      const owner = await macroToken.owner();
      expect(owner).to.eq(account1.address);
    });
    it("only allows owner to mint", async () => {
      await expect(
        macroToken.connect(account2).mint(airdrop.address, 10)
      ).to.be.revertedWith("Only owner can mint");
    });
    it("correctly mints tokens to address", async () => {
      await macroToken.mint(airdrop.address, MINT_AMOUNT);
      const aidropTokenBalance = await macroToken.balanceOf(airdrop.address);

      expect(aidropTokenBalance).to.eq(MINT_AMOUNT.mul(2));
    });
  });

  describe("setup and disabling ECDSA", () => {
    it("should deploy correctly", async () => {
      // if the beforeEach succeeded, then this succeeds
    });

    it("should disable ECDSA verification", async () => {
      // first try with non-owner user
      await expect(
        airdrop.connect(account2).disableECDSAVerification()
      ).to.be.revertedWith("Ownable: caller is not the owner");

      // now try with owner
      await expect(airdrop.disableECDSAVerification())
        .to.emit(airdrop, "ECDSADisabled")
        .withArgs(account1.address);
    });
  });

  describe("Merkle claiming", () => {
    it("correctly verify merkle proof", async () => {
      const amount = 5;

      const account1Leaf = ethers.utils.keccak256(
        ethers.utils.defaultAbiCoder.encode(
          ["address", "uint256"],
          [account1.address, amount]
        )
      );

      const proof = merkleTree.getHexProof(account1Leaf);
      const balanceBefore = await macroToken.balanceOf(account1.address);

      await airdrop.merkleClaim(proof, account1.address, amount);

      const balanceAfter = await macroToken.balanceOf(account1.address);
      const difference = balanceAfter.sub(balanceBefore);

      expect(difference.eq(amount)).to.be.true;
    });
    it("emits correct Merkle Claim event", async () => {
      const amount = 5;

      const account1Leaf = ethers.utils.keccak256(
        ethers.utils.defaultAbiCoder.encode(
          ["address", "uint256"],
          [account1.address, amount]
        )
      );

      const proof = merkleTree.getHexProof(account1Leaf);

      await expect(airdrop.merkleClaim(proof, account1.address, amount))
        .to.emit(airdrop, "MerkleClaim")
        .withArgs(account1.address, amount);
    });
    it("reverts if wrong claimer", async () => {
      const amount = 5;
      const account2Leaf = ethers.utils.keccak256(
        ethers.utils.defaultAbiCoder.encode(
          ["address", "uint256"],
          [account2.address, amount]
        )
      );

      const proof = merkleTree.getHexProof(account2Leaf);

      const tx = airdrop
        .connect(account2)
        .merkleClaim(proof, account1.address, amount);

      await expect(tx).to.be.revertedWith("Invalid claimer");
    });
  });

  describe("Signature claiming", () => {
    it("should correctly create SUPPORT_TYPEHASH", async () => {
      const bytes = ethers.utils.toUtf8Bytes(
        "Claim(address claimer,uint256 amount)"
      );
      const SUPPORT_TYPEHASH = ethers.utils.keccak256(bytes);

      const actualSupportTypeHash = await airdrop.SUPPORT_TYPEHASH();

      expect(SUPPORT_TYPEHASH).to.eq(actualSupportTypeHash);
    });

    it("Lets approved users claim", async () => {
      const amount = 5;
      const account1Signature = await getClaimSignature(
        account1,
        airdrop.address,
        {
          claimer: account1.address,
          amount: amount,
        }
      );

      const balanceBefore = await macroToken.balanceOf(account1.address);

      await airdrop
        .connect(account1)
        .signatureClaim(account1Signature, account1.address, amount);

      const balanceAfter = await macroToken.balanceOf(account1.address);
      const difference = balanceAfter.sub(balanceBefore);

      expect(difference.eq(amount)).to.be.true;
    });

    it("Prevent non-approved users from claiming", async () => {
      const amount = 5;
      const account2Signature = await getClaimSignature(
        account1,
        airdrop.address,
        {
          claimer: account2.address,
          amount,
        }
      );

      const tx = airdrop
        .connect(account1)
        .signatureClaim(account2Signature, account2.address, amount);

      await expect(tx).to.be.revertedWith("Invalid claimer");
    });
  });
});
