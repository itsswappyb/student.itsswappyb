//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

interface NftMarketplace {
    function getPrice(address nftContract, uint256 nftId)
        external
        returns (uint256 price);

    function buy(address nftContract, uint256 nftId)
        external
        payable
        returns (bool success);
}

contract Collector {
    struct Proposal {
        uint256 id; // id of the proposal
        address proposer; // address that created the proposal
        address[] targets; // target addresses for calls to be made
        uint256[] values; // values to for calls to be made
        string[] signatures; // function signatures to be called
        bytes[] calldatas; // calldatas to be called
        uint256 voteCount; // number of votes accumulated
        uint256 yesVotes; // number of votes in favour of proposal
        uint256 noVotes; // nunber of votes against proposal
        uint256 startBlock; // The block at which voting begins
        uint256 endBlock; // The block at which voting ends
        bool executed; // if proposal has been executed
        mapping(address => Receipt) receipts; // records who has voted for this proposal
        uint256 proposalMemberCount;
    }

    struct Receipt {
        bool choice; // true for yes, false for no
        bool hasVoted; // true if has voted
    }

    mapping(address => bool) public isMember; // if user is a member and allowed to vote/propose

    // possible proposal states
    enum ProposalState {
        Pending,
        Active,
        Defeated,
        Succeeded,
        Executed
    }

    string public constant name = "Collector DAO";

    address public admin;

    mapping(uint256 => Proposal) public proposals;

    uint256 public proposalCount; // the total number of proposals

    uint256 public totalMemberCount; // to the total number of members

    uint256 public constant proposalMaxOperations = 10; // the max number of actions per proposal

    uint256 public constant votingDelay = 6455; // 1 day delay in blocks before voting starts

    uint256 public constant votingPeriod = 17289; // 3 days in blocks at 15s per block

    // EIP-712 typehash for the contract's domain
    bytes32 public constant DOMAIN_TYPEHASH =
        keccak256(
            "EIP712Domain(string name,uint256  chainId,address verifyingContract)"
        );

    // EIP-712 typehash for the ballot struct used by the contract
    bytes32 public constant BALLOT_TYPEHASH =
        keccak256("Ballot(uint256 proposalId,bool choice)");

    // Events
    event ProposalCreated(
        uint256 id,
        address proposer,
        address[] targets,
        uint256[] values,
        string[] signatures,
        bytes[] calldatas,
        uint256 startBlock,
        uint256 endBlock
    );

    event VoteCast(address voter, uint256 proposalId, bool choice);

    event ProposalExecuted(uint256 id);

    event ExecuteTransaction(
        bytes32 indexed txHash,
        address indexed target,
        uint256 value,
        string signature,
        bytes data
    );

    constructor() {
        admin = msg.sender;
    }

    modifier onlyMember() {
        require(
            isMember[msg.sender] == true,
            "Collector::onlyMember: user is not a member"
        );
        _;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "Collector::onlyAdmin: user is not admin");
        _;
    }

    // allow user to buy membership to DAO
    function buyMembership() external payable {
        uint256 amount = msg.value;
        require(
            amount == 1 ether,
            "Collector::buyMembership: membership is 1 ether"
        );
        require(
            isMember[msg.sender] == false,
            "Collector::buyMembership: user is already a member"
        );

        isMember[msg.sender] = true;
        totalMemberCount++;
    }

    // receiver function for safeTransferFrom as per IERC721Receiver
    function onERC721Received(
        address,
        address,
        uint256,
        bytes memory
    ) public virtual returns (bytes4) {
        return this.onERC721Received.selector;
    }

    function proposeNft(
        address marketplace,
        address nftContract,
        uint256 nftId
    ) external payable onlyMember {
        NftMarketplace nftmarketplace = NftMarketplace(marketplace);
        uint256 nftPrice = nftmarketplace.getPrice(nftContract, nftId);
        // to set a ceiling of +10% of the nftPrice so that seller of NFT can't manipulate price
        uint256 maxNftPriceNumerator = nftPrice * 110;
        uint256 maxNftPriceDenominator = maxNftPriceNumerator / 100;
        uint256 maxNftPrice = maxNftPriceNumerator / maxNftPriceDenominator;
        require(
            address(this).balance >= nftPrice &&
                address(this).balance >= maxNftPrice,
            "Collector::buy: Insufficient treasury funds"
        );

        address[] memory _targets = new address[](1);
        _targets[0] = marketplace;
        uint256[] memory _values = new uint256[](1);
        _values[0] = nftPrice;
        string[] memory _signatures = new string[](1);
        _signatures[0] = "buy(address,uint256)";
        bytes[] memory _calldatas = new bytes[](1);
        _calldatas[0] = abi.encode(marketplace, nftId);

        propose(_targets, _values, _signatures, _calldatas);
    }

    function propose(
        address[] memory targets,
        uint256[] memory values,
        string[] memory signatures,
        bytes[] memory calldatas
    ) public onlyMember {
        require(
            targets.length != 0,
            "Collector::propose: please provide actions"
        );
        require(
            targets.length <= proposalMaxOperations,
            "Collector::propose: too many actions"
        );
        require(
            targets.length == values.length &&
                targets.length == signatures.length &&
                targets.length == calldatas.length,
            "Collector::propose: proposal function arguments mismatch"
        );

        uint256 startBlock = block.number + votingDelay;
        uint256 endBlock = startBlock + votingPeriod;

        proposalCount += 1;
        uint256 proposalId = proposalCount;
        Proposal storage newProposal = proposals[proposalId];
        // check for collision
        require(newProposal.id == 0, "Collector::propose: ProposalID collsion");
        newProposal.id = proposalId;
        newProposal.proposer = msg.sender;
        newProposal.targets = targets;
        newProposal.values = values;
        newProposal.signatures = signatures;
        newProposal.calldatas = calldatas;
        newProposal.startBlock = startBlock;
        newProposal.endBlock = endBlock;
        newProposal.yesVotes = 0;
        newProposal.noVotes = 0;
        newProposal.executed = false;
        newProposal.proposalMemberCount = totalMemberCount;

        emit ProposalCreated(
            newProposal.id,
            msg.sender,
            targets,
            values,
            signatures,
            calldatas,
            startBlock,
            endBlock
        );
    }

    function executeTransaction(
        address target,
        uint256 value,
        string memory signature,
        bytes memory data
    ) public onlyAdmin returns (bytes memory) {
        bytes32 txHash = keccak256(abi.encode(target, value, signature, data));

        bytes memory callData;

        if (bytes(signature).length == 0) {
            callData = data;
        } else {
            callData = abi.encodePacked(
                bytes4(keccak256(bytes(signature))),
                data
            );
        }

        (bool success, bytes memory returnData) = target.call{value: value}(
            callData
        );
        require(
            success,
            "Collector::executeTransaction: Transaction execution reverted."
        );

        emit ExecuteTransaction(txHash, target, value, signature, data);

        return returnData;
    }

    function execute(uint256 proposalId) public onlyAdmin {
        uint256 _proposalId = proposals[proposalId].id;
        require(_proposalId > 0, "Collector::execute: Proposal does not exist");
        require(
            state(_proposalId) == ProposalState.Succeeded,
            "Only succeeded proposals!"
        );

        Proposal storage proposal = proposals[proposalId];

        //check to see if quorum of 25% is met and has a simple majority
        bool hasQuorum = proposal.proposalMemberCount * 4 >= totalMemberCount &&
            proposal.yesVotes * 10 > (proposal.voteCount * 10) / 2;

        require(hasQuorum, "Collector::execute: Quorum not met");
        proposal.executed = true;
        for (uint256 i = 0; i < proposal.targets.length; i++) {
            executeTransaction(
                proposal.targets[i],
                proposal.values[i],
                proposal.signatures[i],
                proposal.calldatas[i]
            );
        }
        emit ProposalExecuted(proposalId);
    }

    function state(uint256 proposalId) public view returns (ProposalState) {
        require(
            proposalCount >= proposalId && proposalId > 0,
            "Collector::state: invalid proposal id"
        );
        Proposal storage proposal = proposals[proposalId];
        bool hasQuorum = proposal.proposalMemberCount * 4 >= totalMemberCount;

        if (block.number <= proposal.startBlock) {
            return ProposalState.Pending;
        }
        if (block.number <= proposal.endBlock) {
            return ProposalState.Active;
        }
        if (proposal.yesVotes <= proposal.noVotes || !hasQuorum) {
            return ProposalState.Defeated;
        }
        if (proposal.executed) {
            return ProposalState.Executed;
        }
        return ProposalState.Succeeded;
    }

    function _castVote(
        address voter,
        uint256 proposalId,
        bool choice
    ) internal {
        ProposalState currentState = state(proposalId);
        require(
            currentState == ProposalState.Active ||
                currentState == ProposalState.Succeeded ||
                currentState == ProposalState.Pending,
            "Collector::_castVote: voting is closed"
        );

        Proposal storage proposal = proposals[proposalId];
        Receipt storage receipt = proposal.receipts[voter];
        require(
            receipt.hasVoted == false,
            "Collector::_castVote: already voted"
        );

        if (choice) {
            proposal.yesVotes++;
        } else {
            proposal.noVotes++;
        }
        proposal.voteCount++;

        receipt.choice = choice;
        receipt.hasVoted = true;

        emit VoteCast(voter, proposalId, choice);
    }

    function castVoteBySig(
        uint256 proposalId,
        bool choice,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public {
        bytes32 domainSeparator = keccak256(
            abi.encode(
                DOMAIN_TYPEHASH,
                keccak256(bytes(name)),
                getChainId(),
                address(this)
            )
        );
        bytes32 structHash = keccak256(
            abi.encode(BALLOT_TYPEHASH, proposalId, choice)
        );
        bytes32 digest = keccak256(
            abi.encodePacked("\x19\x01", domainSeparator, structHash)
        );
        address signatory = ecrecover(digest, v, r, s);

        require(
            signatory != address(0),
            "Collector::castVoteBySig: invalid signature"
        );
        return _castVote(signatory, proposalId, choice);
    }

    function castVotesBySig(
        uint256[] memory proposalIds,
        bool[] memory choices,
        uint8[] memory varr,
        bytes32[] memory rarr,
        bytes32[] memory sarr
    ) external {
        require(proposalIds.length > 0, "proposal is required");
        require(proposalIds.length == choices.length, "incorrect vote cast");
        require(proposalIds.length == varr.length, "incorrect varr length");
        require(proposalIds.length == rarr.length, "incorrect rarr length");
        require(proposalIds.length == sarr.length, "incorrect sarr length");

        for (uint256 i = 0; i < proposalIds.length; i++) {
            castVoteBySig(
                proposalIds[i],
                choices[i],
                varr[i],
                rarr[i],
                sarr[i]
            );
        }
    }

    // Helpers to verify signature
    function splitSignature(bytes memory sig)
        internal
        pure
        returns (
            bytes32 r,
            bytes32 s,
            uint8 v
        )
    {
        require(
            sig.length == 65,
            "Collector::bulkCastVote: invalid signature length"
        );

        assembly {
            // first 32 bytes, after the length prefix
            r := mload(add(sig, 32))
            // second 32 bytes
            s := mload(add(sig, 64))
            // final byte (first byte of the next 32 bytes)
            v := byte(0, mload(add(sig, 96)))
        }
    }

    function verify(
        address _signer,
        string memory _message,
        bytes memory signature
    ) public pure returns (bool) {
        bytes32 messageHash = getMessageHash(_message);
        bytes32 ethSignedMessageHash = getEthSignedMessageHash(messageHash);

        return recoverSigner(ethSignedMessageHash, signature) == _signer;
    }

    function getMessageHash(string memory _message)
        public
        pure
        returns (bytes32)
    {
        return keccak256(abi.encodePacked(_message));
    }

    function getEthSignedMessageHash(bytes32 _messageHash)
        public
        pure
        returns (bytes32)
    {
        return
            keccak256(
                abi.encodePacked(
                    "\x19Ethereum Signed Message:\n32",
                    _messageHash
                )
            );
    }

    function recoverSigner(
        bytes32 _ethSignedMessageHash,
        bytes memory _signature
    ) public pure returns (address) {
        (bytes32 r, bytes32 s, uint8 v) = splitSignature(_signature);
        return ecrecover(_ethSignedMessageHash, v, r, s);
    }

    // Getter for the current chain id to make sure current chain id is correct
    function getChainId() public view returns (uint256) {
        return block.chainid;
    }
}
