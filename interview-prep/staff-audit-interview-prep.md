https://github.com/0xMacro/student.itsswappyb/tree/ba97eb6a208a061189ad69387991290d8a71cfbd/interview-prep

Audited By: Cameron Voell

# Sudoku Challenge

Below you will find the staff audit for both of the interview question solutions you submitted. For the Sudoku Exchange problem, the audit will look a little different than you're used to. Instead of issues in the code you submitted, you will find several checklists of known vulnerabilities and known gas optimizations. We've added an `[x]` next to each item if you correctly identified that item in your submission, and a `[]` if not.

## General Comments

A gentle heads up: the Sudoku Exchange problem is intentionally very difficult. Usually only 1 student manages to find enough vulnerabilities and gas optimizations to pass. Please, use this as a benchmark for how much you've learned in the last 6 weeks (only 6 weeks!). Even better, for those items you missed we hope you use it as a guide for the attack vectors to look out for on your next interview/audit.

You did a good job identifying more than half of the High Severity Problems, including vulnerabilities of different categories like re-entrancy, memory vs storage, and logical errors like transferring to contract instead of msg.sender. Nice work.

Don't forget to run code analysis tools like slither. In this case slither identifies the first issue " `createReward()`'s `ERC20.transferFrom` call does not check the return value for success"; and the low severity "`claimReward`'s `ERC20.transfer` call does not check the return value for success."

Catching issues like "overwriting existing challenges" and the "claim-reward front running" need to be caught using a high level understanding of the code which can definitely be tricky. Also it can be helpful to add more tests, for thinking creatively of things that may break the code. 

Hopefully the suggestions above and some of the issues you missed may be helpful in filling in some of the gaps going forward. The issues you found show me you're thinking well about security, so keep it up!

## Issues

### High Severity Vulnerabilities

- [ ] `createReward()`'s `ERC20.transferFrom` call does not check the return value for success.

- [ ] `createReward()` allows overwriting of existing challenge reward/token/solved.

- [x] Need to change the `.transfer` call to transfer to `msg.sender` so that it rewards the caller.

- [x] Need to change data type from `memory` to `storage` so that it changes the storage value of the `ChallengeReward`.

- [ ] `claimReward` can be front-run. `SudokuExchange` needs to change the `claimReward` logic to use a 2-stage commit-reveal process where the first transaction commits `keccak256(msg.sender + random_salt)`, and then, after some number of a blocks, in a second transaction the actual solution is provided. The `msg.sender + random_salt` hash ensures that the second transaction cannot be front-run.

- [x] Can be double-claimed. Need to check that it's not solved (or remove it from mapping).

- [x] `claimReward` is vulnerable to a reentrancy attack. (It would not be if it followed checks-effects-interactions.)

### Low Severity Vulnerabilities

- [ ] `claimReward`'s `ERC20.transfer` call does not check the return value for success.

- [ ] `createReward()` allows creating an already solved challenge (`solved=true`), locking tokens.

- [ ] The `challenge` argument in `claimReward` is controlled by the user, so they could pass in a contract address with a `validate` function that always returns `true`.

### Gas Optimizations

- [ ] Turn solc gas optimizations on.
- [ ] Gas savings from shorter error strings or Solidity Custom Errors.
- [ ] Do not create new contract with every challenge, instead store within `Challenge` struct on `SudokuExchange`.
- [ ] Remove `hardhat/console.sol`. See the NPM package [hardhat-log-remover](https://www.npmjs.com/package/hardhat-log-remover)
- [ ] Eliminate duplicate information from `ChallengeReward` struct. The `challenge` struct member on line 20 is identical to the key of `rewardChallenges` on line 30. Consider removing the `challenge` struct member.
- [ ] Remove a memory variable allocation by getting rid of `isCorrect` function variable in `claimReward`. It can be passed directly to the `require` on the next line.

### Code Quality Issues

- [ ] There are no tests!
- [ ] The documentation is sparse. Consider using the NatSpec format for comments, and add more variable, function, and contract comments.
- [x] Explicitly mark the visibility of contract fields like `rewardChallenges` to be `public`.
- [ ] Add events to signify changes in the contract state.

## Score

1) You must find all but 1 of the High and Medium severity vulnerabilities in order to pass this interview.
2) You must have at least 3 of the Gas Optimizations to pass this interview.

Interview failed. :slightly_frowning_face

---

# Signature MerkleDrop

## General Comments

## Issues

**[L-1]** `signatureClaim` verifies signature against `_to`, when it should check `msg.sender`

In `signatureClaim` the address checked and then updated in the `alreadyClaimed` mapping is `_to` but it should be `msg.sender`. `msg.sender` is the address claiming tokens, `_to` is just the address the claimer wants to the tokens to be held in. Similarly, the address checked in the signature should be `msg.sender`. This is a Low Vulnerability because it implies that someone other than the msg.sender can submit a signature to claim the MACRO token, and since the signatures are held in some offchain database, it’s possible for those signatures to be obtained by a single user who then causes all the tokens to be claimed. The actual `_to` recipients may not want this, for example for tax purposes (an honest claimer could have waited until the next tax year to claim their token, and pay their capital gains tax).

---

**[L-1]** `merkleClaim` verifies signature against `_to`, when it should check `msg.sender`

In `merkleClaim` the address checked and then updated in the `alreadyClaimed` mapping is `_to` but it should be `msg.sender`. `msg.sender` is the address claiming tokens, `_to` is just the address the claimer wants to the tokens to be held in. Similarly, the address checked in the merkle proof leaf should be `msg.sender`. This is a Low Vulnerability because it implies that someone other than the `msg.sender` can submit a merkle proof to claim the MACRO token. This means it’s possible for a single user to cause all the tokens to be claimed. The actual `_to` recipients may not want this, for example for tax purposes (an honest claimer could have waited until the next tax year to claim their token, and pay their capital gains tax).

---

**[Technical Mistake]** `signatureClaim` prevents smart contract wallets from claiming their MACRO

In line 100 of `Airdrop.sol`, you call `ECDSA.tryRecover` on the passed in signature. This works fine for EOA addresses, but does not support EIP-1271 smart contract signatures. So if the airdrop included an address of a smart contract wallet like a Gnosis Safe, it would be un-claimable.

You can use something like OZ's [SignatureChecker.isValidSignatureNow](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/utils/cryptography/SignatureChecker.sol#L25) function to handle EIP-1271 contract signatures.

---

**[Q-1]** Leaving hardhat/console.sol in production project

Your contract imports hardhat/console.sol, which is a development package.

Consider removing hardhat/console.sol from your production code.

## Score

| Reason | Score |
|-|-|
| Late                       | - |
| Unfinished features        | - |
| Extra features             | - |
| Vulnerability              | 2 |
| Unanswered design exercise | - |
| Insufficient tests         | - |
| Technical mistake          | 1 |

Total: 3
"Nice job!"
