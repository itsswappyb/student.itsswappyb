## **[L-1]** Unbounded operations

Between lines 82 and 85, Project.sol has the following code:

    uint256 i;
    for (i = contributorBadge; i != 0; i--) {
        _mintNft(msg.sender);
    }

In general, loops should be avoided when possible just in case. In this particular case, there are realistic scenarios where the function exhausts the block gas limit. 

  a) Theoretically, the maximum target block gas could go upto 30,000,000. 
  b) The EVM gas cost chart states that word storage operations cost about 20,000 gas.
  c) The _mintNft() operation stores at least 1 word into storage.
  d) Therefore the theoretical maximum number of NFT mints is 30,000,000 / 20,000 = 1500. We're being extremely conservative here. The actual number should be quite a bit less.
  e) This means that if the contributor donates more than 1500 ETH, this function will hit the target block gas amount, and revert entirely. The contributor will still be charged an excessive gas fee, but their contribution won't count.

Since the spec states that there's no upper bound to contributions, this is a possible, albeit unlikely scenario. 1500 ETH is worth roughly $2.5M USD, which is a lot of money to be donated to a crowdfunding project. This is why this is categorized as a low risk vulnerability.


## **[Q-1]** Spec violation

Between lines 53 and 60, Project.sol has the following code:

    require(
      msg.value >= 0.1 ether,
      "Contribution must be 0.1 ETH or greater"
    );
    require(raisedAmount <= goalAmount, "Project has reached its goal");
    require(balance >= minimumContribution, "Insufficient balance!");
    require(isExpired() == false, "Project has ended");
    require(previousBalance < goalAmount, "Project has reached its goal");

After these checks, the actual state updates and effects begin. However, there's a missed condition for cancellations. The `contribute()` function still allows contributions into cancelled projects.

Consider: Adding another `require()` statement that checks whether a project was cancelled.


## **[Q-2]** Spec violation

On line 57, Project.sol has the following code:

    require(raisedAmount <= goalAmount, "Project has reached its goal");

This implies that when the project is perfectly funded, (i.e the raised amount is exactly equal to the goal amount), someone can still contribute. However, once a project is funded, it should be considered a succesful project, and all further funding should be denied. 

Consider: Updating from `<=` to `<`.


## **[Q-3]** Spec violation

Between lines 126 and 132, Projec.sol has the following code:

    require(!isExpired(), "Can't cancel project after deadline"); 
    require(
        msg.sender == creatorAddress,
        "Only creator can cancel project"
    );

    isCancelled = true;

This implies that a successful project may be cancelled. However, only an active project should be allowed to be cancelled.

Consider: Adding another `require()` statement that checks whether the project is active.


## **[Q-4]** Unused and out of spec property

On line 7, ProjectFactory.sol has the following code:

    Project[] public projects;

The contract creates and stores an array of project contract addresses. This storage comes with an additional gas cost. However, the spec doesn't make use of this link between the factory and the project.

Consider: Removing line 7 and other lines that modify it, or read from it.


## **[Q-5]** Development and debugging artifacts

On lines 9, ProjectFactory.sol has the following code:

    // uint256 public goalAmount; // goal amount of ether

    // address public projectAddress; // address of the project

    // constructor() {
    //     // projectAddress = 0x5FbDB2315678afecb367f032d93F642f64180aa3;
    // }

Consider: Removing comments that do not pertain to making the code easier to understand.


## **[Q-6]** Development and debugging artifacts

On line 17, ProjectFactory.sol has the following code:

  event ProjectRegistered(address newProject); // Note: you should add additional data fields in this event 

Consider: Removing comments that do not pertain to making the code easier to understand.


## **[Q-7]** Unused payable() address

On line 21, ProjectFactory.sol has the following code:

    Project newProject = new Project(goalAmount, payable(msg.sender));

`payable()` is a solidity type casting mechanism that doesn't get compiled to bytecode. Its purpose is to enable methods such as `.transfer()` and `.send()`. However, neither of these methods are used in the project.

Consider: Removing the `payable()` casting on the address.


## **[Q-8]** Development and debugging artifacts

On line 23, ProjectFactory.sol has the following code:

    emit ProjectRegistered(address(newProject)); // TODO: replace me with the actual Project's address

Consider: Removing comments that do not pertain to making the code easier to understand.


## **[Q-9]** Returning a dynamic array

