https://github.com/0xMacro/student.itsswappyb/tree/594634ff56599093526b21a5ef6611b9447e7377/dao

Audited By: Vince

# General Comments

Good new iteration of the project, the issues with the signature are fixed and it shows understading of the requirements needed for a DAO to run. However, there are still some minor issues such as the extra feature to
propose buying an NFT, the presence of an admin role and a flaw in capturing the number of members that can vote on a proposal. Very good test coverage and very well done on the signature and proposal execution flow!

# Issues

**[L-1]** Using block height instead of block time to measure passage of time

Using blocks instead of timestamps makes voting times less predictable. Block times have changed in the past, and they're set to change for ETH 2.0. Timestamps are only vulnerable to attacks when the window of time is short. Since this contract deals with days and weeks, there shouldn't be an issue with using timestamps

**[Technical-Mistake]** Unnecessary admin role

Project's specs don't require to check if a user is an admin to execute a proposal.
This poses a lot of trust into a single actor to behave correctly which is not necessary in a scenario where a proposal is voted on by the DAO members.
Also, an admin is allowed to call `executeTransaction`.
In the remote case that the admin wallet gets hacked that poses a huge risk on the DAO.

Consider removing the admin role.

**[Technical Mistake]** Quorum should be 25% of total members

The project spec states that a quorum of 25% is needed, but you used a different percentage.

One way to check for 25% quorum that isn't distorted by Solidity's rounding down division is like this:

```
const totalVotes = proposal.numYes + proposal.numNo); // + proposal.numAbstain if you designed your voting system this way
require(totalVotes * 4 >= proposal.votesAllowed, "NO_QUORUM");
```

**[L-1/Extra-feature]** `proposeNFT` function is not necessary and could be front runned

Imagine an attacker whatching for `proposeNFT` call on his NFTs and issue immediately a transaction to make it's price higher ending in front-running the `proposeNFT` call that at that point would issue a proposal to buy the NFT at 110% its current price that is now inflated. The proposal would probably be voted no, but still that code is sitting in your contract and inflating the blockchain with useless information.

Consider removing the `proposeNFT` function as it can be simply prepared off-chain.

**[Gas-Optimization]** storing proposal id in the struct is redundant.


# Score

| Reason | Score |
|-|-|
| Late                       | - |
| Unfinished features        | - |
| Extra features             | 1 |
| Vulnerability              | 3 |
| Unanswered design exercise | - |
| Insufficient tests         | - |
| Technical mistake          | 3 |

Total: 7

Good work!
