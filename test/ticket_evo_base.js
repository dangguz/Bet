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
  var changed = new Array(false, false);

  const testSize = 10;
  var fs = require("fs");

  // Catch an instance of Token contract
  it("Catch an instance of the deployed contract (Token)", function(){
    return MyToken.new(10000,"RandomToken",0,"RT", {"from": m_tokenCreator}).then(function(instance){
      c_Token = instance;
      e_Transfer = c_Token.Transfer({fromBlock: "0", toBlock: "latest"});
    });
  });

  // Catch an instance of Market contract
  it("Catch an instance of the deployed contract (Market)", function(){
    return Market.new(c_Token.address, 1, m_tickVolume, "Future", "Base", 10, 10, {"from": m_marketCreator}).then(function(instance){
      c_Market = instance;
      e_NewOffer = c_Market.newOffer({fromBlock: "0", toBlock: "latest"});
      e_TicketCreation = c_Market.ticketCreation({fromBlock: "0", toBlock: "latest"});
      e_ticketUserChange = c_Market.ticketUserChange({fromBlock: "0", toBlock: "latest"});
      // e_TicketDestruction = c_Ticket.TicketDestruction({fromBlock: "0", toBlock: "latest"});
    }).then(function(){
      return c_Token.transfer(c_Market.address, 500, {"from": m_tokenCreator}).then(function(){
      });
    });
  });

  // (1) Matching + Verify public variables of Ticket contract
  for(var j = 0; j < 2; j ++){
    sendOffer(j);
  }

  function sendOffer(_index){
    it("Send a new offer", function(){
      var matching = false;
      var agent;
      var price;
      var quantity;
      var type;

      // Read parameters of the offer
      fs.readFile('./test/Data.json', 'utf8', function (err, data) {
        if (err) throw err;
        var obj = JSON.parse(data);
        for (var i = 0; i < obj.length; i ++){
          if(i == _index){
            agent = accounts[obj[i].Agent];
            price = obj[i].Price;
            quantity = obj[i].Quantity*m_tickVolume;
            type = obj[i].Type;
            cancel = obj[i].Cancel;
          }
        }
      });

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

  // // (2) Ticket functionalities
  // for(var k = 0; k < testSize; k ++){
  //   for(var id = 0; id < 2; id ++){
  //     oracle(id, k);
  //   }
  //   //   if(k == (seq_oracle.length - 1)){
  //   //     kill(id);
  //   //   }
  //   // }
  //   // if (k == (testSize - 1)){
  //   //   for (var j = 0; j < seq_agent.length; j ++){
  //   //     printBalance(seq_agent[j]);
  //   //   }
  //   // }
  // }
  //
  // function oracle(_id, _index){
  //   var balance;
  //   var ttype;
  //   var user;
  //   var data;
  //   var kill = false;
  //   if(_index == (testSize -1)){kill = true;}
  //
  //   // Read parameters of the offer
  //   fs.readFile('./test/OracleData.json', 'utf8', function (err, data) {
  //     if (err) throw err;
  //     var obj = JSON.parse(data);
  //     for (var i = 0; i < obj.length; i ++){
  //       if(i == _index){
  //         signal = obj[i].Signal;
  //         period = obj[i].Period;
  //       }
  //     }
  //   });
  //
  //   it("Send price signal from oracle account", function(){
  //     return c_Market.getTicketAddress(_id, {"from": m_marketCreator}).then(function(res){
  //       c_Ticket = Ticket.at(res);
  //     }).then(function(){
  //       return c_Ticket.ticketType().then(function(res){
  //         ttype = res;
  //       }).then(function(){
  //         return c_Ticket.updateTicketBalance(signal).then(function(){
  //           return c_Ticket.user().then(function(res){
  //             user = res;
  //           }).then(function(){
  //             return c_Ticket.getBalance({"from": user}).then(function(res){
  //               balance = res.toNumber();
  //               if(ttype){
  //                 data = "\n    =>New Price Signal: " + _signal +
  //                        "\n      ID: " + _id +
  //                        "\n      Seller: " + user +
  //                        "\n      Balance: " + balance +
  //                        "\n";
  //               }else{
  //                 data = "\n    =>New Price Signal: " + _signal +
  //                        "\n      ID: " + _id +
  //                        "\n      Buyer: " + user +
  //                        "\n      Balance: " + balance +
  //                        "\n";
  //               }
  //               console.log(data);
  //               if(period == "Delivery"){
  //                 if(!changed[_id]){
  //                   return c_Ticket.changePeriod().then(function(){
  //                     changed[_id] = true;
  //                   });
  //                 }
  //               }
  //               // if(kill){
  //               //   return c_Ticket.finish().then(function(){
  //               //     e_TicketDestruction.watch(function(err,eventResponse){
  //               //       if(!err){
  //               //         data = "\n    =>Event: Ticket Destruction" +
  //               //                "\n             ID: " + eventResponse.args._ticketID.toNumber() +
  //               //                "\n";
  //               //       }
  //               //     });
  //               //   });
  //               // }
  //             });
  //           });
  //         });
  //       });
  //     });
  //   });
  // }
  //
  // function printBalance(_account){
  //   it("Print final balance", function(){
  //     return c_Token.balanceOf(_account).then(function(res){
  //       console.log("\n    " + _account + " -> " + res.toNumber() + "\n");
  //     });
  //   });
  // }

  it("Stop watching events", function(){
    e_Transfer.stopWatching();
    e_NewOffer.stopWatching();
    e_TicketCreation.stopWatching();
    e_ticketUserChange.stopWatching();
    // e_TicketDestruction.stopWatching();
  });

});