On line 26, ProjectFactory.sol has the following code:

    function getProjects() external view returns (Project[] memory) {
          return projects;
      }

Returning a dynamic array is considered an antipattern. It's not because it introduces a vulnerability to your own project (especially in your case, since it's marked as an external function), but because it introduces a vulnerability to the 3rd party smart contracts who might call this function. Since this is a dynamic array, it might grow to an arbitrarily large size, effectively siphoning the majority of the gas provided to the 3rd party function call. Furthermore, this function isn't a part of the spec and serves no purpose other than making it easier to write tests. Writing testable code is a virtue in traditional programming, and it still is for web3 programming, but perhaps to a lesser degree. Writing helper functions for debugging and testing purposes is advised against. Because they increase the surface of attack, and also blow up the deployment gas costs. Furthermore, the tests can be still implemented without fetching the entire array, and using the getter interface by providing indices instead.

Consider: Removing lines 26 to 28.


## **[Q-10]** Nonessential library import

On line 9, Projec.sol has the following code:

    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

The counter library serves a few specific purposes. Fighting race conditions is one of the biggest reasons. In this particular contract, there's no race condition to protect against. Furthermore, if you observe the implementation of the library, you will see that it has 3 basic operations: `increment`, `decrement` and `reset`. In our particular case, we will never need to `decrement`, nor `reset` the `_tokenIds` counter. And in the library, you can see that `increment` just adds 1 to a hidden variable. 

Consider: Removing the `Counters` library completely, and switching to a `uint256 private tokenIds` that you increment via the native `++` operator.


## **[Q-11]** Unmarked immutables

On lines 12, 13 and 15, Project sol has the following code:

    [12] uint256 public goalAmount;
    [13] address public creatorAddress;
    [15] uint256 public deadline;

These are properties that are meant to never change throughout the lifecycle of the contract. Not marking them as `immutable` will increase gas costs. Furthermore, it's less optimal in communicating intent to those who are reading your code.

Consider: Marking all 3 properties as immutable.


## **[Q-12]** Nonessential property

On line 14, Project.sol has the following code:

    uint256 public noOfContributors;

It's advised against to add features that aren't outlined in the spec. If anything, they increase the deployment gas cost, and they might increase the operating gas cost too. Furhtermore, they increase the attack surface. And even if they don't add vulnerabilities, they increase the chances of creating confusion. In this particular case, `noOfContributors` sounds like a variable that keeps track of the total number of **contributors**. However, upon closer inspection at line `68`, we can see that it's actually the total number of **contributions**, which will likely create confusion to external parties.

Consider: Removing this variable, and all other code related to the variable.


## **[Q-13]** Nonessential storage

On lines 17 and 32, Project.sol has the following code:

    [17] uint256 public minimumContribution;
    ...
    [32] minimumContribution = 0.01 ether;

This variable never changes, so it should be at least immutable. However, it's also hardcoded and doesn't depend on custom logic. This is a perfect usecase for `constant` values. Over cumulative project contract deploys, your users can save quite a bit on gas fees.

Consider: Updating line 17 with: `uint256 public constant minimumContribution = 0.01 ether;`, and removing line 32 altogether.


## **[Q-14]** Development and debugging artifacts

On line 34, Project.sol has the following code:

    console.log("Project created with goal amount: %s", goalAmount);

Console.logs are useful for debugging during development, but they shouldn't make it to the final code.

Consider: Removing line 34.


## **[Q-15]** Nonessential helper function

Between lines 41 and 46, Project.sol has the following code:

    function isActive() public view returns (bool) {
        // require(!isExpired(), "Project is expired"); // 
        // require(raisedAmount <= goalAmount, "Project has reached its goal");
        // return true;

        return !isExpired() && !isCancelled && raisedAmount <= goalAmount;
    }

This function is never used internally. If a function is public and not reused internally, it must be in the spec. Said in other words, if a function is not in the spec, the function must have some internal use. 

Consider: Removing the lines between 41 and 46, since the function is not used internally **and** it's not in the spec.


## **[Q-16]** Fail faster

Between lines 50 and 60, Project.sol has the following code:

    uint256 balance = address(this).balance;
    uint256 previousBalance = balance - msg.value;
    bool isFunded;
    require(
        msg.value >= 0.1 ether,
        "Contribution must be 0.1 ETH or greater"
    );
    require(raisedAmount <= goalAmount, "Project has reached its goal");
    require(balance >= minimumContribution, "Insufficient balance!");
    require(isExpired() == false, "Project has ended");
    require(previousBalance < goalAmount, "Project has reached its goal");

