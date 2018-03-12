var MyToken = artifacts.require("./MyToken.sol");
var Market = artifacts.require("./market.sol");
var Ticket = artifacts.require("./ticket.sol");
expect = require("chai").expect;

contract("Market", function(accounts){
  // Contracts
  var c_Token;
  var c_Market;
  // Public member variables
  var m_tokenCreator = accounts[5];
  var m_marketCreator = accounts[4];
  var m_tickVolume = 1;
  var m_priceScale = 1;
  // Define variables for this test
  var negotiationPeriod = 4;
  var deliveryPeriod = 2;
  var ticketPriceA = 50;
  var sellActive = false;
  var ticketPriceB = 52;
  var tsell = 2; // Must be lower than negotiationPeriod
  var seller = false;

  var seq_type = new Array(0, 1, 0);
  if(sellActive && seller){seq_type[2]=1;}
  var seq_quantity = new Array(1, 1, 1);
  var seq_price = new Array(ticketPriceA, ticketPriceA, ticketPriceB);
  var seq_agent = new Array(
    accounts[0],
    accounts[1],
    accounts[9],
  );
  var seq_oracle = []
  var seq_oracle_total = [50, 52, 51, 49, 53, 54, 52, 50, 50]
  for(i = 0; i < negotiationPeriod + deliveryPeriod; i ++){
    seq_oracle.push(seq_oracle_total[i]);
  }

  // Catch an instance of Token contract
  it("Catch an instance of the deployed contract (Token)", function(){
    return MyToken.new(10000,"RandomToken",0,"RT", {"from": m_tokenCreator}).then(function(instance){
      c_Token = instance;
      e_Transfer = c_Token.Transfer({fromBlock: "0", toBlock: "latest"});
    });
  });

  // Catch an instance of Market contract
  it("Catch an instance of the deployed contract (Market)", function(){
    return Market.new(c_Token.address, 1, 1, "Future", "Base", 3, 10, {"from": m_marketCreator}).then(function(instance){
      c_Market = instance;
      e_NewOffer = c_Market.newOffer({fromBlock: "0", toBlock: "latest"});
      e_TicketCreation = c_Market.ticketCreation({fromBlock: "0", toBlock: "latest"});
      e_ticketUserChange = c_Market.ticketUserChange({fromBlock: "0", toBlock: "latest"});
    }).then(function(){
      return c_Token.transfer(c_Market.address, 500, {"from": m_tokenCreator}).then(function(){
      });
    });
  });

  // (1) Matching + Verify public variables of Ticket contract
  for(var j = 0; j < seq_price.length; j ++){
    sendOffer(seq_agent[j], seq_price[j], seq_quantity[j], seq_type[j]);
  }

  function sendOffer(_agent, _price, _quantity, _type){
    it("Send a new offer", function(){
      var matching = false;
      // Define variables to use
      var agent = _agent;
      var price = _price;
      var quantity = _quantity*m_tickVolume;
      var type = _type;
      // Agent must have some tokens in its account
      return c_Token.transfer(agent, 1000, {"from": m_tokenCreator}).then(function(){
        // Agent must approve the contract to spend its funds
        return c_Token.approve(c_Market.address, price * quantity, {"from": agent}).then(function(){
          // Launch the offer
          return c_Market.launchOffer(price, quantity, type, 0, {"from": agent}).then(function(){
            // Catch the event
            e_TicketCreation.watch(function(err,eventResponse){
              if(!err){
                matching = true;
                if(eventResponse.args._ticketID.toNumber() % 2 == 0){
                  ticketAddressA = eventResponse.args._ticketAddress;
                }else{
                  ticketAddressB = eventResponse.args._ticketAddress;
                }
              }
            });
          }).then(function(){
            // Print Tickets information if two offers have matched
            if(matching){
              c_Ticket = Ticket.at(ticketAddressA);
              return c_Ticket.ID().then(function(res){
                tID = res.toNumber();
              }).then(function(){
                return c_Ticket.user().then(function(res){
                  tUser = res;
                  expect(tUser).to.be.equal(agent);
                }).then(function(){
                  return c_Ticket.getBalance({"from": tUser}).then(function(res){
                    tBalance = res.toNumber();
                  }).then(function(){
                    return c_Ticket.ticketPrice().then(function(res){
                      tPrice = res.toNumber();
                    }).then(function(){
                      return c_Ticket.ticketType().then(function(res){
                        expect(res).to.be.equal(type);
                        tType = "Buying";
                        if(res){tType = "Selling";}
                        ticketInfo =  "\n    =>Event: New Ticket" +
                                      "\n             ID: " + tID +
                                      "\n             Address: " + ticketAddressA +
                                      "\n             User: " + tUser +
                                      "\n             Price: " + tPrice +
                                      "\n             Type: " + tType +
                                      "\n             Initial Balance: " + tBalance +
                                      "\n";
                        console.log(ticketInfo);
                      }).then(function(){
                        c_Ticket = Ticket.at(ticketAddressB);
                        return c_Ticket.ID().then(function(res){
                          tID = res.toNumber();
                        }).then(function(){
                          return c_Ticket.user().then(function(res){
                            tUser = res;
                          }).then(function(){
                            return c_Ticket.getBalance({"from": tUser}).then(function(res){
                              tBalance = res.toNumber();
                            }).then(function(){
                              return c_Ticket.ticketPrice().then(function(res){
                                tPrice = res.toNumber();
                              }).then(function(){
                                return c_Ticket.ticketType().then(function(res){
                                  expect(res).to.be.equal(!type);
                                  tType = "Buying";
                                  if(res){tType = "Selling";}
                                  ticketInfo =  "\n    =>Event: New Ticket" +
                                                "\n             ID: " + tID +
                                                "\n             Address: " + ticketAddressB +
                                                "\n             User: " + tUser +
                                                "\n             Price: " + tPrice +
                                                "\n             Type: " + tType +
                                                "\n             Initial Balance: " + tBalance +
                                                "\n";
                                  console.log(ticketInfo);
                                });
                              });
                            });
                          });
                        });
                      })
                    });
                  });
                });
              });
            }
          });
        });
      });
    });
  }

  // (2) Ticket functionalities
  for(var k = 0; k < seq_oracle.length; k ++){
    for(var id = 0; id < 2; id ++){
      oracle(id, seq_oracle[k]);
      if(k == negotiationPeriod){
        change(id);
      }
      if(sellActive && (k == tsell) && (id == !seller)){
        sell(id);
      }
      if(k == (seq_oracle.length - 1)){
        kill(id);
      }
    }
    if (k == (seq_oracle.length - 1)){
      for (var j = 0; j < seq_agent.length; j ++){
        printBalance(seq_agent[j]);
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
              if(!err){
                data3 = "\n    =>Event: Ticket User Change" +
                        "\n             ID: " + eventResponse.args._ticketID.toNumber() +
                        "\n";
              }
            });
          }).then(function(){
            return c_Token.balanceOf(user).then(function(res){
              console.log(data);
              console.log(data2);
              console.log(data3);
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

  function printBalance(_account){
    it("", function(){
      return c_Token.balanceOf(_account).then(function(res){
        console.log("\n    " + _account + " -> " + res.toNumber() + "\n");
      });
    });
  }

  it("Stop watching events", function(){
    e_Transfer.stopWatching();
    e_NewOffer.stopWatching();
    e_TicketCreation.stopWatching();
    e_ticketUserChange.stopWatching();
  });

});
