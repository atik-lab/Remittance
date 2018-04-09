pragma solidity ^0.4.18;

contract KeccakUtil {
	function encodePassword(string _password) public pure returns (bytes32) {
		return keccak256(_password);
	}

	function encodeKey(
		bytes32 _exchangePasswordHash,
		bytes32 _receiverPasswordHash,
		address _receiverAddress,
		address _senderAddress
	)
		public
		pure
		returns
		(bytes32) 
	{
		return keccak256(_exchangePasswordHash, _receiverPasswordHash, _receiverAddress, _senderAddress);
	}
}