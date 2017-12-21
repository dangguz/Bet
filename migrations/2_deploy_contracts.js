var apu = artifacts.require("./ApuestaSimple.sol");
var bet = artifacts.require("./Bet1.sol");
var mer = artifacts.require("./Mercado.sol");
//Arriba: meter los contratos que se importan
//Abajo: deployer.deploy(instanciaContratoADesplegar)
module.exports = function(deployer) {
  deployer.deploy(apu);
  deployer.deploy(bet);
  deployer.deploy(mer);
};
