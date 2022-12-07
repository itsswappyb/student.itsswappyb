https://github.com/0xMacro/student.itsswappyb/tree/594634ff56599093526b21a5ef6611b9447e7377/ico

Audited by: Gary

# General Comments

Wow! Great job in addressing the original vulnerabilities and other issues.  You went from a score of 16 to 2!

Although you corrected the original issues, one additional vulnerability was introduced as described below. 
Make sure you add test coverage for these lines.  

In addition, I pointed out several quality issues that you should be aware of as you transition into a Web3 engineer.
By reducing these quality issues, you will become a better engineer.  

Overall though, excellent job on the redo. The effort to understand the issues, and then correct them in a short time
is commendable.  You should be proud of yourself. 

# Design Exercise

No changes 

# Issues

**[M-1]** Transferring tokens from incorrect address 

If the `transferFrom` function is called to transfer tokens from one address to another, the EOA or contract that
calls the `transferFrom` could have the tokens stolen or the transaction could fail if the EOA/Contract did not have 
enough tokens to be transferred.  

The `transferFrom` function calls `transfer` to calculate the tax and send the tax to the treasury if tax is on, and
also to send the tokens to the 'to' account.   However, `_transfer ` on lines 30 and 34 is transferring the tokens
from the msg.sender address, not the "from" account.  The msg.sender account on a transferFrom could be from a different
EOA then the "from" account, or from a contract like the LP contract.  Thus, the tokens would be transferred from the 
EOA/Contract and not from the 'from' account.  It should be transferring from the 'from' account. 
*Note* msg.sender is correct for `transfer` when it is called externally but not from `transferFrom`

Consider replacing lines 45 -  `transfer(to, amount);` with similar code from the transfer function, but use the
"from" account on the _transfer call instead of msg.sender. 

or you can replace both the `transfer` and  `transferFrom` with just an override to `_transfer`
```
function _transfer(address sender, address recipient, uint amount) internal  virtual override {    
       
       if (isTaxed) {    
          uint256 tax = (amount * 2) / 100;   
          amount -= tax;
          super._transfer(sender, treasury, tax);
       }   
        super._transfer(sender, recipient, amount);
    }  
```

**[Q-1]** Error messages are quite long  (not corrected from original submit)

The error messages in your `require` statements are quite long. Whilst this makes the nature of the error very clear to both users and readers of the contract, it does consume more gas. Consider either using shorter error messages or switching to custom errors with `revert` (see https://blog.soliditylang.org/2021/04/21/custom-errors/)

**[Q-2]** Use immutable variables

There are a number of variables set in the constructor on SpaceCoinToken.sol and SpaceCoinICO.sol that don't change. 
(owner, treasury, admin, spaceToken)  These can be made immutable. See https://docs.soliditylang.org/en/v0.8.9/contracts.html#constant-and-immutable-state-variables

Also, there are other variables that do not change in storage that can be marked as constant (goalAmount,
tokenPrice)

Unchanged variables should be marked constant or immutable

Contracts that includes storage variables that are not updated by any functions and do not change can save gas and improve readability by marking these variables as either constant or immutable.

What's the difference? In both cases, the variables cannot be modified after the contract has been constructed. For constant variables, the value has to be fixed at compile-time, while for immutable, it can still be assigned at construction time.

Compared to regular state variables, the gas costs of constant and immutable variables are much lower. For a constant variable, the expression assigned to it is copied to all the places where it is accessed and also re-evaluated each time. This allows for local optimizations. Immutable variables are evaluated once at construction time and their value is copied to all the places in the code where they are accessed. For these values, 32 bytes are reserved, even if they would fit in fewer bytes. Due to this, constant values can sometimes be cheaper than immutable values.

Consider marking unchanged storage variables as immutable or constant.

**[Q-3]**  Unused state variable `maxMintAmount` in `SpaceCoinToken `

`maxMintAmount`  is initialized in the constructor, but then never referenced again 

Extra state variables waste gas and make the contract needlessly complicated. Before submitting/deploying a
contract check to make sure all variables have a purpose

**[Q-4]**  Modifier not needed in SpaceCoinToken.sol

Modifiers are useful because they reduce code redundancy. You should use modifiers if you are checking for the same 
condition in multiple functions. `onlyOwner()` is only being checked in `toggleTax()`

Consider adding a require statement in `toggleTax())` to check for owner 

**[Q-5]** Public functions only called externally

The functions `transferFrom`, `toggleTax`, `addToWhitelist`, `isAddressWhitelisted`, `claimSpaceTokens` 
`movePhase`, and `invest` are declared public when they could be `external` as they are never called from within the contract. Consider using `external` instead to reduce contract size a little and make the intended usage clearer.

**[Q-6]** Unnecessary keyword payble on the address parameters

No need for pass addresses as payable in `addToWhitelist`, `isAddressWhitelisted`.  Payable is used if sending ETH to the 
address.  In this contract no ETH is being sent back to the addresses.   

**[Q-7]** Checks-effects-interactions not followed

In `claimSpaceTokens` you are transfering the tokens, then updating the tokensToReward[msg.sender] to 0.
In order to guard against re-entrancy vulnerabilities it is recommended to always make updates to state variables
before making any external calls. (check-effects-interaction pattern) There is no re-entrancy vulnerability here since the SpaceCoinToken contract is yours and you know you have no malicious code. However, that can only be verified by examining both the SpaceCoinToken contract and the OZ ERC20 contract it extends. This makes auditing harder now and leaves a potential vulnerability in the future if the ICO contract code were ever to be reused with a different token contract.

See the following section of the Solidity docs for more on the check-effects-interaction pattern: https://docs.soliditylang.org/en/v0.8.13/security-considerations.html?highlight=checks%20effect#use-the-checks-effects-interactions-pattern


**[Q-8]** `addToWhiteList` is brittle

If `addToWhiteList` is called more than once, there could be a chance the the list could contain duplicates
Line 52 will check for duplicates and revert the entire transaction. It should just bypass the duplicates and
continue adding the other addresses.  It will force owner to waste gas and try executing the transaction again.

Consider removing line 52 and let the address be added again. 

**Nit-Pick**  

- No need to initialize the icoPhase in the constructor for  `SpaceCoinICO` as it already 
  defaults to Phase.Seed - which the value is unit8 of 0. 
   
# Score

| Reason | Score |
|-|-|
| Late                       | - |
| Unfinished features        | - |
| Extra features             |   |
| Vulnerability              | 2 |
| Unanswered design exercise | - |
| Insufficient tests         | - |
| Technical mistake          |   |

Total: 2

Great job! 


----------------------------------------------------------------------------------------
## PREVIOUS MICRO AUDIT


https://github.com/0xMacro/student.itsswappyb/tree/8ee4d42bffda52913159bcc2af9ff92ef0c46a2b/ico

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
