//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./SpaceRouter.sol";
import "./SpaceCoinICO.sol";


contract SpaceCoinToken is ERC20 {
    address public tokenOwner;
    address public treasury;
    uint256 public constant MULTIPLIER = 10**18;
    uint256 public maxMintAmount;
    bool public isTaxed;

    constructor(uint256 initialSupply, address _treasury)
        ERC20("Space Coin Token", "SPC")
    {
        _mint(msg.sender, initialSupply * MULTIPLIER);
        maxMintAmount = initialSupply;
        tokenOwner = msg.sender;
        treasury = _treasury;
    }

    modifier onlyTokenOwner {
        require(msg.sender == tokenOwner);
        _;
    }

    modifier onlyTreasury() {
        require(msg.sender == treasury, "Only the treasury can do this");
        _;
    }

    function transfer(address to, uint256 amount)
        public
        override
        returns (bool)
    {
        // deduct tax from the amount
        if (isTaxed == true) {
            uint256 tax = (amount * 2) / 100;
            amount -= tax;
            _transfer(msg.sender, treasury, tax);
        }

        // transfer the tokens
        _transfer(msg.sender, to, amount);
        return true;
    }

    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) public virtual override returns (bool) {
        address spender = _msgSender();
        _spendAllowance(from, spender, amount);
        transfer(to, amount);
        return true;
    }

    function toggleTax() public onlyTokenOwner {
        isTaxed = !isTaxed;
    }
}
