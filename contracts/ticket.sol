pragma solidity ^0.4.8;

//import "./lib/owned.sol"; //cambiar por multiowne si necesario

import "./enerToken.sol";
import "./market.sol";

contract ticket {
    //Data struct

    //Variables
    enerToken token;
    market mkt;
    address owner;
    uint margin;
    uint price;
    bool active;
    bool buyOrSell;

    //Events

    //Constructor
    function ticket (
        address _marketAddress,     // Address of the market. Since there is one market for each product,
                                    // the address of the market contains the information of the product
        address _tokenAddress,      // Address of the Token we are trading with
        address _agentAddress,      // Address of the owner of the ticket
        uint _price,                // Trading price
        bool _type                  // Type of the ticket: 0 = buying; 1 = selling
        ) public {
        require(msg.sender == _marketAddress);  // Only the associated market contract can print tickets
        token = enerToken(_tokenAddress);
        mkt = market(_marketAddress);
        owner = _agentAddress;
        price = _price;
        margin = 20 * price / 100;
        buyOrSell = _type;
    }

    //Functions
    function activateTicket () public{
        require(msg.sender == owner);           // The ticket can be only activated by its owner
        require(!active);                       // The ticket can be only activated once
        require(token.allowance(msg.sender, this) >= 10 * margin);
        active = true;
        token.transfer(msg.sender, price - margin);
    }

    function settle (uint priceReference) public {
        //require(msg.sender == oraculo?)
        require(active == true);
        require(priceReference != price);
        if (buyOrSell) {
            if (priceReference > price) {
                token.transferFrom(owner, this, priceReference - price);
            } else {
                token.transfer(owner, price - priceReference);
            }
        } else {
            if (priceReference > price) {
                token.transfer(owner, priceReference - price);
            } else {
                token.transferFrom(owner, this, price - priceReference);
            }
        }
    }

}
