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
  var m_tickVolume = 3;
  var m_priceScale = 1;
  var changed = new Array (false, false);
  var totalOracleGas = new Array (0, 0);

  const testSize = 6;
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
      e_TicketCreation = c_Market.ticketCreation({fromBlock: "0", toBlock: "latest"});
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
      var buyingOffers_num_before;
      var sellingOffers_num_before;
      var buyingOffers_num_after;
      var sellingOffers_num_after;

      // Read parameters of the offer
      fs.readFile('./test/OfferData.json', 'utf8', function (err, data) {
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
            return c_Token.approve(c_Market.address, (price + 10) * quantity, {"from": agent}).then(function(){
              // Launch the offer
              return c_Market.launchOffer(price, quantity, type, {"from": agent}).then(function(){
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
                // Get the final state of the variables at the selected price
                return c_Market.getNumOffers(price/m_priceScale, 0).then(function(res){
                  buyingOffers_num_after = res.toNumber();
                }).then(function(){
                  return c_Market.getNumOffers(price/m_priceScale, 1).then(function(res){
                    sellingOffers_num_after = res.toNumber();
                    assert.equal(buyingOffers_num_after, buyingOffers_num_before + (1 - type) * quantity / m_tickVolume);
                    assert.equal(sellingOffers_num_after, sellingOffers_num_before + type * quantity / m_tickVolume);
                    // Print Tickets information if two offers have matched
                    if(matching){
                      c_Ticket = Ticket.at(ticketAddressA);
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
          });
        });
      });
    });
  }

  // (2) Ticket functionalities
  for(var k = 0; k < testSize; k ++){
    for(var id = 0; id < 2; id ++){
      oracle(id, k);
    }
  }

  var balances = [0, 0];
  var output = "PriceSignal,Period,TicketBalanceB,TicketBalanceS,OracleGasB,OracleGasS,TotalGas\n";
  function oracle(_id, _index){
    it("Send price signal from oracle account", function(){
      var oracleGas;
      var balance;
      var ttype;
      var user;
      var info;
      var kill = false;
      if(_index == (testSize - 1)){kill = true;}

      // Read parameters of the offer
      fs.readFile('./test/OracleData.json', 'utf8', function (err, data) {
        if (err) throw err;
        var obj = JSON.parse(data);
        for (var i = 0; i < obj.length; i ++){
          if(i == _index){
            signal = obj[i].Signal;
            period = obj[i].Period;
          }
        }
      });

      return c_Market.getTicketAddress(_id, {"from": m_marketCreator}).then(function(res){
        c_Ticket = Ticket.at(res);
        e_TicketDestruction = c_Ticket.TicketDestruction({fromBlock: "0", toBlock: "latest"});
      }).then(function(){
        return c_Ticket.ticketType().then(function(res){
          ttype = res;
        }).then(function(){
          return c_Ticket.updateTicketBalance(signal).then(function(result){
            oracleGas = result.receipt.gasUsed;
            return c_Ticket.user().then(function(res){
              user = res;
            }).then(function(){
              return c_Ticket.getBalance({"from": user}).then(function(res){
                balance = res.toNumber();
                if(ttype){
                  totalOracleGas[1] += oracleGas;
                  balances[1] = balance;
                  if(!kill){
                    output += signal + "," + period + ","+ balances[0] + "," + balances[1] + "," + totalOracleGas[0] + "," + totalOracleGas[1] + "," + (totalOracleGas[0] + totalOracleGas[1]) + "\n";
                  }
                  info = "\n    =>New Price Signal: " + signal +
                         "\n      ID: " + _id +
                         "\n      Seller: " + user +
                         "\n      Balance: " + balance +
                         "\n      Gas Cost to Oracle: " + oracleGas +
                         "\n      Cumulative Gas Cost to Oracle: " + totalOracleGas[1] +
                         "\n";
                }else{
                  totalOracleGas[0] += oracleGas;
                  balances[0] = balance;
                  info = "\n    =>New Price Signal: " + signal +
                         "\n      ID: " + _id +
                         "\n      Buyer: " + user +
                         "\n      Balance: " + balance +
                         "\n      Gas cost to Oracle: " + oracleGas +
                         "\n      Cumulative Gas Cost to Oracle: " + totalOracleGas[0] +
                         "\n";
                }
                console.log(info);
                if(period == "Delivery"){
                  if(!changed[_id]){
                    return c_Ticket.changePeriod().then(function(){
                      changed[_id] = true;
                    });
                  }
                }
                if(kill){
                  return c_Ticket.finish().then(function(result){
                    oracleGas = result.receipt.gasUsed;
                    var pos = 0;
                    if(ttype){pos = 1;}
                    totalOracleGas[pos] += oracleGas;
                    e_TicketDestruction.watch(function(err,eventResponse){
                      if(!err){
                        info = "    =>Event: Ticket Destruction" +
                               "\n             ID: " + eventResponse.args._ticketID.toNumber() +
                               "\n             Gas cost to Oracle: " + oracleGas +
                               "\n             Final Gas Cost to Oracle: " + totalOracleGas[pos] +
                               "\n";
                      }
                    });
                  }).then(function(){
                    return c_Token.balanceOf(user).then(function(res){
                      console.log(info);
                      console.log("    Final balance of the user: " + res.toNumber() + "\n");
                      e_TicketDestruction.stopWatching();
                      if(ttype){
                        output += signal + "," + period + ","+ balances[0] + "," + balances[1] + "," + totalOracleGas[0] + "," + totalOracleGas[1] + "," + (totalOracleGas[0] + totalOracleGas[1]) + "\n";
                        fs.writeFile("./test/output.csv", output, function (err) {
                          if (err)
                          return console.log(err);
                          console.log("\n      Wrote test information in file output.csv, just check it\n");
                        });
                      }
                    });
                  });
                }
              });
            });
          });
        });
      });
    });
  }

  it("Stop watching events", function(){
    e_Transfer.stopWatching();
    e_TicketCreation.stopWatching();
  });

});
