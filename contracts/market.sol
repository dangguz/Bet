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
        ) {
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
    function launchOffer (uint _price, bool _type) {
        require (_price % priceScale == 0 && _price <= maxPrice);
        require (token.allowance(msg.sender, this) >= _price);

        uint i;
        uint price = _price / priceScale + 1;

        // Correct the price
        if ((_type && prices[price + 1].buyingAccrued > 0)||(!_type && prices[price - 1].sellingAccrued > 0)){
            if (_type) {
                for (; prices[price + 1].buyingAccrued > 0; price ++){}
            } else {
                for (; prices[price - 1].sellingAccrued > 0; price --){}
            }
        }

        var auxA = prices[price].buyingOffers;  // Assigns a pointer to the corresponding offers vector
        var auxB = prices[price].sellingOffers;
        if (_type) {
            auxA = prices[price].sellingOffers;
            auxB = prices[price].buyingOffers;
        }

        // Add a new offer
        auxA.push(msg.sender);
        if (auxA.length <= auxB.length) {
            uint pos = auxA.length - 1;
            address counterpart = auxB[pos];
            createTicket(msg.sender, price, _type);
            createTicket(counterpart, price, !_type);
            if (_type) {
                for (i = 0; i <= price; i ++)
                prices[i].buyingAccrued --;
            } else {
                for (i = price; i < 101; i ++)
                prices[i].sellingAccrued --;
            }
        } else {
            if (_type) {
                for (i = price; i < 101; i ++)
                prices[i].sellingAccrued ++;
            } else {
                for (i = 0; i <= price; i ++)
                prices[i].buyingAccrued ++;
            }
        }
    }

    function createTicket (address _agent, uint _price, bool _type) internal {
        //require (msg.sender == address(this));
        address newTicket;
        newTicket = new ticket(this, token, _agent, _price, _type);
        //tickectList[newTicket] = /*elquesliea*/;
    }

}
