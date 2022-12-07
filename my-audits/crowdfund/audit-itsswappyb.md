## **[L-1]** Local variable shadowing

On line 26, Project.sol has the following code: 

    constructor(uint256 _amountToRaise, string memory name, string memory symbol, address _creator) ERC721(name, symbol) {
        creator = _creator;
        amountToRaise = _amountToRaise;
        roundStart = block.timestamp;
        roundEnd = roundStart + 30 days;
        projectState = ProjectState.ACTIVE;
    }

  The variables "name" and "symbol" have the same name as ERC721 variables "name" and "symbol" . This could lead to name resolution confusion.

  Consider: Renaming these constructor variables to avoid confusions.

## **[H-1]** NFTs not minted correctly and low risk reentrancy

Between lines 58 to 66, Project.sol has the following code:

    uint nftsToMint = (amountContributedBy[msg.sender] / 1 ether - balanceOf(msg.sender);
    uint _tokenId = tokenId;
    if(nftsToMint != 0) {
      for(uint i = 0; i < nftsToMint; i++) {
          _mint(msg.sender, tokenId);
          _tokenId++;
      }
      tokenId = _tokenId;
    }

One issue is `balanceOf` can be manipulated by the receiving address by transfering their NFTs to another address they own. This would essentially allow them to received more NFTs than they deserve.

Also, multiple tests breaks due to an `ERC721: token already minted` error. This suggests that the `tokenId` is not unique. This occurs because the `_mint` function is called with `tokenId` instead of `_tokenId`.

Another issue is that the `_tokenId` is being incremented after the `_mint` function. This is bad practice as it could introduce reentrancy attacks. In this case, `_mint` function reverts with an error, so the risk is low.

Consider: fixing the `nftsToMint` calculation and making the change to the `_tokenId`.

## **[Q-1]** Redundant tokenId variables

On line 59, Project.sol contains the following code:

    uint _tokenId = tokenId;

Creating a new variable `_tokenId` to keep track of the tokenId is unnecessary.

Consider: Use the `tokenId` storage variable you defined above.

## **[L-2]** Low severity reentrancy

Between lines 88 to 94, Project.sol has the following code:

    function claimFundraise(uint256 claimAmount) onlyCreator external {
        require(projectState == ProjectState.SUCCESS, "Fundraise not successful or completed");
        totalAmountContributed -= claimAmount;
        (bool success, ) = payable(creator).call{value: claimAmount}("");
        require(success, "Claim Failed");
        emit FundraiseClaimed(claimAmount);
    }

Events will be shown in an incorrect order, which might lead to issues for third parties.

Consider: It is good practice to follow the "Check-Effects-Interactions" pattern outlined [here](https://docs.soliditylang.org/en/v0.4.21/security-considerations.html#re-entrancy).


## **[L-3]** Low severity reentrancy

On line 85, Project.sol has the following code:

    emit Refunded(msg.sender, amountToRefund);

Events will be shown in an incorrect order, which might lead to issues for third parties.

Consider: It is good practice to follow the "Check-Effects-Interactions" pattern outlined [here](https://docs.soliditylang.org/en/v0.4.21/security-considerations.html#re-entrancy).


## **[Q-2]** Parameter naming convention

Between lines 8 to 12, ProjectFactory.sol has the following code:

    function create(uint256 _amountToRaise, string memory name, string memory symbol) external {
        // TODO: implement me!
        Project projectAddress = new Project(_amountToRaise, name, symbol, msg.sender);
        emit ProjectCreated(address(projectAddress)); // TODO: replace me with the actual Project's address
    }

The parameter `_amountToRaise` contains an underscore, whereas the rest of the parameters don't. It is generally good practice to have consistency in variable names.

Consider: Have more consistent variable names.


## **[Q-3]** Unused state variable

On line 21, Project.sol has the following code:

    bool isAborted;

This variable is not used anywhere.

Consider: Remove this variable.

## **[Q-4]** Incorrect test

On line 109, crowdfundr.test.ts contains the following code:

    await projectFactory.connect(alice).create(ONE_ETHER, "Project_1", "P1");

This test doesn't contain any expect statement, which causes it to falsely pass.

Consider: Fixing this test and adding the correct expect statement.
