pragma solidity ^0.4.8;

import "./enerToken.sol";
import "./ticket.sol";

contract market {

    // Data struct
    struct derivative {
        uint ID;                  // Identificator of the product
        uint tickVolume;          // Quantity traded per offer
        string contractType;      // i.e. future, forward, option, or swap
        string loadShape;         // i.e. base, or peak
        string contractMaturity;  // i.e. D, WE, Wk, M, Q or Y
        string deliveryDate;      // First day of the delivery period
    }

    struct price {
        uint value;
        address [] buyingOffers;
        address [] sellingOffers;
        uint buyingAccrued;       // Accumulated value of buying offers from the highest buying offer price
        uint sellingAccrued;      // Accumulated value of selling offers from the lowest selling offer price
    }

    // Variables
    enerToken token;
    address marketOperator;
    derivative product;
    price [101] prices;
    uint maxPrice = 100;
    uint priceScale = maxPrice / (prices.length - 1);

    //ticketlist = mapping(address => uint);

    //Events
    //event newTicket (address ticketAddress, uint reference);

    // Constructor
    function market (
        address _tokenAddress,
        uint _ID,
        uint _tickVolume,
        string _contractType,
        string _loadShape,
        string _contractMaturity,
        string _deliveryDate
        ) public {
        marketOperator = msg.sender;
        token = enerToken(_tokenAddress);
        product.ID = _ID;
        product.tickVolume = _tickVolume;
        product.contractType = _contractType;
        product.loadShape = _loadShape;
        product.contractMaturity = _contractMaturity;
        product.deliveryDate = _deliveryDate;
    }

    // Functions
    function launchOffer (uint _price, uint _quantity, bool _type) public {
        require (_price % priceScale == 0 && _price <= maxPrice);
        require (token.allowance(msg.sender, this) >= _price);
        require (_quantity % product.tickVolume == 0);

        for (uint j = product.tickVolume; j <= _quantity; j += product.tickVolume) {
            uint i;
            uint priceID = _price / priceScale;

            // Correct the price
            if ((_type && prices[priceID + 1].buyingAccrued > 0)||(!_type && prices[priceID - 1].sellingAccrued > 0)){
                if (_type) {
                    for (; prices[priceID + 1].buyingAccrued > 0; priceID ++){}
                } else {
                    for (; prices[priceID - 1].sellingAccrued > 0; priceID --){}
                }
            }

            var auxA = prices[priceID].buyingOffers;  // Assigns a pointer to the corresponding offers vector
            var auxB = prices[priceID].sellingOffers;
            if (_type) {
                auxA = prices[priceID].sellingOffers;
                auxB = prices[priceID].buyingOffers;
            }

            // Add a new offer
            auxA.push(msg.sender);
            if (auxA.length <= auxB.length) {
                uint pos = auxA.length - 1;
                address counterpart = auxB[pos];
                prices[priceID].value = priceID * priceScale;
                createTicket(msg.sender, prices[priceID].value, _type);
                createTicket(counterpart, prices[priceID].value, !_type);
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
        //require (msg.sender == address(this));
        address newTicket;
        newTicket = new ticket(this, token, _agent, _price, _type);
        token.transferFrom(_agent, newTicket, _price);
        //tickectList[newTicket] = /*elquesliea*/;
    }

}
