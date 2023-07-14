// SPDX-License-Identifier: UNLICENSED

// DO NOT MODIFY BELOW THIS
pragma solidity ^0.8.17;

import "hardhat/console.sol";

contract Splitwise {
    // DO NOT MODIFY ABOVE THIS

    // ADD YOUR CONTRACT CODE BELOW
    address public owner;

    // For Checking the participant.
    address[] public participantList;
    mapping(address => bool) public participant;

    // FOr storing the owing data.
    mapping(address => Owing[]) owingData;

    struct Owing {
        uint32 amount;
        address owingAddress;
    }

    constructor() {
        owner = msg.sender;
    }

    function setParticipant(address input) private {
        if (participant[input]) {
            return;
        }
        participant[input] = true;
        participantList.push(input);
    }

    function getParticipant() public view returns (address[] memory) {
        return participantList;
    }

    function getAllOwingData(
        address input
    ) public view returns (Owing[] memory) {
        return owingData[input];
    }

    function lookup(
        address debtor,
        address creditor
    ) public view returns (uint32 ret) {
        Owing[] memory result = getAllOwingData(debtor);
        for (uint i = 0; i < result.length; i++) {
            if (result[i].owingAddress == creditor) {
                return result[i].amount;
            }
        }

        return 0;
    }

    function iou(address iAddress, address uAddress, uint32 amount) public {
        require(iAddress != uAddress, "You can not owe yourself!");
        setParticipant(iAddress);
        setParticipant(uAddress);

        // Check if they owe us first. If yes, then reduce the amount - cancel the owing process.
        for (uint i = 0; i < owingData[uAddress].length; i++) {
            Owing storage ourOwingData = owingData[uAddress][i];
            if (ourOwingData.owingAddress == iAddress) {
                // Update the owing amount
                if (ourOwingData.amount > amount) {
                    ourOwingData.amount -= amount;
                    return;
                } else if (ourOwingData.amount < amount) {
                    delete owingData[uAddress][i];
                    amount -= ourOwingData.amount;
                    // Continue the flow since we still owe them.
                } else {
                    // Clear out the owing data;
                    delete owingData[uAddress][i];
                    return;
                }
            }
        }

        // Check if we have an existing owing them.
        for (uint i = 0; i < owingData[iAddress].length; i++) {
            Owing storage theirOwingData = owingData[iAddress][i];
            if (theirOwingData.owingAddress == uAddress) {
                theirOwingData.amount += amount;
                return;
            }
        }

        // If not, We add new owing data.
        Owing memory newOwingData;
        newOwingData.owingAddress = uAddress;
        newOwingData.amount = amount;

        owingData[iAddress].push(newOwingData);
    }
}
