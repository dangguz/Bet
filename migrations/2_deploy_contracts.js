var MyToken = artifacts.require("./MyToken.sol");
var market = artifacts.require("./market.sol");
//var ticket = artifacts.require("./ticket.sol");

module.exports = function(deployer) {
  deployer.deploy(MyToken);
  deployer.deploy(market);
  //deployer.deploy(ticket);
};
