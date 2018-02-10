pragma solidity ^0.4.8;

import "./OneUserOneOwner.sol";
import "./MyToken.sol";
import "./Market.sol";

contract Ticket is OneUserOneOwner {
    // Data struct

    // Variables
    MyToken token;
    Market mkt;
    uint ID;
    uint public ticketPrice;
    uint ticketBalance;             // Balance for updating profit and loss
    uint priceReference;            // Reference to compare with when updating the balance
    uint threshold;                 // Threshold between negotiation and delivery periods
    uint finishDate;                // Last day of the delivery period
    bool period;                    // Period: 0 = negotiation, 1 = delivery
    bool ticketType;
    uint buy = 1; uint sell = 0;    // Defaulting to buy

    // Events

    // Modifiers

    // Constructor
    function Ticket (
        uint _ticketID,
        address _marketAddress,     // Address of the market. Since there is one market for each product,
                                    // the address of the market contains the information of the product
        address _tokenAddress,      // Address of the Token we are trading with
        address _agentAddress,      // Address of the owner of the ticket
        uint _price,                // Trading price
        bool _type                  // Type of the ticket: 0 = buying; 1 = selling
        ) public {
        require (msg.sender == _marketAddress);  // Only the associated market contract can print tickets
        ID = _ticketID;
        token = MyToken(_tokenAddress);
        mkt = Market(_marketAddress);
        user = _agentAddress;
        //threshold = mkt.product().deliveryDate;
        //finishDate = threshold + mkt.product.contractMaturity();
        ticketPrice = _price;
        priceReference = ticketPrice;
        ticketBalance = token.balanceOf(this);  // Initialize the ticket balance
        ticketType = _type;
    }

    // Functions
    function updateTicketBalance (uint _energyPrice) public {
        //require (msg.sender == oracle)
        if (ticketType) { buy = 0; sell = 1;}            // Correct the variables if selling ticket
        if (now > threshold) { period = true; }
        if (period) { priceReference = ticketPrice; }
        if (priceReference != _energyPrice)
        ticketBalance += sell * (priceReference - _energyPrice) + buy * (_energyPrice - priceReference);
        if (!period) { priceReference = _energyPrice; }
        if (now == finishDate) { closeTicket(); }
    }

    function closeTicket () internal {
        token.transfer(mkt, token.balanceOf(this));
        token.transferFrom(mkt, owner, ticketBalance);
        selfdestruct(mkt);
    }

    function sellTicket () public onlyUser {
        if (ticketType) {
            mkt.launchOffer(mkt.maxPrice(), 1, !ticketType, ID);
        } else {
            mkt.launchOffer(0, 1, !ticketType, ID);
        }
    }

}
