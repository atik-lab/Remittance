pragma solidity ^0.4.18;

interface IExchange {
	function convert(bytes32 _exchangePassword, bytes32 _userPassword, uint256 _amount) public;

	function withdrawTokens(uint256 _amount) public;

	function setExchangeRate(uint256 _newExchangeRate) public;
}