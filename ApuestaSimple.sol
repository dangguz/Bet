pragma solidity ^0.4.8;

contract Token {
    /// total amount of tokens
    uint256 public totalSupply;

    /// @param _owner The address from which the balance will be retrieved
    /// @return The balance
    function balanceOf(address _owner) constant returns (uint256 balance);

    /// @notice send `_value` token to `_to` from `msg.sender`
    /// @param _to The address of the recipient
    /// @param _value The amount of token to be transferred
    /// @return Whether the transfer was successful or not
    function transfer(address _to, uint256 _value) returns (bool success);

    /// @notice send `_value` token to `_to` from `_from` on the condition it is approved by `_from`
    /// @param _from The address of the sender
    /// @param _to The address of the recipient
    /// @param _value The amount of token to be transferred
    /// @return Whether the transfer was successful or not
    function transferFrom(address _from, address _to, uint256 _value) returns (bool success);

    /// @notice `msg.sender` approves `_spender` to spend `_value` tokens
    /// @param _spender The address of the account able to transfer the tokens
    /// @param _value The amount of tokens to be approved for transfer
    /// @return Whether the approval was successful or not
    function approve(address _spender, uint256 _value) returns (bool success);

    /// @param _owner The address of the account owning tokens
    /// @param _spender The address of the account able to transfer the tokens
    /// @return Amount of remaining tokens allowed to spent
    function allowance(address _owner, address _spender) constant returns (uint256 remaining);

    event Transfer(address indexed _from, address indexed _to, uint256 _value);
    event Approval(address indexed _owner, address indexed _spender, uint256 _value);
}

contract StandardToken is Token {

    function transfer(address _to, uint256 _value) returns (bool success) {
        require(balances[msg.sender] >= _value);
        balances[msg.sender] -= _value;
        balances[_to] += _value;
        Transfer(msg.sender, _to, _value);
        return true;
    }

    function transferFrom(address _from, address _to, uint256 _value) returns (bool success) {
        require(balances[_from] >= _value && allowed[_from][msg.sender] >= _value);
        balances[_to] += _value;
        balances[_from] -= _value;
        allowed[_from][msg.sender] -= _value;
        Transfer(_from, _to, _value);
        return true;
    }

    function balanceOf(address _owner) constant returns (uint256 balance) {
        return balances[_owner];
    }

    function approve(address _spender, uint256 _value) returns (bool success) {
        allowed[msg.sender][_spender] = _value;
        Approval(msg.sender, _spender, _value);
        return true;
    }

    function allowance(address _owner, address _spender) constant returns (uint256 remaining) {
      return allowed[_owner][_spender];
    }

    mapping (address => uint256) balances;
    mapping (address => mapping (address => uint256)) allowed;
}

contract BetCoin is StandardToken {

    address tokenCreator;
    string public name;                   //fancy name: eg Simon Bucks
    uint8 public decimals;                //How many decimals to show. ie. There could 1000 base units with 3 decimals. Meaning 0.980 SBX = 980 base units. It's like comparing 1 wei to 1 ether.
    string public symbol;                 //An identifier: eg SBX
    string public version = 'H1';         //human 1 standard. Just an arbitrary versioning scheme.

    function BetCoin(
        uint256 _initialAmount,
        string _tokenName,
        uint8 _decimalUnits,
        string _tokenSymbol
        ) {
        tokenCreator = msg.sender;
        balances[msg.sender] = _initialAmount;               // Give the creator all initial tokens
        totalSupply = _initialAmount;                        // Update total supply
        name = _tokenName;                                   // Set the name for display purposes
        decimals = _decimalUnits;                            // Amount of decimals for display purposes
        symbol = _tokenSymbol;                               // Set the symbol for display purposes
    }

    function getTokenCreatorAddr() returns (address) {
        return tokenCreator;
    }
}

contract HeadsOrTails {

    enum Options { Heads, Tails }

    struct player {
        uint256[100] amount;
        Options[100] option;
        uint256 earnings;
    }

    address codere;
    mapping (address => player) players;

    Options[100] public result;
    Options[100] public alreadyChosen;
    uint256[100] public total;
    uint256 betID;
    uint256[100] public minimumBet;
    uint8[100] numPlayers;
    bool[100] claimed;
    BetCoin f;

    function HeadsOrTails() {
        codere = msg.sender;
    }

    function bet(uint256 _amount, Options _option, uint256 _betID) {
        require (_amount >= minimumBet);
        require (_option != alreadyChosen[betID]);
        require (numPlayers[_betID] < 2);
        if (f.transfer(codere,_amount)) {
            total[betID] += _amount;
            players[msg.sender].option[betID] = _option;
            minimumBet[betID] = _amount;
            alreadyChosen[betID] = _option;
            numPlayers[_betID] ++;
        }
    }

    function coin(Options _result) {
        require(msg.sender == codere);
        result[betID] = _result;
        betID ++;
    }

    function claimPrize(uint256 _betID) {
        require(players[msg.sender].option[_betID] == result[_betID]);
        require(claimed[_betID] == false);
        players[msg.sender].earnings += total[_betID];
        claimed[_betID] = true;
    }

    function issue(address _addr) {
        require(msg.sender == codere);
        f.transfer(_addr, players[_addr].earnings);
    }
}
