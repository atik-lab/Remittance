pragma solidity ^0.4.18;

contract RemittanceFake {
	bool public isWithdrawEtherCalled = false;

	function () public payable {}

	function withdrawEther(bytes32 _exchangePasswordHash, bytes32 _receiverPasswordHash, address _senderAddress, uint256 _amount) external returns (bool success) {
		isWithdrawEtherCalled = true;

		if (_amount == 42) {
			msg.sender.transfer(42);
			return false;
		}

		if (_amount == 256) {
			msg.sender.transfer(255);
			return true;
		}

		msg.sender.transfer(_amount);
		return true;
	}
}