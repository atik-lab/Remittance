pragma solidity ^0.4.18;

interface IExchange {
	function () public payable;
	
	function convert(bytes32 _exchangePasswordHash, bytes32 _receiverPasswordHash, address _senderAddress, uint256 _amount) public;

	function withdrawLocalCurrency(uint256 _amount) public;

	function setExchangeRate(uint256 _newExchangeRate) public;
}