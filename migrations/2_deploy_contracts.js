var MyToken = artifacts.require("../contracts/MyToken.sol");
var market = artifacts.require("../contracts/market.sol");
//var ticket = artifacts.require("./ticket.sol");

module.exports = function(deployer) {
  deployer.deploy(MyToken);
  deployer.deploy(market);
  //deployer.deploy(ticket);
};
