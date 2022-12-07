/* eslint-disable no-unused-expressions */
import chai, { expect } from "chai";
import { ethers, network } from "hardhat";
import { solidity } from "ethereum-waffle";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import { Collector__factory } from "../typechain/factories/Collector__factory";
import { TestNftMarketplace__factory } from "../typechain/factories/TestNftMarketplace__factory";
import { Collector, TestNftMarketplace } from "../typechain";
import { BigNumber as BN } from "ethers";
import { Z_BLOCK } from "zlib";

chai.use(solidity);

const ONE_ETHER = ethers.utils.parseEther("1");
const SECONDS_IN_DAY: number = 60 * 60 * 24;
const timeTravel = async (seconds: number) => {
    await network.provider.send("evm_increaseTime", [seconds]);
    await network.provider.send("evm_mine");
};

describe("Collector", () => {
    let deployer: SignerWithAddress;
    let alice: SignerWithAddress;
    let bob: SignerWithAddress;
    let charlie: SignerWithAddress;
    let dan: SignerWithAddress;

    let signers: SignerWithAddress[];

    let CollectorFactory: Collector__factory;
    let collector: Collector;
    let TestNftMarketplaceFactory: TestNftMarketplace__factory;
    let testNftMarketplace: TestNftMarketplace;

    beforeEach(async () => {
        [deployer, alice, bob, charlie, dan] = await ethers.getSigners();

        signers = await ethers.getSigners();

        CollectorFactory = await ethers.getContractFactory("Collector");
        TestNftMarketplaceFactory = await ethers.getContractFactory(
            "TestNftMarketplace"
        );

        collector = await CollectorFactory.deploy();
        testNftMarketplace = await TestNftMarketplaceFactory.deploy();

        await collector.deployed();
        await testNftMarketplace.deployed();
    });

    it("should deploy", async () => {
        // eslint-disable-next-line no-unused-expressions
        expect(collector.address).to.be.ok;
    });

    describe("Initial state variables", () => {
        // let proposal: any;

        beforeEach(async () => {
            // proposal = await collector.proposals(0);
        });

        it("Admin is the deployer", async () => {
            expect(await collector.admin()).to.equal(deployer.address);
        });
        it("proposal is set correctly", async () => {
            expect(await collector.proposals.length).to.equal(0);
        });
        it("name is set correctly", async () => {
            expect(await collector.name()).to.equal("Collector DAO");
        });
        it("proposalCount is set correctly", async () => {
            expect(await collector.proposalCount()).to.equal(0);
        });
        it("totalMemberCount is set correctly", async () => {
            expect(await collector.totalMemberCount()).to.equal(0);
        });
        it("proposalMaxOperations is set correctly", async () => {
            expect(await collector.proposalMaxOperations()).to.equal(10);
        });
        it("votingDelay is set correctly", async () => {
            expect(await collector.votingDelay()).to.equal(6455);
        });
        it("votingPeriod is set correctly", async () => {
            expect(await collector.votingPeriod()).to.equal(17289);
        });
        it("DOMAIN_TYPEHASH is set correctly", async () => {
            const domainBytes = ethers.utils.toUtf8Bytes(
                "EIP712Domain(string name,uint256  chainId,address verifyingContract)"
            );
            expect(await collector.DOMAIN_TYPEHASH()).to.equal(
                ethers.utils.keccak256(domainBytes)
            );
        });
        it("BALLOT_TYPEHASH is set correctly", async () => {
            const ballotBytes = ethers.utils.toUtf8Bytes(
                "Ballot(uint256 proposalId,bool choice)"
            );
            expect(await collector.BALLOT_TYPEHASH()).to.equal(
                ethers.utils.keccak256(ballotBytes)
            );
        });
    });

    describe("Buy membership", () => {
        it("should revert if amount is not 1 ether", async () => {
            await expect(
                collector.buyMembership({
                    value: ethers.utils.parseEther("0.5"),
                })
            ).to.be.revertedWith(
                "Collector::buyMembership: membership is 1 ether"
            );
            await expect(
                collector.buyMembership({
                    value: ethers.utils.parseEther("1.5"),
                })
            ).to.be.revertedWith(
                "Collector::buyMembership: membership is 1 ether"
            );
        });
        it("should not revert if amount is equal to 1 ether", async () => {
            await expect(
                collector.buyMembership({
                    value: ethers.utils.parseEther("1"),
                })
            ).to.not.be.revertedWith(
                "Collector::buyMembership: membership is 1 ether"
            );
        });
        it("should set sender as member if successful", async () => {
            await collector.buyMembership({
                value: ethers.utils.parseEther("1"),
            });

            expect(
                await collector
                    .connect(deployer.address)
                    .isMember(deployer.address)
            ).to.be.true;
        });
        it("should increment as totalMemberCount if successful", async () => {
            await collector.buyMembership({
                value: ethers.utils.parseEther("1"),
            });

            expect(await collector.totalMemberCount()).to.equal(1);
        });
    });

    it("should revert if already a member", async () => {
        await collector.buyMembership({
            value: ethers.utils.parseEther("1"),
        });

        await expect(
            collector.buyMembership({
                value: ethers.utils.parseEther("1"),
            })
        ).to.be.revertedWith(
            "Collector::buyMembership: user is already a member"
        );
    });

    it("onERC721Received should return correct selector", async () => {
        const selector = await collector.onERC721Received(
            deployer.address,
            alice.address,
            2,
            ethers.utils.toUtf8Bytes("test")
        );

        expect(selector).to.exist;
    });

    describe("proposeNft", () => {
        let marketplaceAddress: string;
        let nftContractAddress: string;
        let nftId: number;
        let nftPrice: BN;

        beforeEach(async () => {
            marketplaceAddress = testNftMarketplace.address;
            nftContractAddress = testNftMarketplace.address;
            nftId = 2;

            nftPrice = await testNftMarketplace.getPrice(
                nftContractAddress,
                nftId
            );
        });

        it("should revert if insufficient treasury funds", async () => {
            await collector.buyMembership({ value: ONE_ETHER });
            await expect(
                collector.proposeNft(
                    marketplaceAddress,
                    nftContractAddress,
                    nftId
                )
            ).to.be.revertedWith("Collector::buy: Insufficient treasury funds");
        });

        it("should not revert if sufficient treasury funds", async () => {
            await collector.buyMembership({
                value: ethers.utils.parseEther("1"),
            });
            await collector.connect(alice).buyMembership({
                value: ethers.utils.parseEther("1"),
            });
            await collector.connect(bob).buyMembership({
                value: ethers.utils.parseEther("1"),
            });

            const tx = collector.proposeNft(
                marketplaceAddress,
                nftContractAddress,
                nftId
            );

            await expect(tx).to.not.to.be.reverted;
        });
        it("should not revert if sufficient treasury funds", async () => {
            await collector.buyMembership({
                value: ethers.utils.parseEther("1"),
            });
            await collector.connect(alice).buyMembership({
                value: ethers.utils.parseEther("1"),
            });
            await collector.connect(bob).buyMembership({
                value: ethers.utils.parseEther("1"),
            });

            const tx = collector.proposeNft(
                marketplaceAddress,
                nftContractAddress,
                nftId
            );

            await expect(tx).to.not.to.be.reverted;
        });

        it("it should emit ProposalCreated event", async () => {
            await collector.buyMembership({
                value: ethers.utils.parseEther("1"),
            });
            await collector.connect(alice).buyMembership({
                value: ethers.utils.parseEther("1"),
            });
            await collector.connect(bob).buyMembership({
                value: ethers.utils.parseEther("1"),
            });

            const tx = await collector.proposeNft(
                marketplaceAddress,
                nftContractAddress,
                nftId
            );
            await tx.wait();

            expect(tx).to.emit(collector, "ProposalCreated");
        });
    });
    describe("propose", () => {
        let marketplaceAddress: string;
        let nftContractAddress: string;
        let nftId: number;
        let nftPrice: BN | string;

        let targets: string[];
        let values: number[];
        let signatures: string[];
        let calldatas: string[];

        beforeEach(async () => {
            marketplaceAddress = testNftMarketplace.address;
            nftContractAddress = testNftMarketplace.address;
            nftId = 2;

            nftPrice = await testNftMarketplace.getPrice(
                nftContractAddress,
                nftId
            );

            nftPrice = ethers.utils.formatEther(nftPrice);

            targets = [marketplaceAddress];
            values = [Number(nftPrice)];
            signatures = ["buy(address,uint256)"];
            calldatas = [
                ethers.utils.defaultAbiCoder.encode(
                    ["address", "uint256"],
                    [alice.address, 22]
                ),
            ];
        });

        it("should revert if sender if not a member", async () => {
            await expect(
                collector.propose(targets, values, signatures, calldatas)
            ).to.be.revertedWith("Collector::onlyMember: user is not a member");
        });

        it("should revert if incorrect information arity", async () => {
            await collector.buyMembership({
                value: ethers.utils.parseEther("1"),
            });

            values = [];
            await expect(
                collector.propose(targets, values, signatures, calldatas)
            ).to.be.revertedWith(
                "Collector::propose: proposal function arguments mismatch"
            );
        });

        it("should revert if no targets", async () => {
            await collector.buyMembership({
                value: ethers.utils.parseEther("1"),
            });

            targets = [];
            await expect(
                collector.propose(targets, values, signatures, calldatas)
            ).to.be.revertedWith("Collector::propose: please provide actions");
        });
        it("should revert if targets > proposalMaxOperations", async () => {
            await collector.buyMembership({
                value: ethers.utils.parseEther("1"),
            });

            targets = [
                marketplaceAddress,
                marketplaceAddress,
                marketplaceAddress,
                marketplaceAddress,
                marketplaceAddress,
                marketplaceAddress,
                marketplaceAddress,
                marketplaceAddress,
                marketplaceAddress,
                marketplaceAddress,
                marketplaceAddress,
            ];
            await expect(
                collector.propose(targets, values, signatures, calldatas)
            ).to.be.revertedWith("Collector::propose: too many actions");
        });
        it("should emit Proposal Created event if successful", async () => {
            await collector.buyMembership({
                value: ethers.utils.parseEther("1"),
            });

            const tx = await collector.propose(
                targets,
                values,
                signatures,
                calldatas
            );

            const startBlock = (await ethers.provider.getBlockNumber()) + 6455;
            const endBlock = startBlock + 17289;

            expect(tx)
                .to.emit(collector, "ProposalCreated")
                .withArgs(
                    1,
                    deployer.address,
                    targets,
                    values,
                    signatures,
                    calldatas,
                    startBlock,
                    endBlock
                );
        });
    });

    describe("executeTransaction and execute", () => {
        let marketplaceAddress: string;
        let nftContractAddress: string;
        let nftId: number;
        let nftPrice: BN | string;

        let target: string;
        let value: number;
        let signature: string;
        let data: string;

        const validProposal = async () => {
            const marketplaceAddress = testNftMarketplace.address;
            const nftContractAddress = alice.address;
            const nftId = 2;

            const nftPrice = await testNftMarketplace.getPrice(
                nftContractAddress,
                nftId
            );

            await collector.buyMembership({
                value: ethers.utils.parseEther("1"),
            });
            await collector.connect(alice).buyMembership({
                value: ethers.utils.parseEther("1"),
            });
            await collector.connect(bob).buyMembership({
                value: ethers.utils.parseEther("1"),
            });
            await collector.connect(charlie).buyMembership({
                value: ethers.utils.parseEther("1"),
            });
            await collector.connect(dan).buyMembership({
                value: ethers.utils.parseEther("1"),
            });

            await collector.proposeNft(
                marketplaceAddress,
                nftContractAddress,
                nftId
            );
        };

        beforeEach(async () => {
            marketplaceAddress = testNftMarketplace.address;
            nftContractAddress = testNftMarketplace.address;
            nftId = 2;

            nftPrice = await testNftMarketplace.getPrice(
                nftContractAddress,
                nftId
            );

            nftPrice = ethers.utils.formatEther(nftPrice);

            target = marketplaceAddress;
            value = Number(nftPrice);
            signature = "buy(address,uint256)";
            data = ethers.utils.defaultAbiCoder.encode(
                ["address", "uint256"],
                [alice.address, 22]
            );
            // data = "test";
        });

        it("should succeed with valid args", async () => {
            await collector.buyMembership({
                value: ethers.utils.parseEther("1"),
            });

            target = marketplaceAddress;
            await expect(
                collector.executeTransaction(target, value, signature, data)
            ).to.not.be.reverted;
        });
        it("should emit ExecuteTransaction with valid args", async () => {
            await collector.buyMembership({
                value: ethers.utils.parseEther("1"),
            });

            target = marketplaceAddress;
            const tx = await collector.executeTransaction(
                target,
                value,
                signature,
                data
            );

            expect(tx).to.emit(collector, "ExecuteTransaction");
        });
        it("should revert execute if called with wrong proposalId", async () => {
            await collector.buyMembership({
                value: ethers.utils.parseEther("1"),
            });

            target = marketplaceAddress;
            const tx = collector.execute(1);

            await expect(tx).to.be.revertedWith(
                "Collector::execute: Proposal does not exist"
            );
        });
        it("should not revert with 'Proposal does not exist' if called with right proposalId", async () => {
            target = marketplaceAddress;

            await validProposal();
            const tx = collector.execute(1);

            await expect(tx).to.be.revertedWith("Only succeeded proposals!");
        });
    });

    describe("state", () => {
        let proposalId: number;

        const validProposal = async () => {
            const marketplaceAddress = testNftMarketplace.address;
            const nftContractAddress = testNftMarketplace.address;
            const nftId = 2;

            const nftPrice = await testNftMarketplace.getPrice(
                nftContractAddress,
                nftId
            );

            await collector.buyMembership({
                value: ethers.utils.parseEther("1"),
            });
            await collector.connect(alice).buyMembership({
                value: ethers.utils.parseEther("1"),
            });
            await collector.connect(bob).buyMembership({
                value: ethers.utils.parseEther("1"),
            });

            await collector.proposeNft(
                marketplaceAddress,
                nftContractAddress,
                nftId
            );
        };

        it("should revert if invalid proposal id", async () => {
            await expect(collector.state(0)).to.be.revertedWith(
                "Collector::state: invalid proposal id"
            );
        });

        it("should not revert if valid proposal id", async () => {
            await validProposal();
            await expect(collector.state(1)).to.not.be.revertedWith(
                "Collector::state: invalid proposal id"
            );
        });

        it("should return Pending state if current block <= startBlock", async () => {
            await validProposal();

            const startBlock = (await ethers.provider.getBlockNumber()) - 1;
            await ethers.provider.getBlock(startBlock);
            // const currentBlock = await ethers.provider.getBlockNumber();

            const state = await collector.state(1);

            expect(state).to.equal(0);
        });
        it("should return Active state if current block <= endBlock", async () => {
            await validProposal();

            const endBlock =
                (await ethers.provider.getBlockNumber()) + 1 + 17289;
            const timestamp = await ethers.provider.getBlock(endBlock + 1);

            const state = await collector.state(1);

            expect(state).to.equal(0);
        });
    });

    describe("castVoteBySig", () => {
        const createProposal = async () => {
            const testProposal = {
                targets: [testNftMarketplace.address],
                values: [ONE_ETHER],
                signatures: ["buy(address,uint256)"],
                calldatas: [
                    ethers.utils.defaultAbiCoder.encode(
                        ["address", "uint256"],
                        [alice.address, 22]
                    ),
                ],
            };

            await collector
                .connect(alice)
                .propose(
                    testProposal.targets,
                    testProposal.values,
                    testProposal.signatures,
                    testProposal.calldatas
                );
            return Number(1);
        };

        it("Allows anyone to submit a signed vote on a member's behalf", async () => {
            const buyMembershipTx = await collector
                .connect(alice)
                .buyMembership({
                    value: ONE_ETHER,
                });
            await buyMembershipTx.wait();

            const proposalId = await createProposal();

            const VOTE_OPTIONS = {
                YES: true,
                NO: false,
            };

            const domain = {
                name: await collector.name(),
                chainId: await collector.getChainId(),
                verifyingContract: collector.address,
            };

            const types = {
                Ballot: [
                    { name: "proposalId", type: "uint256" },
                    { name: "choice", type: "bool" },
                ],
            };

            const aliceVoteOption = VOTE_OPTIONS.YES;

            const vote = {
                proposalId: proposalId,
                choice: aliceVoteOption,
            };

            const signedAliceVote = await alice._signTypedData(
                domain,
                types,
                vote
            );

            const signature = signedAliceVote.substring(2);
            const r = "0x" + signature.substring(0, 64);
            const s = "0x" + signature.substring(64, 128);
            const v = parseInt(signature.substring(128, 130), 16);

            await collector
                .connect(alice)
                .castVoteBySig(proposalId, aliceVoteOption, v, r, s);

            const proposal = await collector
                .connect(alice)
                .proposals(proposalId);

            expect(proposal.voteCount).to.equal(1);
        });
    });
    describe("castVotesBySig", async () => {
        const createVote = async () => {
            const proposalId = await createProposal();

            const VOTE_OPTIONS = {
                YES: true,
                NO: false,
            };

            const domain = {
                name: await collector.name(),
                chainId: await collector.getChainId(),
                verifyingContract: collector.address,
            };

            const types = {
                Ballot: [
                    { name: "proposalId", type: "uint256" },
                    { name: "choice", type: "bool" },
                ],
            };

            const aliceVoteOption = VOTE_OPTIONS.YES;

            const vote = {
                proposalId: proposalId,
                choice: aliceVoteOption,
            };

            const signedAliceVote = await alice._signTypedData(
                domain,
                types,
                vote
            );
            const signedBobVote = await bob._signTypedData(domain, types, vote);
            const signedCharlieVote = await charlie._signTypedData(
                domain,
                types,
                vote
            );

            const signature = signedAliceVote.substring(2);
            const r = "0x" + signature.substring(0, 64);
            const s = "0x" + signature.substring(64, 128);
            const v = parseInt(signature.substring(128, 130), 16);

            const signatureBob = signedBobVote.substring(2);
            const r2 = "0x" + signatureBob.substring(0, 64);
            const s2 = "0x" + signatureBob.substring(64, 128);
            const v2 = parseInt(signatureBob.substring(128, 130), 16);

            const signatureChalie = signedCharlieVote.substring(2);
            const r3 = "0x" + signatureChalie.substring(0, 64);
            const s3 = "0x" + signatureChalie.substring(64, 128);
            const v3 = parseInt(signatureChalie.substring(128, 130), 16);

            return {
                r,
                s,
                v,
                r2,
                s2,
                v2,
                r3,
                s3,
                v3,
                proposalId,
                aliceVoteOption,
            };
        };

        const createProposal = async () => {
            const testProposal = {
                targets: [testNftMarketplace.address],
                values: [ONE_ETHER],
                signatures: ["buy(address,uint256)"],
                calldatas: [
                    ethers.utils.defaultAbiCoder.encode(
                        ["address", "uint256"],
                        [alice.address, 22]
                    ),
                ],
            };

            await collector
                .connect(alice)
                .propose(
                    testProposal.targets,
                    testProposal.values,
                    testProposal.signatures,
                    testProposal.calldatas
                );
            return Number(1);
        };

        it("castVotesBySig works correctly", async () => {
            const buyMembershipTx = await collector
                .connect(alice)
                .buyMembership({
                    value: ONE_ETHER,
                });
            await buyMembershipTx.wait();
            const buyMembershipTx2 = await collector
                .connect(bob)
                .buyMembership({
                    value: ONE_ETHER,
                });
            await buyMembershipTx2.wait();
            const buyMembershipTx3 = await collector
                .connect(charlie)
                .buyMembership({
                    value: ONE_ETHER,
                });
            await buyMembershipTx3.wait();

            const {
                r,
                s,
                v,
                r2,
                s2,
                v2,
                r3,
                s3,
                v3,
                proposalId,
                aliceVoteOption,
            } = await createVote();

            await collector
                .connect(alice)
                .castVotesBySig(
                    [proposalId, proposalId, proposalId],
                    [aliceVoteOption, aliceVoteOption, aliceVoteOption],
                    [v, v2, v3],
                    [r, r2, r3],
                    [s, s2, s3]
                );

            const proposal = await collector
                .connect(alice)
                .proposals(proposalId);

            expect(proposal.voteCount).to.equal(3);
        });

        it("must have at least one proposal in array", async () => {
            await expect(
                collector.castVotesBySig([], [], [], [], [])
            ).to.be.revertedWith("proposal is required");
        });

        it("proposals and choices array must be same length", async () => {
            const buyMembershipTx = await collector
                .connect(alice)
                .buyMembership({
                    value: ONE_ETHER,
                });
            await buyMembershipTx.wait();

            const proposalId = await createProposal();

            await expect(
                collector.castVotesBySig([proposalId], [], [], [], [])
            ).to.be.revertedWith("incorrect vote cast");
        });

        it("proposals and varr array must be same length", async () => {
            const buyMembershipTx = await collector
                .connect(alice)
                .buyMembership({
                    value: ONE_ETHER,
                });
            await buyMembershipTx.wait();

            const proposalId = await createProposal();
            await expect(
                collector.castVotesBySig(
                    [proposalId, proposalId],
                    [true, false],
                    [],
                    [],
                    []
                )
            ).to.be.revertedWith("incorrect varr length");
        });

        it("proposals and rarr array must be same length", async () => {
            const buyMembershipTx = await collector
                .connect(alice)
                .buyMembership({
                    value: ONE_ETHER,
                });
            await buyMembershipTx.wait();

            const { r, s, v, proposalId, aliceVoteOption } = await createVote();
            await expect(
                collector.castVotesBySig(
                    [proposalId, proposalId],
                    [true, false],
                    [v, v],
                    [],
                    []
                )
            ).to.be.revertedWith("incorrect rarr length");
        });
        it("proposals and sarr array must be same length", async () => {
            const buyMembershipTx = await collector
                .connect(alice)
                .buyMembership({
                    value: ONE_ETHER,
                });
            await buyMembershipTx.wait();

            const { r, s, v, proposalId, aliceVoteOption } = await createVote();
            await expect(
                collector.castVotesBySig(
                    [proposalId, proposalId],
                    [true, false],
                    [v, v],
                    [r, r],
                    []
                )
            ).to.be.revertedWith("incorrect sarr length");
        });
        it("proposals and sarr array must be same length", async () => {
            const buyMembershipTx = await collector
                .connect(alice)
                .buyMembership({
                    value: ONE_ETHER,
                });
            await buyMembershipTx.wait();

            const { r, s, v, proposalId, aliceVoteOption } = await createVote();
            await expect(
                collector.castVotesBySig(
                    [proposalId, proposalId],
                    [true, false],
                    [v, v],
                    [r, r],
                    [s, s]
                )
            ).to.not.be.revertedWith("incorrect sarr length");
        });
    });
});
