pragma solidity ^0.4.18;

interface IRemittance {
	function addRemittanceRequest(bytes32 _key) public payable;

	function withdrawRemittanceRequest(bytes32 _key) public;

	function withdrawEther(bytes32 _key, uint256 _amount) public;

	function setValidityDuration(uint256 _newDuration) public;

	function addTrustedExchange(address _trustedExchange) public;
}