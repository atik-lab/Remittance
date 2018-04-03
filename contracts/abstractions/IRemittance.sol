pragma solidity ^0.4.18;

interface IRemittance {
	function withdrawEther(bytes32 _exchangePasswordHash, bytes32 _receiverPasswordHash, address _senderAddress, uint256 _amount) external returns (bool success);

	function addRemittanceRequest(bytes32 key) public payable;

	function withdrawRemittanceRequest(bytes32 _exchangePasswordHash, bytes32 _receiverPasswordHash, address _receiverAddress) public;

	function setValidityDuration(uint256 _newDuration) public;

	function setTrustedExchange(address _exchange, bool _isTrusted) public;
}