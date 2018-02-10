pragma solidity ^0.4.8;

import "./MyToken.sol";
import "./Ticket.sol";

contract Market {

    // Data struct
    struct derivative {
        uint ID;                  // Identificator of the product
        uint tickVolume;          // Quantity traded per offer
        string contractType;      // i.e. future, forward, option, or swap
        string loadShape;         // i.e. base or peak
        uint contractMaturity;    // i.e. D, WE, Wk, M, Q or Y; duration (days)
        uint deliveryDate;        // First day of the delivery period
    }

    struct price {
        uint value;
        address [] buyingOffers;
        address [] sellingOffers;
        // Accrued values for correcting the price
        uint buyingAccrued;       // Accumulated value of buying offers from the highest buying offer price
        uint sellingAccrued;      // Accumulated value of selling offers from the lowest selling offer price
    }

    // Variables
    MyToken token;
    Ticket t;
    address public marketOperator;
    derivative public product;
    price [101] prices;
    uint public maxPrice = 100;
    uint priceScale = maxPrice / (prices.length - 1);
    uint margin;
    uint ticketID;

    mapping (uint => address) ticketList;

    //Events
    event ticketCreation (address ticketAddress, uint ticketID);

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
        product.ID = _ID;
        product.tickVolume = _tickVolume;
        product.contractType = _contractType;
        product.loadShape = _loadShape;
        product.contractMaturity = _contractMaturity;
        product.deliveryDate = (now / 1 days) + _daysToDeliveryDate;
    }

    // Functions
    function launchOffer (uint _price, uint _quantity, bool _type, uint _ID) public {
        require (_price % priceScale == 0 && _price <= maxPrice);
        require (token.allowance(msg.sender, this) >= _price);
        require (_quantity % product.tickVolume == 0);

        for (uint j = product.tickVolume; j <= _quantity; j += product.tickVolume) {
            uint i;
            uint priceID = _price / priceScale;

            // Correct the price
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
            if (auxA.length <= auxB.length) {
                uint pos = auxA.length - 1;
                address counterpart = auxB[pos];
                prices[priceID].value = priceID * priceScale;
                if (msg.sender == ticketList[_ID]) {
                    t = Ticket(msg.sender);
                    uint priceDiff = prices[priceID].value - t.ticketPrice();
                    token.transferFrom(counterpart, t.getUser(), token.balanceOf(t) + priceDiff);
                    t.transferUser(counterpart);
                  } else {
                    createTicket(msg.sender, prices[priceID].value, _type);
                    createTicket(counterpart, prices[priceID].value, !_type);
                }
                // Update accrued curves
                if (_type) {
                    for (i = 0; i <= priceID; i ++)
                    prices[i].buyingAccrued --;
                } else {
                    for (i = priceID; i < 101; i ++)
                    prices[i].sellingAccrued --;
                }
            } else {
                if (_type) {
                    for (i = priceID; i < 101; i ++)
                    prices[i].sellingAccrued ++;
                } else {
                    for (i = 0; i <= priceID; i ++)
                    prices[i].buyingAccrued ++;
                }
            }
        }
    }

    function createTicket (address _agent, uint _price, bool _type) internal {
        address newTicket = ticketList[ticketID];
        newTicket = new Ticket(ticketID, this, token, _agent, _price, _type);
        ticketCreation(newTicket, ticketID);
        margin = _price / 5;
        token.transferFrom(_agent, newTicket, margin);
        ticketID ++;
    }

    function getTicketAddress (uint _ticketID) public returns (address ticketAddress) {
        require (msg.sender == marketOperator);
        ticketAddress = ticketList[_ticketID];
        return ticketAddress;
    }

}
