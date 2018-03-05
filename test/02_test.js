var MyToken = artifacts.require("../contractsMyToken.sol");
var Market = artifacts.require("../contractsmarket.sol");
var Ticket = artifacts.require("../contractsticket.sol");
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
  var m_priceScale;
  var m_maxPrice = 100;
  var m_pricesLength = 101;
  // Additional variables
  var agent;
  var price;
  var quantity;
  var type;
  var buyingAccrued_before;
  var buyingAccrued_after;
  var sellingAccrued_before;
  var sellingAccrued_after;
  var buyingOffers_num_before;
  var buyingOffers_num_after;
  var sellingOffers_num_before;
  var sellingOffers_num_after;

  // Catch an instance of the Token contract
  it("Catch an instance of the deployed contract (Token)", function(){
    return MyToken.new(10000,"RandomToken",0,"RT", {"from": accounts[5]}).then(function(instance){
      c_Token = instance;
      e_Transfer = c_Token.Transfer({fromBlock: "0", toBlock: "latest"});
      e_Approval = c_Token.Approval({fromBlock: "0", toBlock: "latest"});
    });
  });

  // Catch an instance of the Market contract
  it("Catch an instance of the deployed contract (Market)", function(){
    return Market.new(c_Token.address, 1, 2, "Future", "Base", 5, 5, {"from": accounts[4]}).then(function(instance){
      c_Market = instance;
      e_TicketCreation = c_Market.ticketCreation({fromBlock: "0", toBlock: "latest"});
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
            expect(m_tickVolume).to.be.equal(2);
          }).then(function(){
            return c_Market.loadShape().then(function(res){
              m_loadShape = res.toString();
              expect(m_loadShape).to.be.equal("Base");
            }).then(function(){
              return c_Market.priceScale().then(function(res){
                m_priceScale = res.toNumber();
                expect(m_priceScale).to.be.equal(m_maxPrice/(m_pricesLength-1));
                data = "\n      Public variables" +
                       "\n      ----------------" +
                       "\n      Token creator: " + m_tokenCreator +
                       "\n      Market operator: " + m_marketCreator +
                       "\n      Contract type: " + m_contractType +
                       "\n      Tick Volume (MWh): " + m_tickVolume +
                       "\n      Load shape: " + m_loadShape +
                       "\n      Price scale: " + m_priceScale +
                       "\n";
                console.log(data);
              });
            });
          });
        });
      });
    });
  });

  // Check functionalities
  // (1) Initialize the market with some offers

  // Create a sequence of offers to be launched
  var num = 5;
  var seq_type = new Array(0, 1, 0, 1, 1);
  var seq_quantity = new Array(1, 1, 2, 1, 3);
  var seq_price = new Array(38, 52, 43, 45, 80);
  var seq_agent = new Array(accounts[1], accounts[8], accounts[2], accounts[7], accounts[9]);
  for(var j = 0; j < num; j ++){
    sendOffer(seq_agent[j], seq_price[j], seq_quantity[j], seq_type[j]);
  }

  function sendOffer(_agent, _price, _quantity, _type) {
    it("Launch a new offer", function(){
      var data;
      var priceInfo;
      var typestring = "Buying";
      // Define variables to use
      agent = _agent;
      price = _price;
      quantity = _quantity * m_tickVolume;
      type = _type;
      return c_Market.getNumOffers(price/m_priceScale, 0).then(function(res){
        buyingOffers_num_before = res.toNumber();
      }).then(function(){
        return c_Market.getNumOffers(price/m_priceScale, 1).then(function(res){
          sellingOffers_num_before = res.toNumber();
        }).then(function(){
          // Agent must have some tokens in its account
          return c_Token.transfer(agent, 1000, {"from": m_tokenCreator}).then(function(){
            // Agent must approve the contract to spend its funds
            return c_Token.approve(c_Market.address, price * quantity, {"from": agent}).then(function(){
              // Launch the offer
              return c_Market.launchOffer(price, quantity, type, 0, {"from": agent}).then(function(){
                // Catch the event
                e_NewOffer.watch(function(err,eventResponse){
                  if (eventResponse.args._type){typestring = "Selling";}
                  data = "\n    =>Event: New Offer" +
                         "\n             Price: " + eventResponse.args._price.toNumber() +
                         "\n             Type: " + typestring +
                         "\n";

                });
                // Get the final state of the variables at the selected price
                return c_Market.getNumOffers(price/m_priceScale, 0).then(function(res){
                  buyingOffers_num_after = res.toNumber();
                }).then(function(){
                  return c_Market.getNumOffers(price/m_priceScale, 1).then(function(res){
                    sellingOffers_num_after = res.toNumber();
                  }).then(function(){
                    return c_Market.getAccrued(price/m_priceScale, 0).then(function(res){
                      buyingAccrued_after = res.toNumber();
                    }).then(function(){
                      return c_Market.getAccrued(price/m_priceScale, 1).then(function(res){
                        sellingAccrued_after = res.toNumber();
                        priceInfo = "\n      Price information" +
                                    "\n      -----------------" +
                                    "\n      ID: " + price/m_priceScale +
                                    "\n      Value: " + price +
                                    "\n      Total Buying Offers: " + buyingOffers_num_after +
                                    "\n      Total Selling Offers: " + sellingOffers_num_after +
                                    "\n      Buying Accrued: " + buyingAccrued_after +
                                    "\n      Selling Accrued: " + sellingAccrued_after +
                                    "\n";
                        // Print the event information
                        for (var i = 0; i < quantity / m_tickVolume; i ++){
                          console.log(data);
                        }
                        console.log(priceInfo);
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  }

  // (2) Match two offers (ticket creation)
  it("Create tickets when matching", function(){
    var data_1;
    var data_2;
    var data_3;
    var priceInfo;
    var typestring = "Buying";
    // Define variables to use
    agent = accounts[3];
    price = 48;
    quantity = 3 * m_tickVolume;
    type = 0;
    // Check the initial state of the variables at the selected price
    return c_Market.getNumOffers(price/m_priceScale, 0).then(function(res){
      buyingOffers_num_before = res.toNumber();
    }).then(function(){
      return c_Market.getNumOffers(price/m_priceScale, 1).then(function(res){
        sellingOffers_num_before = res.toNumber();
      }).then(function(){
        // Agent must have some tokens in its account
        return c_Token.transfer(agent, 1000, {"from": m_tokenCreator}).then(function(){
          // Agent must approve the contract to spend its funds
          return c_Token.approve(c_Market.address, price * quantity, {"from": agent}).then(function(){
            // Launch the offer
            return c_Market.launchOffer(price, quantity, type, 0, {"from": agent}).then(function(){
              // Catch the event
              e_NewOffer.watch(function(err,eventResponse){
                if (eventResponse.args._type){typestring = "Selling";}
                data_1 = "\n    =>Event: New Offer" +
                         "\n             Price: " + eventResponse.args._price.toNumber() +
                         "\n             Type: " + typestring +
                         "\n";

              });
              e_TicketCreation.watch(function(err,eventResponse){
                if (eventResponse.args._ticketID.toNumber() % 2 == 0){
                  c_Ticket_A = Ticket.at(eventResponse.args._ticketAddress);
                  return c_Ticket_A.user().then(function(res){
                    user = res;
                  }).then(function(){
                    return c_Ticket_A.ticketPrice().then(function(res){
                      tprice = res.toNumber();
                    }).then(function(){
                      return c_Ticket_A.ticketType().then(function(res){
                        ttype = res;
                        data_2 = "\n    =>Event: New Ticket" +
                                 "\n             ID: " + eventResponse.args._ticketID.toNumber() +
                                 "\n             Address: " + eventResponse.args._ticketAddress +
                                 "\n             User: " + user +
                                 "\n             Price: " + tprice +
                                 "\n             Type: " + ttype +
                                 "\n";
                      });
                    });
                  });
                }else{
                  c_Ticket_B = Ticket.at(eventResponse.args._ticketAddress);
                  return c_Ticket_B.user().then(function(res){
                    user = res;
                  }).then(function(){
                    return c_Ticket_B.ticketPrice().then(function(res){
                      tprice = res.toNumber();
                    }).then(function(){
                      return c_Ticket_B.ticketType().then(function(res){
                        ttype = res;
                        data_3 = "\n    =>Event: New Ticket" +
                                 "\n             ID: " + eventResponse.args._ticketID.toNumber() +
                                 "\n             Address: " + eventResponse.args._ticketAddress +
                                 "\n             User: " + user +
                                 "\n             Price: " + tprice +
                                 "\n             Type: " + ttype +
                                 "\n";
                      });
                    });
                  });
                }
              });
              // Get the final state of the variables at the selected price
              return c_Market.getNumOffers(price/m_priceScale, 0).then(function(res){
                buyingOffers_num_after = res.toNumber();
              }).then(function(){
                return c_Market.getNumOffers(price/m_priceScale, 1).then(function(res){
                  sellingOffers_num_after = res.toNumber();
                }).then(function(){
                  return c_Market.getAccrued(price/m_priceScale, 0).then(function(res){
                    buyingAccrued_after = res.toNumber();
                  }).then(function(){
                    return c_Market.getAccrued(price/m_priceScale, 1).then(function(res){
                      sellingAccrued_after = res.toNumber();
                      priceInfo = "\n      Price information" +
                                  "\n      -----------------" +
                                  "\n      ID: " + price/m_priceScale +
                                  "\n      Value: " + price +
                                  "\n      Total Buying Offers: " + buyingOffers_num_after +
                                  "\n      Total Selling Offers: " + sellingOffers_num_after +
                                  "\n      Buying Accrued: " + buyingAccrued_after +
                                  "\n      Selling Accrued: " + sellingAccrued_after +
                                  "\n";
                      // Print the event information
                      for (var i = 0; i < quantity / m_tickVolume; i ++){
                        console.log(data_1);
                      }
                      console.log(data_2);
                      console.log(data_3);
                      console.log(priceInfo);
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  });

  it("Stop watching events", function(){
    e_NewOffer.stopWatching();
    e_TicketCreation.stopWatching();
  });

});
