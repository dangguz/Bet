pragma solidity ^0.4.8;

import "./OneUserOneOwner.sol";
import "./MyToken.sol";
import "./market.sol";

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
    bool public ticketType;
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
        uint _price,                // Trading price (tokens per MWh)
        bool _type                  // Type of the ticket: 0 = buying; 1 = selling
        ) public {
        require (msg.sender == _marketAddress);  // Only the associated market contract can print tickets
        ID = _ticketID;
        token = MyToken(_tokenAddress);
        mkt = Market(_marketAddress);
        user = _agentAddress;
        threshold = mkt.deliveryDate();
        finishDate = threshold + mkt.contractMaturity();
        ticketPrice = _price;
        priceReference = ticketPrice;
        ticketBalance = token.balanceOf(this);  // Initialize the ticket balance
        ticketBalance /= mkt.tickVolume();      // Correct the balance if tick volume is greater than 1
        ticketType = _type;
    }

    // Functions
    function updateTicketBalance (uint _energyPrice) public {
        //require (msg.sender == oracle);                   // Oracle must send the price signal
        if (ticketType) { buy = 0; sell = 1;}               // Correct the variables if selling ticket
        if ((now / 1 days) > threshold) { period = true; }  // Update the period when now (days) reaches the threshold
        if (period) { priceReference = ticketPrice; }
        // Update the ticket balance if necessary
        if (priceReference != _energyPrice)
        ticketBalance += sell * (priceReference - _energyPrice) + buy * (_energyPrice - priceReference);
        if (!period) { priceReference = _energyPrice; }
        if ((now / 1 days) == finishDate) { closeTicket(); }
    }

    function closeTicket () internal {
        token.transfer(mkt, token.balanceOf(this));
        token.transferFrom(mkt, user, ticketBalance * mkt.tickVolume());
        selfdestruct(mkt);    // Destroy this contract
    }

    function sellTicket () public onlyUser {
        require (!period);    // Ticket can only be sold in the negotiation period
        // Place an offer with type = !ticketType
        if (ticketType) {
            mkt.launchOffer(mkt.maxPrice(), mkt.tickVolume(), !ticketType, ID);
        } else {
            mkt.launchOffer(0, mkt.tickVolume(), !ticketType, ID);
        }
    }

}
