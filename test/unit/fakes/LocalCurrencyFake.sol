pragma solidity ^0.4.18;


contract LocalCurrencyFake {
	address public transferCalledFrom;
	address public transferTo;
	uint256 public transferValue;

	function transfer(address _to, uint256 _value) public returns (bool success) {
		transferCalledFrom = msg.sender;
		transferTo = _to;
		transferValue =  _value;

		if (_value == 42) {
			return false;
		}

		return true;
	}
}