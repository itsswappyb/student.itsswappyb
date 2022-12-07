//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "hardhat/console.sol";

contract Project is ERC721 {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    uint256 public goalAmount;
    address public creatorAddress;
    uint256 public noOfContributors;
    uint256 public deadline; // timestamp that equates to 30 days from start date
    uint256 public raisedAmount;
    uint256 public minimumContribution;
    mapping(address => uint256) public contributions;
    bool public isCancelled;

    event ContributionMade(address, uint256);
    event RefundReceived(address, uint256);
    event WithdrawMade(address, uint256);
    event ProjectCancelled();

    constructor(uint256 _goalAmount, address payable _creator)
        ERC721("Project", "PROJ")
    {
        goalAmount = _goalAmount;
        creatorAddress = _creator;
        deadline = block.timestamp + 30 days; // block timestamp + 30 days in seconds
        minimumContribution = 0.01 ether;

        console.log("Project created with goal amount: %s", goalAmount);
    }

    function isExpired() public view returns (bool) {
        return block.timestamp > deadline;
    }

    function isActive() public view returns (bool) {
        // require(!isExpired(), "Project is expired");
        // require(raisedAmount <= goalAmount, "Project has reached its goal");
        // return true;

        return !isExpired() && !isCancelled && raisedAmount <= goalAmount;
    }

    function contribute() external payable {
        uint256 balance = address(this).balance;
        uint256 previousBalance = balance - msg.value;
        bool isFunded;
        require(
            msg.value >= 0.1 ether,
            "Contribution must be 0.1 ETH or greater"
        );
        require(raisedAmount <= goalAmount, "Project has reached its goal");
        require(balance >= minimumContribution, "Insufficient balance!");
        require(isExpired() == false, "Project has ended");
        require(previousBalance < goalAmount, "Project has reached its goal");

        uint256 previousContribution = contributions[msg.sender];
        uint256 contributorBadge = (msg.value +
            (previousContribution % 1 ether)) / 1 ether;

        contributions[msg.sender] += msg.value;
        raisedAmount += msg.value;
        noOfContributors += 1;

        if (balance >= goalAmount && raisedAmount >= goalAmount) {
            isFunded = true;
        }

        emit ContributionMade(msg.sender, msg.value);

        // bool shouldReceiveBadge = ((previousContribution + msg.value) >=
        //     1 ether);
        // if (shouldReceiveBadge) {
        //     _mintNft(msg.sender, contributorBadge);
        // }

        uint256 i;
        for (i = contributorBadge; i != 0; i--) {
            _mintNft(msg.sender);
        }
    }

    function _mintNft(address _to) internal {
        uint256 newItemId = _tokenIds.current();
        _mint(_to, newItemId);
        _tokenIds.increment();
    }

    function transferBadge(address _to, uint256 _tokenId) external {
        address badgeOwner = ownerOf(_tokenId);
        require(
            badgeOwner == msg.sender,
            "Only the badge owner can transfer it"
        );
        safeTransferFrom(badgeOwner, _to, _tokenId);
    }

    function withdraw(uint256 amount) external {
        bool isFunded = raisedAmount >= goalAmount;
        bool isFailed = isExpired() && isFunded;
        uint256 balance = address(this).balance;

        require(
            msg.sender == creatorAddress,
            "Only the creator can withdraw funds"
        );
        require(!isFailed, "Project has ended");
        require(isFunded, "Project has not reached its goal");
        require(!isCancelled, "Project has been cancelled");

        require(balance >= amount, "You have no outstanding funds");

        (bool sent, ) = payable(msg.sender).call{value: amount}("");

        if (sent) {
            emit WithdrawMade(msg.sender, amount);
        }
    }

    function cancelProject() public {
        require(!isExpired(), "Can't cancel project after deadline");
        require(
            msg.sender == creatorAddress,
            "Only creator can cancel project"
        );

        isCancelled = true;

        emit ProjectCancelled();
    }

    function refund() external {
        bool isFunded = raisedAmount >= goalAmount;
        require(
            isCancelled || (!isFunded && isExpired()),
            "Not eligible for refund"
        );
        uint256 balance = contributions[msg.sender];
        require(balance > 0, "You have no outstanding funds");
        contributions[msg.sender] = 0;
        (bool success, ) = payable(msg.sender).call{value: balance}("");
        if (success) {
            emit RefundReceived(msg.sender, balance);
        }
    }
}
