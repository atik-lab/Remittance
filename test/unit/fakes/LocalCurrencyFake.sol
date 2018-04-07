pragma solidity ^0.4.18;


contract LocalCurrencyFake {
	function transfer(address _to, uint256 _value) public returns (bool success) {
		if (_value == 42) {
			return false;
		}

		return true;
	}
}