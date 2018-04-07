pragma solidity ^0.4.18;

contract RemittanceFake {
	function () public payable {}

	function withdrawEther(bytes32 _exchangePasswordHash, bytes32 _receiverPasswordHash, address _senderAddress, uint256 _amount) external returns (bool success) {
		if (_amount == 42) {
			return false;
		}

		msg.sender.transfer(address(this).balance);
		return true;
	}
}