pragma solidity ^0.4.8;

import "./lib/Owned.sol";

contract OneUserOneOwner is Owned {
    address public user;

    modifier onlyUser() {
        require (msg.sender == user);
        _;
    }

    function OneUserOneOwner() {}

    function transferUser (address newUser) public onlyOwner {
        if (newUser != user) {
            user = newUser;
        }
    }

    // Getter function of the user address
    function getUser () public onlyOwner returns (address user) {
        return user;
    }
}
