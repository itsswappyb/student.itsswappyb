---
title: Micro-audit for Swapneel Bobba, LP project
author: Ryan Orban <@orban>
date: 7.1.2022
comment: Overall, great effort! Found a few vulnerabilities that could have been caught with more tests.
---
# Micro Peer Audit

## [H-1] User can add liquidity to the pool and receive LP tokens without depositing SPC

On line 44 of `SpaceRouter.sol`, you call `_spcToken.transferFrom(msg.sender, address(_pool), amount);` to transfer the required SPC tokens from the user to the pool, but you don't check the boolean returned to confirm that the transfer was successful. A malicious actor could call `addLiquidity` and simply send in ETH while maintaining a zero balance of SPC in their account. In fact, you override the `transferFrom` function in `SpaceCoinToken.sol` to always return true, even if the allowance and transfer transactions fail.
Consider: Remove your overridden `transferFrom` function or add sufficient checks to make it safe. Also store the boolean returned from `transferFrom` and add a `require` statement to confirm the transfer succeeded.

## [H-1] User can use `swapSpcForEth` to drain the pool of all ETH tokens

On line 165 of `SpaceRouter.sol`, you call `transferFrom`and store the boolean returned from `transferFrom` in the variable `transferSuccess`, but don't have a corresponding `require` statement to enforce that the transfer was successful. Considering you do the correct check in the next few lines, this looks to be overlooked. This is related to the avoid vulnerability, as the call to `transferFrom` will always return true even if the transfer fails. The user could call `swapSpcForEth` repeatedly to drain the pool. Actually, this might be a moot point, because on line 171, when you transfer ETH purchased at the end of the function, *you are actually transferring ETH to the pool instead of the user as intended.*

## [M-1] Live values are used instead of cached values when calculating liquidity

While you have disabled the transfer of ETH to the LP contract by overriding the `receive` function, you can still unbalance the pool by transferring in SPC tokens using `transfer` ahead of the `addLiquidity` call. Consider caching the reserve values and using them to calculate the deltas received during the call.

## [CQ-1] Contract only checks if SPC reserves are zero

On line 41 of `SpaceRouter.sol`, you only check if SPC reserves are zero. Consider adding a check that the ethBalance or ethReserve is zero also.