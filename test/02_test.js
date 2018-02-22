var MyToken = artifacts.require("./MyToken.sol");
var Market = artifacts.require("./market.sol");
expect = require("chai").expect;

// Tests can be nested into three levels: contract, describe, it
contract("Market", function(accounts){
  // Contracts
  var c_Token;
  var c_Market
  // Events
  var e_NewOffer;
  // Public member variables
  var m_tokenCreator;
  var m_marketCreator;
  var m_contractType;
  var m_tickVolume;
  var m_loadShape;
  // Additional variables
  var agent;
  var price;
  var quantity;
  var type;
  var buyingAccrued;

  // Catch an instance of the Token contract
  it("Catch an instance of the deployed contract (Token)", function(){
    return MyToken.new(10000,"RandomToken",0,"RT", {"from": accounts[5]}).then(function(instance){
      c_Token = instance;
      e_Transfer = c_Token.Transfer({fromBlock: "0", toBlock: "latest"});
      e_Approval = c_Token.Approval({fromBlock: 0, toBlock: "latest"});
    });
  });

  // Catch an instance of the Market contract
  it("Catch an instance of the deployed contract (Market)", function(){
    return Market.new(c_Token.address, 1, 5, "Future", "Base", 5, 5, {"from": accounts[4]}).then(function(instance){
      c_Market = instance;
      // e_TicketCreation = c_Market.ticketCreation({fromBlock: "0", toBlock: "latest"});
      e_NewOffer = c_Market.newOffer({fromBlock: "0", toBlock: "latest"});
    });
  });

  // Verify public variables
  it("Check that values of public variables are correct", function(){
    var data;
    return c_Token.tokenCreator().then(function(res){
      m_tokenCreator = res;
      expect(m_tokenCreator).to.be.equal(accounts[5]);
    }).then(function(){
      return c_Market.marketOperator().then(function(res){
        m_marketCreator = res;
        expect(m_marketCreator).to.be.equal(accounts[4]);
      }).then(function(){
        return c_Market.contractType().then(function(res){
          m_contractType = res;
          expect(m_contractType).to.be.equal("Future");
        }).then(function(){
          return c_Market.tickVolume().then(function(res){
            m_tickVolume = res.toNumber();
            expect(m_tickVolume).to.be.equal(5);
          }).then(function(){
            return c_Market.loadShape().then(function(res){
              m_loadShape = res.toString();
              expect(m_loadShape).to.be.equal("Base");
              data = "\n      Public variables" +
                     "\n      ----------------" +
                     "\n      Token creator: " + m_tokenCreator +
                     "\n      Market operator: " + m_marketCreator +
                     "\n      Contract type: " + m_contractType +
                     "\n      Tick Volume (MWh): " + m_tickVolume +
                     "\n      Load shape: " + m_loadShape +
                     "\n";
              console.log(data);
            });
          });
        });
      });
    });
  });

  // Launch offers
  it("Launch a new offer", function(){
    var data;
    var typestring = "Buying";
    // Define variables to use
    agent = accounts[8];
    price = 58;
    quantity = 4 * m_tickVolume;
    type = 0;
    return c_Token.transfer(agent, 1000, {"from": m_tokenCreator}).then(function(){
      return c_Token.approve(c_Market.address, price * quantity, {"from": agent}).then(function(){
        return c_Market.launchOffer(price, quantity, type, 0, {"from": agent}).then(function(){
          // Catch the event
          e_NewOffer.watch(function(err,eventResponse){
            if (eventResponse.args._type){typestring = "Selling";}
            data = "\n    =>Event: New Offer" +
                   "\n             Price: " + eventResponse.args._price.toNumber() +
                   "\n             Type: " + typestring +
                   "\n";
          });
          return c_Token.balanceOf(agent).then(function(){
            // Print the event information
            for (var i = 0; i < quantity / m_tickVolume; i ++){
              console.log(data);
            }
          });
        });
      });
    });
  });

  it("Stop watching events", function(){
    e_NewOffer.stopWatching();
  });

});
