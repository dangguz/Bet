var MyToken = artifacts.require("./MyToken.sol");
expect = require("chai").expect;

// Tests can be nested into three levels: contract, describe, it
contract("MyToken", function(accounts){
  // Contracts
  var c_Token;
  // Events
  var e_Transfer;
  var e_Approval;
  // Public member variables
  var m_total;
  var m_creator;
  var m_name;
  // Additional variables
  var value;
  var sender;
  var spender;
  var receiver;
  var balance_sender_before;
  var balance_sender_after;
  var balance_receiver_before;
  var balance_receiver_after;

  // Catch an instance
  it("Catch an instance of the deployed contract", function(){
    return MyToken.new(1000,"RandomToken",0,"RT", {"from": accounts[5]}).then(function(instance){
      c_Token = instance;
      e_Transfer = c_Token.Transfer({fromBlock: "0", toBlock: "latest"});
      e_Approval = c_Token.Approval({fromBlock: "0", toBlock: "latest"});
    });
  });

  // Verify public variables
  it("Check that values of public variables are correct", function(){
    var data;
    return c_Token.name().then(function(res){
      m_name = res.toString();
      expect(m_name).to.be.equal("RandomToken");
    }).then(function(){
      return c_Token.totalSupply().then(function(res){
        m_total = res.toNumber();
        expect(m_total).to.be.equal(1000);
      }).then(function(){
        return c_Token.tokenCreator().then(function(res){
          m_creator = res;
          expect(m_creator).to.be.equal(accounts[5]);
          data = "\n      Public variables" +
                 "\n      ----------------" +
                 "\n      Name: " + m_name +
                 "\n      Total Supply: " + m_total +
                 "\n      Creator: " + m_creator +
                 "\n";
          console.log(data);
        });
      });
    });
  });

  // Check functionalities
  // Transfer function
  it("Creator transfers 400 to account 7", function(){
    var data;
    // Define variables to use
    sender = m_creator;
    receiver = accounts[7];
    value = 400;
    // Get the initial balances of the selected accounts
    return c_Token.balanceOf(sender).then(function(res){
      balance_sender_before = res.toNumber();
    }).then(function(){
      return c_Token.balanceOf(receiver).then(function(res){
        balance_receiver_before = res.toNumber();
      }).then(function(){
        return c_Token.transfer(receiver, value, {"from": sender}).then(function(){
          // Catch the event
          e_Transfer.watch(function(err,eventResponse){
            data = "\n    =>Event: Transfer" +
                   "\n             from: " + eventResponse.args._from +
                   "\n             to: " + eventResponse.args._to +
                   "\n             value: " + eventResponse.args._value.toNumber() +
                   "\n";
          });
          // Get final balances and check they are correct
          return c_Token.balanceOf(sender).then(function(res){
            balance_sender_after = res.toNumber();
            assert.equal(
              balance_sender_after,
              balance_sender_before - value,
              "There is a problem with the balance of the sender"
            );
          }).then(function(){
            return c_Token.balanceOf(receiver).then(function(res){
              balance_receiver_after = res.toNumber();
              assert.equal(
                balance_receiver_after,
                balance_receiver_before + value,
                "There is a problem with the balance of the receiver"
              );
              // Print the information
              console.log(data);
            });
          });
        });
      });
    });
  });

  // Transfer from function
  it("Account 4 sends 150 from creator account to account 1", function(){
    var data_1;
    var data_2;
    // Define variables to use
    sender = m_creator;
    spender = accounts[4];
    receiver = accounts[1];
    value = 150;
    // Get the initial balances of the selected accounts
    return c_Token.balanceOf(sender).then(function(res){
      balance_sender_before = res.toNumber();
    }).then(function(){
      return c_Token.balanceOf(receiver).then(function(res){
        balance_receiver_before = res.toNumber();
      }).then(function(){
        return c_Token.approve(spender, value + 50, {"from": sender}).then(function(){
          // Catch the event
          e_Approval.watch(function(err,eventResponse){
          data_2 = "\n    =>Event: Approval" +
                   "\n             owner: " + eventResponse.args._owner +
                   "\n             spender: " + eventResponse.args._spender +
                   "\n             value: " + eventResponse.args._value.toNumber() +
                   "\n";
          });
          return c_Token.transferFrom(sender, receiver, value, {"from": spender}).then(function(){
            // Catch the event
            e_Transfer.watch(function(err,eventResponse){
              data_1 = "\n    =>Event: Transfer" +
                       "\n             from: " + eventResponse.args._from +
                       "\n             to: " + eventResponse.args._to +
                       "\n             value: " + eventResponse.args._value.toNumber() +
                       "\n";
            });
            // Get final balances and check they are correct
            return c_Token.balanceOf(sender).then(function(res){
                balance_sender_after = res.toNumber();
                assert.equal(
                  balance_sender_after,
                  balance_sender_before - value,
                  "There is a problem with the balance of the sender"
                );
            }).then(function(){
              return c_Token.balanceOf(receiver).then(function(res){
                balance_receiver_after = res.toNumber();
                assert.equal(
                  balance_receiver_after,
                  balance_receiver_before + value,
                  "There is a problem with the balance of the receiver"
                );
                // Print the event information
                console.log(data_2);
                console.log(data_1);
              });
            });
          });
        });
      });
    });
  });

  it("Account 4 sends remaining allowed from creator account to account 8", function(){
    var data;
    // Define variables to use
    sender = m_creator;
    spender = accounts[4];
    receiver = accounts[8];
    // Get the initial balances of the selected accounts
    return c_Token.balanceOf(sender).then(function(res){
      balance_sender_before = res.toNumber();
    }).then(function(){
      return c_Token.balanceOf(receiver).then(function(res){
        balance_receiver_before = res.toNumber();
      }).then(function(){
        // Get the remaining allowed value
        return c_Token.allowance(sender, spender).then(function(res){
          value = res.toNumber();
        }).then(function(){
          return c_Token.transferFrom(sender, receiver, value, {"from": spender}).then(function(){
            // Catch the event
            e_Transfer.watch(function(err,eventResponse){
              data = "\n    =>Event: Transfer" +
                     "\n             from: " + eventResponse.args._from +
                     "\n             to: " + eventResponse.args._to +
                     "\n             value: " + eventResponse.args._value.toNumber() +
                     "\n";
            });
            // Get final balances and check they are correct
            return c_Token.balanceOf(sender).then(function(res){
                balance_sender_after = res.toNumber();
                assert.equal(
                  balance_sender_after,
                  balance_sender_before - value,
                  "There is a problem with the balance of the sender"
                );
            }).then(function(){
              return c_Token.balanceOf(receiver).then(function(res){
                balance_receiver_after = res.toNumber();
                assert.equal(
                  balance_receiver_after,
                  balance_receiver_before + value,
                  "There is a problem with the balance of the receiver"
                );
                // Print the event information
                console.log(data);
              });
            });
          });
        });
      });
    });
  });

  it("Stop watching events", function(){
    e_Transfer.stopWatching();
    e_Approval.stopWatching();
  });

});
