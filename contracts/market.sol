pragma solidity ^0.4.8;

import "./enerToken.sol";
import "./ticket.sol";

contract market {

  //Data struct
  enum types {base, peak}

  struct product {
    uint quantity;
    string period;
    string deliveryDate;
  }

  //Variables
  address token;
  //ticketlist = mapping(address => uint);

  //Events
  //event newTicket (address ticketAddress, uint reference);

  //Constructor
  function market (
    address _tokenAddress,
    uint _quantity,
    string _period,
    string _deliveryDate
    ) {

    token = enerToken(_tokenAddress);

    product.quantity = _quantity;
    product.period = _period;
    product.deliveryDate = _deliveryDate;

  }

  //Functions
  function launchOffer (uint _price, bool _type) {
    createTicket(msg.sender, _price, _type);

  }

  function createTicket (address _agent, uint _price, bool _type) {
    address newTicket;
    newTicket = new ticket(_agent, price, _type);

    //tickectList[newTicket] = /*elquesliea*/;
  }

}
