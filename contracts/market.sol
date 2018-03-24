pragma solidity ^0.4.8;

import "./MyToken.sol";
import "./ticket.sol";

contract Market {

    // Data struct
    struct price {
        uint value;                 // Tokens per energy unit
        address [] buyingOffers;
        address [] sellingOffers;
        // Accrued values for correcting the price
        uint buyingAccrued;         // Accumulated value of buying offers from the highest buying offer price
        uint sellingAccrued;        // Accumulated value of selling offers from the lowest selling offer price
    }

    // Variables
    // Public variables (accessible from Ticket)
    uint public productID;          // Identificator of the product
    uint public tickVolume;         // Quantity (MWh) traded per offer
    uint public contractMaturity;   // i.e. D, WE, Wk, M, Q or Y; duration (days)
    uint public deliveryDate;       // First day of the delivery period
    uint public maxPrice = 100;     // Maximum price available
    string public contractType;     // i.e. future, forward, option, or swap
    string public loadShape;        // i.e. base or peak
    address public marketOperator;
    price [101] public prices;
    uint public priceScale = maxPrice / (prices.length - 1);
    // External contracts
    MyToken token;
    Ticket t;
    // Mappings
    mapping (uint => address) ticketList;
    mapping (address => bool) public isTicket;
    mapping (uint => mapping (uint => bool)) public cancelled;
    // Additional variables
    uint margin;
    uint ticketID;                  // Identificator of the ticket

    // Events
    event ticketCreation (address _ticketAddress, uint _ticketID);
    event newOffer (uint _price, uint _priceID, bool _type, uint _offerID);
    event ticketUserChange (uint _ticketID);

    // Constructor
    function Market (
        address _tokenAddress,
        uint _ID,
        uint _tickVolume,
        string _contractType,
        string _loadShape,
        uint _contractMaturity,
        uint _daysToDeliveryDate
        ) public {
        marketOperator = msg.sender;
        token = MyToken(_tokenAddress);
        productID = _ID;
        tickVolume = _tickVolume;
        contractType = _contractType;
        loadShape = _loadShape;
        contractMaturity = _contractMaturity;
        deliveryDate = (now / 1 days) + _daysToDeliveryDate;
    }

    // Functions
    function launchOffer (uint _price, uint _quantity, bool _type, uint _ID) public {
        // Check offer parameters are valid
        require (_quantity % tickVolume == 0);
        require (_price % priceScale == 0 && _price <= maxPrice);
        // Check the sender has allowed this contract to spend its funds, unless the sender is a ticket
        require (token.allowance(msg.sender, this) >= (_price * _quantity) || isTicket[msg.sender]);

        for (uint j = tickVolume; j <= _quantity; j += tickVolume) {
            uint priceID = _price / priceScale;

            // Correct the price if necessary
            if ((_type && prices[priceID + 1].buyingAccrued > 0) || (!_type && prices[priceID - 1].sellingAccrued > 0)){
                if (_type) {
                    for (; prices[priceID + 1].buyingAccrued > 0; priceID ++){}
                } else {
                    for (; prices[priceID - 1].sellingAccrued > 0; priceID --){}
                }
            }

            var auxA = prices[priceID].buyingOffers;  // Assigns a pointer to the corresponding offers vector (default)
            var auxB = prices[priceID].sellingOffers;
            if (_type) {                              // Change the pointers if _type = selling
                auxA = prices[priceID].sellingOffers;
                auxB = prices[priceID].buyingOffers;
            }

            // Add a new offer
            auxA.push(msg.sender);
            newOffer(priceID * priceScale, priceID, _type, auxA.length);
            if (auxA.length <= auxB.length) {         // Two offers have matched
                uint pos = auxA.length - 1;
                address counterpart = auxB[pos];
                prices[priceID].value = priceID * priceScale;
                // Check if the offer have been cancelled
                if (cancelled[priceID][pos]) {
                  j -= tickVolume;
                } else {
                    // Check for strange cases
                    if (msg.sender == counterpart || (isTicket[msg.sender] && isTicket[counterpart])) {
                        revert();
                    } else if (isTicket[msg.sender] || isTicket[counterpart]) {
                        // If the sender/counterpart is a ticket, no new ticket has to be created; the ticket user is updated instead
                        // New user must pay the difference between the current trading price and the price registered in the ticket,
                        // plus the initial margin calculated at original ticket price
                        // Default assumes counterpart as the ticket
                        address existingTicket = counterpart;
                        address newUser = msg.sender;
                        // Correct variables if the ticket is the sender
                        if (isTicket[msg.sender]) {
                            existingTicket = msg.sender;
                            newUser = counterpart;
                        }
                        t = Ticket(existingTicket); // Catch the contract
                        uint transferValue = t.ticketPrice() / 5; // Initial margin
                        transferValue += contractMaturity * (t.ticketPrice() - prices[priceID].value); // Include price difference
                        // Correct transferValue if selling
                        if(_type)
                        transferValue += 2 * contractMaturity * (prices[priceID].value - t.ticketPrice());
                        transferValue *= tickVolume; // Increase proportionally to the tick volume
                        // Execute the transfer
                        token.transferFrom(newUser, t.user(), transferValue);
                        t.transferUser(newUser);
                        ticketUserChange(t.ID());
                    } else {
                        // Create two tickets, one for each offer
                        createTicket(msg.sender, prices[priceID].value, _type);
                        createTicket(counterpart, prices[priceID].value, !_type);
                    }
                    // Update accrued curves
                    updateAccruedCurves(!_type, false, priceID);
                }
            } else {
                // Update accrued curves
                updateAccruedCurves(_type, true, priceID);
            }
        }
    }

    function updateAccruedCurves (bool _type, bool _increase, uint _priceID) internal {
        uint i;
        if (_type && _increase) {
            for (i = _priceID; i < prices.length; i ++)
            prices[i].sellingAccrued ++;
        } else if (_type && !_increase) {
            for (i = _priceID; i < prices.length; i ++)
            prices[i].sellingAccrued --;
        } else if (!_type && !_increase) {
            for (i = 0; i <= _priceID; i ++)
            prices[i].buyingAccrued --;
        } else {
            for (i = 0; i <= _priceID; i ++)
            prices[i].buyingAccrued ++;
        }
    }

    function createTicket (address _agent, uint _price, bool _type) internal {
        address newTicket = new Ticket(ticketID, this, token, _agent, _price, _type); // Deploy the contract
        ticketList[ticketID] = newTicket;     // Update the list
        isTicket[newTicket] = true;           // Update ticket detector
        ticketCreation(newTicket, ticketID);  // Launch the event
        margin = _price / 5;
        token.transferFrom(_agent, newTicket, margin * tickVolume);
        token.approve(newTicket, 100);
        ticketID ++;
    }

    function cancellOffer (uint _priceID, uint _offerID, bool _type) public {
        require ((msg.sender == prices[_priceID].buyingOffers[_offerID - 1] && !_type) || (msg.sender == prices[_priceID].sellingOffers[_offerID - 1] && _type));
        // Cancell the offer
        cancelled[_priceID][_offerID - 1] = true;
        // Update accrued curves
        updateAccruedCurves(_type, false, _priceID);
    }

    function getTicketAddress (uint _ticketID) public constant returns (address ticketAddress) {
        require (msg.sender == marketOperator);
        ticketAddress = ticketList[_ticketID];
        return ticketAddress;
    }

    function getAccrued (uint _priceID, bool _type) public constant returns (uint accrued) {
        accrued = prices[_priceID].buyingAccrued;
        if (_type)
        accrued = prices[_priceID].sellingAccrued;
        return accrued;
    }

    function getNumOffers (uint _priceID, bool _type) public constant returns (uint num) {
       num = prices[_priceID].buyingOffers.length;
       if (_type)
       num = prices[_priceID].sellingOffers.length;
       return num;
    }

}
