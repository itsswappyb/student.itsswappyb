//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract SpaceCoinToken is ERC20 {
    address public owner;
    address public treasury;
    uint256 public constant MULTIPLIER = 10**18;
    uint256 public maxMintAmount;
    bool public isTaxed;

    constructor(uint256 initialSupply, address _treasury) ERC20("Space Coin Token", "SPC") {
        _mint(msg.sender, initialSupply * MULTIPLIER);
        owner = msg.sender;
        maxMintAmount = initialSupply;
        treasury = _treasury;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can do this");
        _;
    }

    function transfer(address to, uint256 amount) public override returns (bool) {
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

    function toggleTax() public onlyOwner {
        isTaxed = !isTaxed;
    }
}
