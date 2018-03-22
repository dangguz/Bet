var MyToken = artifacts.require("./MyToken.sol");
var Market = artifacts.require("./market.sol");
var Ticket = artifacts.require("./ticket.sol");
expect = require("chai").expect;

// Tests can be nested into three levels: contract, describe, it
contract("Market", function(accounts){
  // Contracts
  var c_Token;
  var c_Market;
  var c_Ticket;
  // Events
  var e_NewOffer;
  var e_TicketDestruction;
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
    return Market.new(c_Token.address, 1, 2, "Future", "Base", 2, 5, {"from": accounts[4]}).then(function(instance){
      c_Market = instance;
      e_TicketCreation = c_Market.ticketCreation({fromBlock: "0", toBlock: "latest"});
      e_NewOffer = c_Market.newOffer({fromBlock: "0", toBlock: "latest"});
      e_ticketUserChange = c_Market.ticketUserChange({fromBlock: "0", toBlock: "latest"});
    }).then(function(){
      return c_Token.transfer(c_Market.address, 500, {"from": accounts[5]}).then(function(){
      });
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
  // Create a sequence of offers to be launched
  var numA = 3;
  var numB = 4;
  var seq_type = new Array(0, 0, 1, 1);
  var seq_quantity = new Array(1, 1, 1, 1);
  var seq_price = new Array(50, 48, 51, 49);
  var seq_agent = new Array(
    accounts[0],
    accounts[1],
    accounts[7],
    accounts[8]
  );

  // (1) Initialize the market with some offers
  for(var j = 0; j < numA; j ++){
    sendOfferA(seq_agent[j], seq_price[j], seq_quantity[j], seq_type[j]);
  }

  // (2) Matching offers (ticket creation)
  for(var j = numA; j < numB; j ++){
    sendOfferB(seq_agent[j], seq_price[j], seq_quantity[j], seq_type[j]);
  }

  function sendOfferA(_agent, _price, _quantity, _type){
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

  function sendOfferB(_agent, _price, _quantity, _type){
    it("Create tickets when matching", function(){
      var data_1;
      var data_A;
      var data_B;
      var userA;
      var tpriceA;
      var ttypeA;
      var balanceA;
      var userB;
      var tpriceB;
      var ttypeB;
      var balanceB;
      var priceInfo;
      var typestring = "Buying";
      // Define variables to use
      agent = _agent;
      price = _price;
      quantity = _quantity * m_tickVolume;
      type = _type;
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
                // Catch the events
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
                    data_A = "\n    =>Event: New Ticket" +
                             "\n             ID: " + eventResponse.args._ticketID.toNumber() +
                             "\n             Address: " + eventResponse.args._ticketAddress;
                  }else{
                    c_Ticket_B = Ticket.at(eventResponse.args._ticketAddress);
                    data_B = "\n    =>Event: New Ticket" +
                             "\n             ID: " + eventResponse.args._ticketID.toNumber() +
                             "\n             Address: " + eventResponse.args._ticketAddress;
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
                      }).then(function(){
                        return c_Ticket_A.user().then(function(res){
                          userA = res;
                        }).then(function(){
                          return c_Ticket_A.getBalance({"from": userA}).then(function(res){
                            balanceA = res.toNumber();
                          }).then(function(){
                            return c_Ticket_A.ticketPrice().then(function(res){
                              tpriceA = res.toNumber();
                            }).then(function(){
                              return c_Ticket_A.ticketType().then(function(res){
                                ttypeA = res;
                                data_A += "\n             User: " + userA +
                                          "\n             Price: " + tpriceA +
                                          "\n             Type: " + ttypeA +
                                          "\n             Initial balance: " + balanceA +
                                          "\n";
                              }).then(function(){
                                return c_Ticket_B.user().then(function(res){
                                  userB = res;
                                }).then(function(){
                                  return c_Ticket_B.getBalance({"from": userB}).then(function(res){
                                    balanceB = res.toNumber();
                                  }).then(function(){
                                    return c_Ticket_B.ticketPrice().then(function(res){
                                      tpriceB = res.toNumber();
                                    }).then(function(){
                                      return c_Ticket_B.ticketType().then(function(res){
                                        ttypeB = res;
                                      }).then(function(){
                                        return c_Token.allowance(c_Market.address, c_Ticket_B.address).then(function(res){
                                          data_B += "\n             User: " + userB +
                                                    "\n             Price: " + tpriceB +
                                                    "\n             Type: " + ttypeB +
                                                    "\n             Initial balance: " + balanceB +
                                                    "\n             Allowance*: " + res.toNumber() +
                                                    "\n";
                                          // Print the event information
                                          for (var i = 0; i < quantity / m_tickVolume; i ++){
                                            console.log(data_1);
                                          }
                                          console.log(data_A);
                                          console.log(data_B);
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

  var seq_oracle = new Array(50, 52, 51, 50, 51);
  var t_change = 3;
  var t_sell = 2;
  var ticketID = 1;
  // (3) Ticket balance evolution
  for(var k = 0; k < seq_oracle.length; k ++){
    if(ticketID % 2 == 0){
      oracle(ticketID, seq_oracle[k]);
      oracle(ticketID + 1, seq_oracle[k]);
      if(k == t_change){
        change(ticketID);
        change(ticketID + 1);
      }
    }else{
      oracle(ticketID, seq_oracle[k]);
      oracle(ticketID - 1, seq_oracle[k]);
      if(k == t_change){
        change(ticketID);
        change(ticketID - 1);
      }
      if(k == t_sell){
        sell(ticketID);
      }
      if(k == (seq_oracle.length - 1)){
        kill(ticketID);
        kill(ticketID - 1);
      }
    }
  }

  function kill(_id){
    var data;
    it("Destroy the ticket", function(){
      return c_Market.getTicketAddress(_id, {"from": m_marketCreator}).then(function(res){
        c_Ticket = Ticket.at(res);
        e_TicketDestruction = c_Ticket.TicketDestruction({fromBlock: "0", toBlock: "latest"});
      }).then(function(){
        return c_Ticket.finish().then(function(){
          e_TicketDestruction.watch(function(err,eventResponse){
            if(!err){
              data = "\n    =>Event: Ticket Destruction" +
                     "\n             ID: " + eventResponse.args._ticketID.toNumber() +
                     "\n";
            }
          });
        }).then(function(){
          return c_Token.balanceOf(c_Market.address).then(function(){
            console.log(data);
            e_TicketDestruction.stopWatching();
          });
        });
      });
    });
  }

  function sell(_id){
    var user;
    var data;
    var typestring = "Buying";
    it("Sell the ticket", function(){
      return c_Market.getTicketAddress(_id, {"from": m_marketCreator}).then(function(res){
        c_Ticket = Ticket.at(res);
      }).then(function(){
        return c_Ticket.user().then(function(res){
          user = res;
        }).then(function(){
          return c_Ticket.sellTicket({"from": user}).then(function(){
            // Catch the events
            // When sellTicket() is called, the sequence of events is newOffer->Transfer->ticketUserChange
            e_NewOffer.watch(function(err,eventResponse){
              if(!err){
                if (eventResponse.args._type){typestring = "Selling";}
                data = "\n    =>Event: New Offer" +
                       "\n             Price: " + eventResponse.args._price.toNumber() +
                       "\n             Type: " + typestring +
                       "\n";
              }
            });
            e_Transfer.watch(function(err,eventResponse){
              if(!err){
                data2 = "\n    =>Event: Transfer" +
                        "\n             from: " + eventResponse.args._from +
                        "\n             to: " + eventResponse.args._to +
                        "\n             value: " + eventResponse.args._value.toNumber() +
                        "\n";
              }
            });
            e_ticketUserChange.watch(function(err,eventResponse){
              data3 = "\n    =>Event: Ticket User Change" +
                      "\n             ID: " + eventResponse.args._ticketID.toNumber() +
                      "\n";
            });
          }).then(function(){
            return c_Token.balanceOf(user).then(function(res){
              console.log(data);
              console.log(data2);
              console.log(data3);
              console.log(res.toNumber());
            });
          });
        });
      });
    });
  }

  function change(_id){
    it("Change the period", function(){
      return c_Market.getTicketAddress(_id, {"from": m_marketCreator}).then(function(res){
        c_Ticket = Ticket.at(res);
      }).then(function(){
        return c_Ticket.changePeriod().then(function(){
        });
      });
    });
  }

  function oracle(_id, _signal){
    var balance;
    var ttype;
    var user;
    var data;
    it("Send price signal from oracle account", function(){
      return c_Market.getTicketAddress(_id, {"from": m_marketCreator}).then(function(res){
        c_Ticket = Ticket.at(res);
      }).then(function(){
        return c_Ticket.ticketType().then(function(res){
          ttype = res;
        }).then(function(){
          return c_Ticket.updateTicketBalance(_signal).then(function(){
            return c_Ticket.user().then(function(res){
              user = res;
            }).then(function(){
              return c_Ticket.getBalance({"from": user}).then(function(res){
                balance = res.toNumber();
                if(ttype){
                  data = "\n    =>New Price Signal: " + _signal +
                         "\n      ID: " + _id +
                         "\n      Seller: " + user +
                         "\n      Balance: " + balance +
                         "\n";
                }else{
                  data = "\n    =>New Price Signal: " + _signal +
                         "\n      ID: " + _id +
                         "\n      Buyer: " + user +
                         "\n      Balance: " + balance +
                         "\n";
                }
                console.log(data);
              });
            });
          });
        });
      });
    });
  }

  it("Stop watching events", function(){
    e_NewOffer.stopWatching();
    e_TicketCreation.stopWatching();
    e_ticketUserChange.stopWatching();
    e_Transfer.stopWatching();
  });

  // function printBalance(_index){
  //   it("", function(){
  //     return c_Token.balanceOf(accounts[_index]).then(function(res){
  //       console.log("\n " + accounts[_index] + " -> " + res.toNumber());
  //     });
  //   });
  // }

});
