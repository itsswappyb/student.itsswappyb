//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import "./SpaceCoinToken.sol";

contract SpaceCoinICO {
    address public admin;
    uint256 public goalAmount = 30_000 ether;
    uint256 public totalAmountRaised;
    uint256 public tokenPrice = 5;

    SpaceCoinToken public spacecoinToken;

    mapping(address => uint256) public contributions;
    mapping(address => uint256) public tokensToReward;

    bool public isPaused;

    mapping(address => bool) public isWhitelisted;

    // Phases
    enum Phase {
        Seed,
        General,
        Open
    }
    Phase public icoPhase;

    constructor(address _treasury) {
        admin = msg.sender;
        icoPhase = Phase.Seed;
        spacecoinToken = new SpaceCoinToken(500000, _treasury);
    }

    event Invest(address investor, uint256 amount);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can do this");
        _;
    }

    function pauseIco() public onlyAdmin {
        isPaused = true;
    }

    function resumeIco() public onlyAdmin {
        isPaused = false;
    }

    function addToWhitelist(address payable[] memory _addresses) public onlyAdmin returns (bool success) {
        for (uint256 i = 0; i < _addresses.length; i++) {
            require(isWhitelisted[_addresses[i]] == false, "Address is already whitelisted");
            isWhitelisted[_addresses[i]] = true;
        }
        return true;
    }

    function isAddressWhitelisted(address payable _address) public view returns (bool) {
        return isWhitelisted[_address];
    }

    function claimSpaceTokens() public {
        require(icoPhase == Phase.Open, "ICO is not open");
        require(tokensToReward[msg.sender] > 0, "You have no contributions");

        spacecoinToken.transfer(msg.sender, tokensToReward[msg.sender]);
        tokensToReward[msg.sender] = 0;
    }

    function movePhase(Phase _currentPhase) public onlyAdmin {
        require(_currentPhase == icoPhase, "Incorrect current phase!");
        if (_currentPhase == Phase.Seed) {
            icoPhase = Phase.General;
        } else if (_currentPhase == Phase.General) {
            icoPhase = Phase.Open;
        } else {
            revert("Cannot move to next phase");
        }
    }

    function totalContributionLimit() public view returns (uint256) {
        if (icoPhase == Phase.Seed) {
            return 15_000 ether;
        }

        return 30_000 ether;
    }

    function individualContributionLimit() public view returns (uint256) {
        if (icoPhase == Phase.Seed) {
            return 1_500 ether;
        }

        if (icoPhase == Phase.General) {
            return 1_000 ether;
        }

        return 30_000 ether;
    }

    function canInvest() internal returns (bool) {
        bool isIndividualLimitExceeded = contributions[msg.sender] + msg.value > individualContributionLimit();
        bool isGoalLimitExceeded = totalAmountRaised + msg.value > totalContributionLimit();

        return !isIndividualLimitExceeded && !isGoalLimitExceeded;
    }

    function invest() public payable returns (bool) {
        require(isPaused == false, "ICO is paused");
        require(msg.value > 0, "Contribution must be greater than 0");
        require(canInvest(), "Limit reached!");

        if (icoPhase == Phase.Seed) {
            require(isAddressWhitelisted(payable(msg.sender)), "Only whitelisted addresses can invest in the seed phase");
        }

        totalAmountRaised += msg.value;
        contributions[msg.sender] += msg.value;
        tokensToReward[msg.sender] += msg.value * tokenPrice;

        emit Invest(msg.sender, msg.value);

        return true;
    }

    receive() external payable {
        invest();
    }
}
