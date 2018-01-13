pragma solidity ^0.4.8;

//import "./lib/owned.sol"; //cambiar por multiowne si necesario

import "./enerToken.sol";
import "./market.sol";

contract ticket {
    //Data struct

    //Variables
    address token;
    address mkt;

    //Events

    //Constructor
    function ticket (
        address _marketAddress,     // Address of the market. Since there is one market for each product,
                                    // the address of the market contains the information of the product
        address _tokenAddress,      // Address of the Token we are trading with
        address _agentAdress,       // Address of the owner of the ticket
        uint _price,                // Trading price
        bool _type                  // Type of the ticket: 0 = buying; 1 = selling
        ){
        require(msg.sender == _marketAddress);  // Only the associated market contract can print tickets
        token = enerToken(_tokenAddress);
        mkt = market(_marketAddress);
    }
    //Functions

}
