var tok = artifacts.require("../contracts/enerToken.sol");
var mar = artifacts.require("../contracts/market.sol");
var tic = artifacts.require("../contracts/ticket.sol");
//Arriba: meter los contratos que se importan
//Abajo: deployer.deploy(instanciaContratoADesplegar)
module.exports = function(deployer) {
  deployer.deploy(tok);
  deployer.deploy(mar);
  deployer.deploy(tic);
};
