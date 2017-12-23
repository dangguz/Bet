pragma solidity ^0.4.8;

//import "./lib/owned.sol"; //cambiar por multiowne si necesario

import "./enerToken.sol";

contract ticket {
  //Data struct

  //Variables

  //Events

  //Constructor
  function ticket (address _tokenAddress){
    address token;
    token = enerToken(_tokenAddress);
  }
  //Functions

}
