pragma solidity ^0.4.8;

import "./StandardToken.sol";

contract enerToken is StandardToken {

    address tokenCreator;
    string public name;                   // Fancy name
    uint8 public decimals;                // How many decimals to show
    string public symbol;                 // An identifier

    function enerToken(
        uint256 _initialAmount,
        string _tokenName,
        uint8 _decimalUnits,
        string _tokenSymbol
        ) public {

        tokenCreator = msg.sender;
        balances[msg.sender] = _initialAmount;               // Give the creator all initial tokens
        totalSupply = _initialAmount;                        // Update total supply
        name = _tokenName;                                   // Set the name for display purposes
        decimals = _decimalUnits;                            // Amount of decimals for display purposes
        symbol = _tokenSymbol;                               // Set the symbol for display purposes

    }

    function getTokenCreatorAddr() public returns (address tokenCreatorAddr) {
        return tokenCreator;                                 // Getter function of Token creator address
    }

}