This function has a few `require` statements that might cause an early termination. This means that the computation done before the require statements should be kept to a minimum, ideally to help with the require statements themselves. This is to ensure the contract users don't spend more gas than necessary before their code fails anyway.

Consider: Not doing any computation unless it will be used by the require() statement that immediately follows.


## **[Q-17]** Unused constant

Between lines 53 and 56, Project.sol has the following code:

    require(
        msg.value >= 0.1 ether,
        "Contribution must be 0.1 ETH or greater"
    );

There's already the value `minimumContribution = 0.01 ether`. Instead of using the value, the code above hardcodes the 0.01 ether.

Consider: Replacing line 54 with `msg.value >= minimumContribution`.


## **[Q-18]** Nonessential require()

On line 58, Project.sol has the following code:

    require(balance >= minimumContribution, "Insufficient balance!"); 

Lines 53 to 56 already check whether the current contribution meets the minimum contribution threshold. The `require()` statement on line 58 does not contribute to an additional essential guarantee.

Consider: Removing line 58.


## **[Q-19]** Multiple sources of truth

On line 60, Project.sol has the following code:

    require(previousBalance < goalAmount, "Project has reached its goal");

In addition to running checks on `raisedAmount`, the contribute function also checks the contract balance before allowing further execution. This shows that there are multiple places that require maintenance and scrutiny while maintaining the same invariant. This increases complexity, mental overhead and potential for errors. 

Consider: Blocking all payments into the contract unless they are done via the `contribute()` method. This way, you won't need to make sure both the contract balance **and** the raisedAmount are below the goal amount.


## **[Q-20]** Development and debugging artifacts

Between lines 76 and 80, Project.sol has the following code:

    // bool shouldReceiveBadge = ((previousContribution + msg.value) >=
    //     1 ether);
    // if (shouldReceiveBadge) {
    //     _mintNft(msg.sender, contributorBadge);
    // }

Consider: Removing comments that do not pertain to making the code easier to understand.


## **[Q-21]** Nonessential helper function

Between lines 88 and 92, Project.sol has the following code:

    function _mintNft(address _to) internal {
        uint256 newItemId = _tokenIds.current();
        _mint(_to, newItemId);
        _tokenIds.increment();
    }

If a non-public and relatively small helper function is only used once, hardcoding it might help reduce deployment and runtime gas fees.

Consider: Removing the function and hardcoding the logic.


## **[Q-22]** Nonessential helper function

Between lines 94 and 101, Project.sol has the following code:

    function transferBadge(address _to, uint256 _tokenId) external {
        address badgeOwner = ownerOf(_tokenId);
        require(
            badgeOwner == msg.sender,
            "Only the badge owner can transfer it"
        );
        safeTransferFrom(badgeOwner, _to, _tokenId);
    }

Since Project.sol already extends ERC721, the transfer logic is already embedded and accessible. And an extension is not stricly essential. Furthermore, the ERC721 reference implementation's `safeTransferFrom` method allows the transfer of tokens by people who aren't strictly the owners of said tokens. It also suffices to be approved, without necessarily being the owner. However, lines 95 to 99 on Project.sol introduce custom logic that blocks the transfer of a badge unless the sender is strictly the owner of said badge. This additional custom logic is potentially confusing to users of the contract, especially since `safeTransferFrom()` is already accessible.

Consider: Removing this function entirely, and falling back to the regular `safeTransferFrom` method as exposed through ERC721 reference implementation.


## **[Q-23]** Fail fast

Between lines 104 and 116, Project.sol has the following code:

    bool isFunded = raisedAmount >= goalAmount;
    bool isFailed = isExpired() && isFunded;
    uint256 balance = address(this).balance;

    require(
        msg.sender == creatorAddress,
        "Only the creator can withdraw funds"
    );
    require(!isFailed, "Project has ended");
    require(isFunded, "Project has not reached its goal");
    require(!isCancelled, "Project has been cancelled");

    require(balance >= amount, "You have no outstanding funds");

This function has a few `require` statements that might cause an early termination. This means that the computation done before the require statements should be kept to a minimum, ideally to help with the require statements themselves. This is to ensure the contract users don't spend more gas than necessary before their code fails anyway.

Consider: Not doing any computation unless it will be used by the require() statement that immediately follows.


