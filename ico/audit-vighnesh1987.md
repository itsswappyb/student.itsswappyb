Hi Swapneel,

I appreciate the opportunity to audit your project. My intention is to be thorough with feedback while acknowledging that this feedback comes
from my limited perspective as a fellow student. If there is any piece that particularly stands out to you as unwarranted or incorrect, I'd be
happy to hear your reasoning!

There were 5 bugs that I considered to be major ones - each opening up a vector for losing money. I've categorized them as High. In addition, I've provided a list of nits.

Warmly
Vighnesh

p.s.: Line numbers might be slightly off since I added comments in your code and then looked up line numbers. Apologies.


## **[H-1]** Tax is not accrued in treasury
Treasury has been set up as a counter instead of an EOA. In the `transfer` method, lines 32, the counter is incremented to collect tax. However no tokens are actually transferred to the treasury. As such, the treasury will always remain empty.


Consider: Setting up treasury as an EOA and actually calling `_transfer` to send tokens to it

## **[H-2]** Tax won't be collected when a contributor transfers their tokens to another contributor using `transferFrom`.
Since `transfer` was overridden and not `_transfer`, tax also won't be collected when one contributor calls `transferFrom` to transfer their tokens to another contributor

Consider: Overriding `_transfer` so that all code paths collect tax

## **[H-3]** All tokens can be stolen from SpaceCoinToken contract owner
The `transfer` method in ERC20 can be called by anyone who owns tokens. If a regular contributor calls this method, line 38 will still transfer the amount from the owner of the contract to the `to` address. This will allow anyone to empty all tokens from the owner.

Consider: Change `owner` on line 38 to `msg.sender`

## **[H-4]** Contributor can keep collecting tokens with multiple calls to claimSpaceTokens for a single contribution
As a contributor, I could contribute a non-zero ETH amount and then make multiple calls to `claimSpaceTokens` in OPEN phase to keep collecting rewards for it.

Consider: Keeping track of what tokens have been claimed in a separate counter and only releasing tokens for extra contributions

## **[H-5]** Contributor cannot contribute any money in phase.OPEN
In `setLimits`, the `individualContributionLimit` gets set to 0 in Pahse.OPEN, which is then checked in the third require statement in `invest`

Consider: Setting it to `2**256-1`

## Nits

- `* MULTIPLIER` on SpaceCoinToken:14 is equivalent to ` ether` – could just use that?
- Delete unnecessary comment on SpaceCoinToken:15
- Delete imports of hardhat/console.sol before shipping to reduce code size
- Use custom errors everywhere https://blog.soliditylang.org/2021/04/21/custom-errors/
- Comment on SpaceCoinToken:27 only explains what a reasonably readable line of code on line 28 does. Delete it.
- Check on SpaceCoinToken:28 is unnecessary since the ERC20 implementation of `_transfer` does this check. 
- SpaceCoinToken:43 – toggleTax could be simplified down to `isTaxed = !isTaxed`. Also `setTax(bool)` might be a better paradigm to consider since its behavior is less prone to race conditions
- SpaceCoinICO:19 Consider renaming variable to allowlist/isPermitted. `whitelist` comes from an era where white was considered good and black as bad. As a part of the tech industry rerouting itself towards removing subconscious racism, there is a movement to call whitelists allowlists. I'm sharing this based on my beliefs and what I've observed in the tech industry but don't expect your beliefs to align with mine :)
- SpaceCoinICO:21 unnecessary comment :)
- SpaceCoinICO:42 Could combine pauseICO and resumeICO into `setICOPauseStatus(bool)`. It'd create for a an API that aligns with consistent setter patterns
- SpaceCoinICO:50 addToWhitelist returns a bool. Why return a bool if none of your code paths are returning false?
- SpaceCoinICO:isAddressWhitelisted is an unnecessary function since `isWhitelisted` is a publicly accessible variable
- SpaceCoinICO#invest isPaused == false can be `!isPaused`. The former style of checking bools is useful in languages that allow a bool to be null/undefined like JavaScript, not the case in Solidity.
- SpaceCoinICO#invest Unnecessary cast to `payable` when calling `isAddressWhitelisted`. You can remove payable cast from this line and the payable declaration from the function definition
- Your code could use more events. For eg, an event to let the ICO owner know that goal has been met for a particular phase would be helpful.
