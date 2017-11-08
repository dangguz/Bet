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

contract Coin is StandardToken {

    address tokenCreator;
    string public name;                   // Fancy name
    uint8 public decimals;                // How many decimals to show
    string public symbol;                 // An identifier

    function Coin(
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

    function distributeToken(uint256 _amount) {
        require (msg.sender == tokenCreator);
        require (_amount <= totalSupply);
        balances[tokenCreator] -= _amount;
        balances[0x21480D1Fede8fD075c05002382b8470061431F5e] += _amount/4;
        balances[0x293FF8bb7D651399E46E8347C031E9A4A7748332] += _amount/4;
        balances[0x0dd06b07E315234F953665518Ca1a78Ede4b0b04] += _amount/4;
        balances[0xF4492A1c2d93b070bF96b8B762d610Eb95753E61] += _amount/4;
    }

    function getTokenCreatorAddr() returns (address tokenCreatorAddr) {
        return tokenCreator;                                 // Getter function of Token creator address
    }

}

contract EnergyToken is StandardToken {

    address tokenCreator;
    string public name;                   // Fancy name
    uint8 public decimals;                // How many decimals to show
    string public symbol;                 // An identifier

    function EnergyToken(
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

    function distributeToken(uint256 _amount) {
        require (msg.sender == tokenCreator);
        require (_amount <= totalSupply);
        balances[tokenCreator] -= _amount;
        balances[0x21480D1Fede8fD075c05002382b8470061431F5e] += _amount/4;
        balances[0x293FF8bb7D651399E46E8347C031E9A4A7748332] += _amount/4;
        balances[0x0dd06b07E315234F953665518Ca1a78Ede4b0b04] += _amount/4;
        balances[0xF4492A1c2d93b070bF96b8B762d610Eb95753E61] += _amount/4;
    }

    function getTokenCreatorAddr() returns (address tokenCreatorAddr) {
        return tokenCreator;                                 // Getter function of Token creator address
    }

}

contract ContinuousMarket {

    Coin x;
    EnergyToken y;

    uint ui_scale = 1;
    uint ui_maxPrice = 10;

    struct Offer {
        uint ui_idPrice;
        address a_sender;
        uint ui_quantity;
        uint ui_lowerLimit;
        uint ui_upperLimit;
        bool b_type;
    }

    struct Price {
        uint ui_price;
        uint ui_buyingMatchedLevel;
        uint ui_sellingMatchedLevel;
        uint ui_buyingTotal;
        uint ui_sellingTotal;
        uint ui_buyingReference;
        uint ui_sellingReference;
    }

    uint ui_idOffer;
    uint ui_pricesDimension = ui_maxPrice / ui_scale + 1;

    Offer [] public offers;
    Price [101] public prices;

    function ContinuousMarket (address _firstAddr, address _secondAddr) {
        x = Coin(_firstAddr);
        y = EnergyToken(_secondAddr);
    }

    function launchPublicOffer (
        uint _price,         // Amount you are willing to pay if _type = false (buying offer), or amount you want to be paid if _type = true (selling offer)
        uint _quantity,      // Quantity you are willing to buy if _type = false (buying offer), or sell if _type = true (selling offer)
        bool _type)          // Type of the offer: 0 = buying offer; 1 = selling offer
    {
        uint ui_idPrice;
        uint ui_buy = 1;
        uint ui_sell = 0;
        uint ui_lowerLimit;
        uint ui_upperLimit;

        if (_type) { ui_sell = 1; ui_buy = 0; }
        require (ui_buy * _price * _quantity + ui_sell * _quantity >= ui_buy * x.balanceOf(msg.sender) + ui_sell * y.balanceOf(msg.sender));
        require (_price % ui_scale == 0 && _price <= ui_maxPrice);

        x.transferFrom(msg.sender, this, ui_buy * _price * _quantity);
        y.transferFrom(msg.sender, this, ui_sell * _quantity);

        ui_idPrice = _price / ui_scale + 1;
        if (prices[ui_idPrice].ui_buyingTotal * ui_sell + prices[ui_idPrice].ui_sellingTotal * ui_buy > 0) {
            if (prices[ui_idPrice].ui_buyingTotal * ui_sell + prices[ui_idPrice].ui_sellingTotal * ui_buy >= _quantity) {
                x.transferFrom(this, msg.sender, ui_sell * _price * _quantity);
                y.transferFrom(this, msg.sender, ui_buy * _quantity);
                prices[ui_idPrice].ui_buyingMatchedLevel += ui_sell * _quantity;
                prices[ui_idPrice].ui_sellingMatchedLevel += ui_buy * _quantity;
                prices[ui_idPrice].ui_buyingTotal -= ui_sell * _quantity;
                prices[ui_idPrice].ui_sellingTotal -= ui_buy * _quantity;
                _quantity = 0;
            } else {
                x.transferFrom(this, msg.sender, ui_sell * prices[ui_idPrice].ui_buyingTotal * _quantity);
                y.transferFrom(this, msg.sender, ui_buy * prices[ui_idPrice].ui_sellingTotal);
                prices[ui_idPrice].ui_buyingMatchedLevel += ui_sell * prices[ui_idPrice].ui_buyingTotal;
                prices[ui_idPrice].ui_sellingMatchedLevel += ui_buy * prices[ui_idPrice].ui_sellingTotal;
                _quantity = ui_buy * (_quantity - prices[ui_idPrice].ui_sellingTotal) + ui_sell * (_quantity - prices[ui_idPrice].ui_buyingTotal);
                prices[ui_idPrice].ui_buyingTotal = ui_buy * _quantity;
                prices[ui_idPrice].ui_sellingTotal = ui_sell * _quantity;
            }
        } else {
            prices[ui_idPrice].ui_buyingTotal += ui_buy * _quantity;
            prices[ui_idPrice].ui_sellingTotal += ui_sell * _quantity;
        }

        ui_lowerLimit = prices[ui_idPrice].ui_buyingReference * ui_buy + prices[ui_idPrice].ui_sellingReference * ui_sell;
        ui_upperLimit = ui_lowerLimit + _quantity;
        prices[ui_idPrice].ui_buyingReference += ui_buy * _quantity;
        prices[ui_idPrice].ui_sellingReference += ui_sell * _quantity;
        offers.push(Offer(ui_idPrice, msg.sender, _quantity, ui_lowerLimit, ui_upperLimit, _type));
        ui_idOffer ++;

        PublicOffer(_price, _quantity, _type);
    }

    function clearingOffer(uint _idOffer) {
        require(msg.sender == offers[_idOffer].a_sender);
        if (offers[_idOffer].b_type) {
            if (offers[_idOffer].ui_upperLimit <= prices[offers[_idOffer].ui_idPrice].ui_sellingMatchedLevel) {
                x.transferFrom(this, msg.sender, offers[_idOffer].ui_quantity * prices[offers[_idOffer].ui_idPrice].ui_price);
            } else if (offers[_idOffer].ui_lowerLimit >= prices[offers[_idOffer].ui_idPrice].ui_sellingMatchedLevel){
            } else {
                x.transferFrom(this, msg.sender, (prices[offers[_idOffer].ui_idPrice].ui_sellingMatchedLevel - offers[_idOffer].ui_lowerLimit) * prices[offers[_idOffer].ui_idPrice].ui_price);
            }
        } else {
            if (offers[_idOffer].ui_upperLimit <= prices[offers[_idOffer].ui_idPrice].ui_buyingMatchedLevel) {
                y.transferFrom(this, msg.sender, offers[_idOffer].ui_quantity);
            } else if (offers[_idOffer].ui_lowerLimit >= prices[offers[_idOffer].ui_idPrice].ui_buyingMatchedLevel){
            } else {
                y.transferFrom(this, msg.sender, prices[offers[_idOffer].ui_idPrice].ui_buyingMatchedLevel - offers[_idOffer].ui_lowerLimit);
            }
        }
    }

    event PublicOffer(uint _price, uint _quantity, bool _type);

}
