pragma solidity ^0.4.8;

// Abstract contract for the full ERC 20 Token standard
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

// Implements ERC 20 Token standard: https://github.com/ethereum/EIPs/issues/20
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
    string public name;                   // Fancy name
    uint8 public decimals;                // How many decimals to show
    string public symbol;                 // An identifier

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

    function increaseSupply(uint256 _amount) {
        require (msg.sender == tokenCreator);                // Only the Token creator can increase the supply
        balances[tokenCreator] += _amount;
        totalSupply += _amount;
    }

    function getTokenCreatorAddr() returns (address tokenCreatorAddr) {
        return tokenCreator;                                 // Getter function of Token creator address
    }

}

contract Mortal {
    address owner;

    function Mortal() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require (msg.sender == owner);
        _;
    }

    function kill() onlyOwner {
        selfdestruct(owner);
    }
}

contract HeadsOrTails is Mortal {

    address tokenCreator;
    BetCoin f;

    mapping (address => uint8[100]) option;

    uint8 public constant Heads = 1;
    uint8 public constant Tails = 2;
    uint8[100] public result;
    uint8[100] public alreadyChosen;
    uint8[100] numPlayers;
    uint256[100] public total;
    uint256 betID;
    uint256[100] public minimumBet;
    bool[100] claimed;

    function HeadsOrTails(address _addr) {
        f = BetCoin(_addr);
        tokenCreator = f.getTokenCreatorAddr();
    }

    function bet(uint256 _amount, uint8 _option, uint256 _betID) {
        require (_amount >= minimumBet[_betID]);                                  // The player cannot bet less than the minimum bet
        require (_option != alreadyChosen[_betID]);                               // The option cannot be already chosen
        require (numPlayers[_betID] < 2);                                         // The maximum number of players allowed is 2
        if (f.transferFrom(msg.sender, this, _amount)) {
            total[_betID] += _amount;
            option[msg.sender][_betID] = _option;
            minimumBet[_betID] = _amount;
            alreadyChosen[_betID] = _option;
            numPlayers[_betID] ++;
        }
    }

    function coin(uint8 _result) {
        require(msg.sender == tokenCreator);                                      // Only the Token creator can set the result
        result[betID] = _result;
        betID ++;
    }

    function claimPrize(uint256 _betID) {
        require(option[msg.sender][_betID] == result[_betID]);                    // Verifies the sender is the winner
        require(claimed[_betID] == false);                                        // One player cannot receive two times the same prize
        f.transferFrom(this, msg.sender, total[_betID]);
        claimed[_betID] = true;
    }
}
