//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

interface INftMarketplace {
    function getPrice(address nftContract, uint256 nftId)
        external
        returns (uint256 price);

    function buy(address nftContract, uint256 nftId)
        external
        payable
        returns (bool success);
}

contract TestNftMarketplace is INftMarketplace {
    function getPrice(address, uint256)
        external
        pure
        override
        returns (uint256 price)
    {
        price = 3 ether;
    }

    function buy(address, uint256)
        external
        payable
        override
        returns (bool success)
    {
        return true;
    }
}
