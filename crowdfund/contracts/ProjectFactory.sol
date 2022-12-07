//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.9;

import "./Project.sol";

contract ProjectFactory {
    Project[] public projects;

    // uint256 public goalAmount; // goal amount of ether

    // address public projectAddress; // address of the project

    // constructor() {
    //     // projectAddress = 0x5FbDB2315678afecb367f032d93F642f64180aa3;
    // }

    event ProjectRegistered(address newProject); // Note: you should add additional data fields in this event

    function create(uint256 _amount) external {
        uint256 goalAmount = _amount;
        Project newProject = new Project(goalAmount, payable(msg.sender));
        projects.push(newProject);
        emit ProjectRegistered(address(newProject)); // TODO: replace me with the actual Project's address
    }

    function getProjects() external view returns (Project[] memory) {
        return projects;
    }
}
