//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import "./SpaceRouter.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Pool is ERC20, Ownable {
    address public spcToken;
    SpaceRouter public spacecoinRouter;
    uint256 public constant MINIMUM_LIQUIDITY = 10**3;

    // we are not setting an initialSupply in order to have an infinite LP token
    // supply that is minted every time liquidity is provided
    constructor(address _spcToken) ERC20("LP Token", "LPT") {
        // ensure the provided address is not the zero address
        require(_spcToken != address(0), "_spcToken is zero address");
        spcToken = _spcToken;
        spacecoinRouter = new SpaceRouter(spcToken, address(this));
        // lock this amount of LP tokens to reduce the risk of the pool being emptied
        _mint(address(0x1), MINIMUM_LIQUIDITY);
    }

    // events
    event Mint(address, uint256);
    event Burn(address, uint256);

    modifier onlyRouter() {
        require(
            msg.sender == address(spacecoinRouter),
            "Only the router can do this"
        );
        _;
    }

    // mint
    function mint(address account, uint256 amount) external onlyRouter {
        _mint(account, amount);
        emit Mint(msg.sender, amount);
    }

    // burn
    function burn(address account, uint256 amount) external onlyRouter {
        _burn(account, amount);
        emit Burn(msg.sender, amount);
    }

    // The amount of tokens returned to the user in the swap
    function getTokensAmount(
        uint256 inputAmount,
        uint256 inputReserve,
        uint256 outputReserve
    ) public pure returns (uint256) {
        require(inputReserve > 0 && outputReserve > 0, "invalid reserves");

        // accounting for 1% fee
        uint256 inputAmountWithFee = (inputAmount * 99);

        // calculating return amount as per formula dy = (y * dx) / (x + dx)
        // dy = tokens to receive
        uint256 numerator = inputAmountWithFee * outputReserve;
        uint256 denominator = (inputReserve * 100) + inputAmountWithFee;
        return numerator / denominator;
    }
}
