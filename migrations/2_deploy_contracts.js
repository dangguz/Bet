var apu = artifacts.require("../contracts/betToken.sol");
var bet = artifacts.require("../contracts/mercado.sol");
var mer = artifacts.require("../contracts/ticket.sol");
//Arriba: meter los contratos que se importan
//Abajo: deployer.deploy(instanciaContratoADesplegar)
module.exports = function(deployer) {
  deployer.deploy(apu);
  deployer.deploy(bet);
  deployer.deploy(mer);
};
