//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import "./SpaceCoinToken.sol";
import "./Pool.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SpaceRouter {
    address public spcToken;
    address public pool;

    // and use it in the constructor
    constructor(address _spcToken, address _pool) {
        spcToken = _spcToken;
        pool = _pool;
    }

    // events
    event AddLiquidity(address, uint256, uint256);
    event RemoveLiquidity(address, uint256, uint256);
    event Swap(address, uint256, uint256);

    receive() external payable {}

    // helper function
    function getSpcReserve() public view returns (uint256) {
        return SpaceCoinToken(spcToken).balanceOf(pool);
    }

    // Adds to liquidity pool
    function addLiquidity(uint256 amount) public payable returns (uint256) {
        uint256 liquidity;
        Pool _pool = Pool(pool);
        uint256 ethBalance = address(_pool).balance;
        uint256 spcReserve = getSpcReserve();
        SpaceCoinToken _spcToken = SpaceCoinToken(spcToken);
        uint256 ethAmountToAdd = msg.value;
        uint256 spcAmountToAdd;

        // if no reserves exist
        if (spcReserve == 0) {
            // transfer spc from the user to the contract
            _spcToken.transferFrom(msg.sender, address(_pool), amount);
            (bool success, ) = address(_pool).call{value: msg.value}("");
            require(success, "addLiquidity: transfer eth failed");
            // LP tokens = ethBalance since liquidity provided = ethBalance for first addition
            // proportionate LP tokens to eth provided
            liquidity = ethBalance;
            _pool.mint(msg.sender, liquidity);
        }
        // if reserves exist
        else {
            uint256 ethReserve = ethBalance - ethAmountToAdd;

            // based on formula dy = y * dx / x
            // x = ethReserve
            // y = spcReserve
            // dx = eth amount in
            // dy = spc amount out
            spcAmountToAdd = (spcReserve * ethAmountToAdd) / ethReserve;

            require(
                amount >= spcAmountToAdd,
                "Insufficient liquidity provided"
            );

            // transfer spc tokens to pool
            bool success = _spcToken.transferFrom(
                msg.sender,
                pool,
                spcAmountToAdd
            );
            require(success, "Failed to transfer spc tokens to pool");

            // transfer eth to pool
            (bool ethSuccess, ) = address(_pool).call{value: ethAmountToAdd}(
                ""
            );
            require(ethSuccess, "Failed to transfer eth to pool");

            liquidity = (_pool.totalSupply() * msg.value) / ethReserve;

            // mint liquidity to caller/liquidity provider
            _pool.mint(msg.sender, liquidity);
        }
        emit AddLiquidity(msg.sender, ethAmountToAdd, spcAmountToAdd);
        return liquidity;
    }

    // Removes liquidity from pool
    function removeLiquidity(uint256 amount) public returns (uint256, uint256) {
        require(amount > 0, "_amount should be greater than zero");
        Pool _pool = Pool(pool);
        uint256 ethReserve = address(_pool).balance;
        uint256 totalSupply = _pool.totalSupply();
        SpaceCoinToken _spcToken = SpaceCoinToken(spcToken);

        // (ethReserve * amount of LP tokens to withdraw) / (total LP tokens)
        uint256 ethAmount = (ethReserve * amount) / totalSupply;

        // (spcReserve * amount of LP tokens to withdraw) / (total LP tokens)
        uint256 spcTokenAmount = (getSpcReserve() * amount) / totalSupply;
        _pool.burn(msg.sender, amount);
        // send ethAmount from user/sender to pool
        (bool ethSuccess, ) = address(_pool).call{value: ethAmount}("");
        require(ethSuccess, "Failed to transfer eth to pool");
        // send spcTokens from the user to pool
        bool transferSuccess = _spcToken.transfer(
            address(_pool),
            spcTokenAmount
        );
        require(transferSuccess, "Failed to transfer spc tokens to pool");

        emit RemoveLiquidity(msg.sender, ethAmount, spcTokenAmount);
        return (ethAmount, spcTokenAmount);
    }

    // Swaps eth for spc
    function swapEthForSpc(uint256 minAmount) public payable {
        uint256 slippageNumerator = 10;
        uint256 slippageDenominator = 10**3;
        uint256 slippageTolerance = slippageNumerator / slippageDenominator;

        uint256 tokenReserve = getSpcReserve();
        Pool _pool = Pool(pool);
        SpaceCoinToken _spcToken = SpaceCoinToken(spcToken);

        uint256 tokensBought = _pool.getTokensAmount(
            msg.value,
            address(pool).balance - msg.value,
            tokenReserve
        );

        require(
            tokensBought >= ((1 - slippageTolerance) * minAmount),
            "insufficient output amount"
        );
        // send spc to user/caller
        bool success = _spcToken.transfer(msg.sender, tokensBought);
        require(success, "Failed to transfer spc tokens to user");

        emit Swap(msg.sender, msg.value, tokensBought);
    }

    // Swaps spc for eth
    function swapSpcForEth(uint256 tokensSold, uint256 minEthAmount) public {
        uint256 slippageNumerator = 10;
        uint256 slippageDenominator = 10**3;
        uint256 slippageTolerance = slippageNumerator / slippageDenominator;

        uint256 tokenReserve = getSpcReserve();
        Pool _pool = Pool(pool);
        SpaceCoinToken _spcToken = SpaceCoinToken(spcToken);
        uint256 ethBought = _pool.getTokensAmount(
            tokensSold,
            tokenReserve,
            address(_pool).balance
        );
        require(
            ethBought >= ((1 - slippageTolerance) * minEthAmount),
            "insufficient output amount"
        );
        // transfer spc from user to pool
        bool transferSuccess = _spcToken.transferFrom(
            msg.sender,
            address(_pool),
            tokensSold
        );
        // send eth to user/caller
        (bool ethSuccess, ) = address(_pool).call{value: ethBought}("");
        require(ethSuccess, "Failed to transfer eth to pool");

        emit Swap(msg.sender, tokensSold, ethBought);
    }
}
