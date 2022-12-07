https://github.com/0xMacro/student.itsswappyb/tree/8ad178b5a31f5752c08937416cdf654a8045932f/dao

Audited By: Thomas Taylor

# General Comments

Some really good things done and concepts grasped - very clean contract, not a ton of extra functionality, purchasing membership is great and creating proposals is 90% of where we need to be. However it seems some concepts relating to signatures, executions and security around those are not clearly grasped. Unfortunately there are also some security holes and a large feature that's a security concern.

My recommendation would be to schedule some time during office hours so we can go over transaction signatures and execution of payloads one-on-one so these are clearly grasped. 

# Design Exercise

Some decent thoughts on the design exercise but I would deeply think about what scenarios these could encompass. Please try and put a little more thought into the second design exercise in particular.

# Issues

Missing feature - Bulk Signature Vote Tallying

Unfortunately it doesn't look like this feature was completed or is working properly. The verification just does a tautological check of what comes out of recovering the signer from a message hash. It's also uncertain what the payload the user is signing. There do not seem to be any tests associated with it as well.

Insufficient Tests 

There is insufficient testing around the `proposeNft` and execution functions. Please consider adding some more appropriate tests that are less duplicative and trying to test out the business cases of these functions.

**[H-1]** No checks around `executeTransaction()`

`executeTransaction()` allows for anyone to drain the DAO of funds, call a malicious actor, etc. since it is marked public and payable. It also appears the word `signature` is being used when `methodId` might be more appropriate. 

Consider removing this function entirely or marking it internal or re-constructing it so only `executeTransaction()` can be called by a few functions.

**[H-2]** Losing proposals can be executed multiple times

The function `execute()` allows a proposal to be executed with sufficient quorum to be executed. It does not however check if the proposal has been executed or if the proposal is past the deadline.

Consider checking if it has been executed and what state the proposalId is in.

**[M-1]** NFT purchase price has no upper limit

When the DAO creates a proposal to purchase an NFT, the NFT seller could take advantage of that by raising the NFT price to some arbitrarily high amount.

Consider adding a `maxPrice` variable into the NFT-buying function that just doesn't check if the amount of an NFT is just more than the DAO but that the DAO would be willing to spend.

**[M-2]** Member can vote multiple times

When a vote is cast in `_castVote()`, the proposal receipt marks the voter as having voted. However because `hasVoted` is not checked on this receipt again, this voter could potentially mark their vote multiple times. However since `yesVotes` are not used for any sort of quorum counting, the vulnerability for this is medium.

Consider both adding yesVotes to the quorum counting process and adding a check to see if the user has voted as well.

**[L-1]** Using block height instead of block time to measure passage of time

Using blocks instead of timestamps makes voting times less predictable. Block times have changed in the past, and they're set to change for ETH 2.0. Timestamps are only vulnerable to attacks when the window of time is short. Since this contract deals with days and weeks, there shouldn't be an issue with using timestamps

**[L-2]** Bulk signing function requires that a user `hasVoted`

The bulk signing function requires a user to have voted before they cast a vote.YOu can see this in the check on line 378.

Consider modifying this to make sure they haven't voted yet. 

**[Q-1]** Extraneous functions in Collector.sol

There is an `onlyAdmin` check written that's unused throughout the code. 

**[Q-2]** Separating function signatures (method ids) and calldata

It's not necessary to separate these and you should probably combine them for storage sake. You can keep them together in a byte array. 

**[Q-3]** Insufficient voting delay to start a vote

It appears that you wait approximately one block before starting a vote. This does not give a well-formed DAO sufficient amount of time to read the proposal most likely and could allow a malicious actor to buy a bunch of voting power, pass a proposal (drain the DAO) and then dump the voting power in the space of 3 blocks.

Consider extending `votingDelay`.

# Nitpicks

`add256` is fairly unnecessary and will throw if you overflow `uint256`. It's not needed as sol 0.8.0 has this built-in. Same for `sub256`.

# Score

| Reason | Score |
|-|-|
| Late                       | - |
| Unfinished features        | 2 |
| Extra features             | - |
| Vulnerability              | 12 |
| Unanswered design exercise | - |
| Insufficient tests         | 2 |
| Technical mistake          | - |

Total: 16
