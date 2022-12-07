Commit: https://github.com/0xMacro/student.itsswappyb/tree/8ee4d42bffda52913159bcc2af9ff92ef0c46a2b/ico

Audited by: Cameron Voell

Reachable via discord: cyrcus#0533

****
# General Comments

Nice job completing the overall assignment. As you can see in the Issues, some small mistakes unfortunately can cause vulnerabilities that will make the contract fail. Perhaps consider making tests more fine grained in the future to catch errors like accidentally transferring all tokens from `owner` account. It can be hard to catch one word being incorrect, but Test Driven Development with unit tests will make these types of errors much more obvious while developing. 


****
# Design Exercise

"The Vesting period would have stages/phase, much like the ICO. After each stage, I would calculate a percentage of the tokens that can be withdrawn and set this as the "allowed" withdrawal amount."

This is a nice simple way to vest rewards. However in order to award tokens "linearly" over time, you may consider thinking of a way where the user will continuously have more rewards available for withdrawal. For example, a 12 SPC reward with a 1 year vesting period could allow me to withdraw 1 SPC after the first month, or .5 SPC after half a month.  

****

# Issues

**[H-1]** Transfer allows stealing SPC from owner

SpaceToken.sol line 24:

```solidity
function transfer(address to, uint256 amount) public virtual override returns (bool) {
        // check for zero address
        require(to != address(0), "invalid address");
        // deduct tax from the amount
        if (isTaxed == true) {
            uint256 tax = (amount / 100) * 2;
            treasury += tax;
            amount -= tax;
        }

        // transfer the tokens
        _transfer(owner, to, amount);
        return true;
    }
```

Line 41 always performs a transfer from `owner` account. This means every transfer from any user will transfer from the address set to be owner of SPC. Since the owner has the whole initial supply, this means anyone can steal the initial supply. Also the transfer function will not as expected in SpaceCoinICO.sol because it will always transfer tokens from SpaceCoin.sol owner account. 

I believe the mistake was made because we want to borrow most of the functionality from OpenZepeelin ERC20.sol transfer function, but you missed the line above that assigns a function memory variable "owner" the value of msgSender(). Be extra careful when copying code from other files!

```solidity
/**
     * @dev See {IERC20-transfer}.
     *
     * Requirements:
     *
     * - `to` cannot be the zero address.
     * - the caller must have a balance of at least `amount`.
     */
    function transfer(address to, uint256 amount) public virtual override returns (bool) {
        address owner = _msgSender();
        _transfer(owner, to, amount);
        return true;
    }
```

Consider transferring from `msg.sender`.

---

**[H-2]** `claimSpaceTokens` can be called without limit

SpaceCoinICO.sol line 74:

```solidity
function claimSpaceTokens() public payable {
        require(icoPhase == Phase.Open, "ICO is not open");
        require(contributions[msg.sender] > 0, "You have no contributions");
        uint256 spaceTokenRewards = contributions[msg.sender] * tokenPrice;
        super.transfer(msg.sender, spaceTokenRewards);
    }
```

Calling `claimSpaceTokens` performs a transfer of amount `contributions[msg.sender] * tokenPrice`, but no counter is decreased in order to stop the function from being called again and receiving the same amount of tokens. This means than anyone that is owed any SPC coin can call claimSpaceTokens as many times as they want and keep gaining more SPC tokens. 

Consider having a counter for how many SPC tokens have already been claimed and subtracting that from the available SPC for an account.

---

**[H-3]** Users unable to contribute during open phase even if 30_000 ETH target not yet reached.

SpaceCoinICO.sol line 65:

```solidity
function setLimits() private {
        if (icoPhase == Phase.General) {
            totalContributionLimit = 30_000 ether;
            individualContributionLimit = 1_000 ether;
        } else if (icoPhase == Phase.Open) {
            individualContributionLimit = 0;
        }
    }
```

Phase.Open should remove any individualContributionLimit but instead it sets it to 0 so no one can contribute any more. But it is possible we are not yet at the 30_000 limit and we want to keep allowing contributions.

Consider not applying the individualContributionLimit if we are in Phase.Open and instead only enforce the 30_000 limit in Phase.Open. 

**[H-4]** Tax does not transfer any tokens

SpaceToken.sol line 24:

```solidity
function transfer(address to, uint256 amount) public virtual override returns (bool) {
        // check for zero address
        require(to != address(0), "invalid address");
        // deduct tax from the amount
        if (isTaxed == true) {
            uint256 tax = (amount / 100) * 2;
            treasury += tax;
            amount -= tax;
        }
```

The line `treasury += tax` adds to a counter variable but we never actually transfer the tax tokens to the treasure account.

Consider actually transferring SPC tokens to treasury according to tax logic.

---


**[M-1]** Transfer tax can be avoided.

The tax deduction is performed in an override of the `transfer()` 
function, but this will not catch all transfers. ERC-20's `transferFrom()` 
can still be used to transfer tokens and avoid the tax logic. Putting the 
same logic into the _transfer(address,address,uint) function would catch 
all transfers as the inherited ERC20 implementation always uses this internally.

Consider overriding both `transfer()` and `transferFrom()` and applying tax
logic, or override the `_transfer()` function, which is called from both of
ERC-20's `transfer()` and `transferFrom()`.

---

**[L-1]** Dangerous Phase Transitions

If the 'changeICOStage' function is called twice, a phase can accidentally 
be skipped. There are a few situations where this might occur:

1. Front-end client code malfunction calling the function twice.
2. Human error double-clicking a button on the interface on accident.
3. Repeat invocations with intent - Uncertainty around whether or not a 
transaction went through, or having a delay before a transaction processes, 
are common occurrences on Ethereum today.

Consider refactoring this function by adding an input parameter that 
specifies either the expected current phase, or the expected phase to 
transition to.

---

**[Q-1]** `claimTokens` does not need to be `payable`

---

**[Q-2]** Error messages are quite long

The error messages in your `require` statements are quite long. Whilst this makes the nature of the error very clear to both users and readers of the contract, it does consume more gas. Consider either using shorter error messages or switching to custom errors with `revert` (see https://blog.soliditylang.org/2021/04/21/custom-errors/)

---

**[Q-3]** Adding whitelisted addresses 1 by 1 is very gas
inefficient

Each Ethereum transaction has an initial fixed cost of 21_000 gas, which
is in addition to the cost of executing computation and storing variables
in the contract. By only allowing a single whitelisted address to be added
per function call, this is going to waste a lot of gas compared to a function
which takes in an array of whitelisted addresses and adds them in a single
transaction.


--- 
**[Extra Feature]** Removing whitelisted addresses is not
part of the spec

This feature increases the attack surface of the contract and deviates from
the spec. Being able to remove addresses means even after an address
has been added, they are at the mercy of the owner of the ICO, who can
remove them at any time.


# Score

| Reason | Score |
|-|-|
| Late                       | - |
| Unfinished features        | - |
| Extra features             | 1 |
| Vulnerability              | 15 |
| Unanswered design exercise | - |
| Insufficient tests         | - |
| Technical mistake          | - |

Total: 16

Good Effort
