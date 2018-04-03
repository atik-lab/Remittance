pragma solidity ^0.4.18;

import '../node_modules/zeppelin-solidity/contracts/math/SafeMath.sol';
import '../node_modules/zeppelin-solidity/contracts/lifecycle/Destructible.sol';

interface ILocalCurrency {
	function transfer(address _to, uint256 _value) public returns (bool success);
}

interface IRemittance {
	function withdrawEther(bytes32 _exchangePasswordHash, bytes32 _receiverPasswordHash, address _senderAddress, uint256 _amount) external returns (bool success);
}


contract Exchange is Destructible {
	using SafeMath for uint256;

	event LogCurrencyConversion(
		address indexed receiver,
		address indexed sender,
		uint256 etherAmount,
		uint256 localCurrencyAmount
	);
	event LogWithdrawal(address receiver, uint256 amount);
	event LogExchangeRateChanged(uint256 newExchangeRate);

	ILocalCurrency localCurrency;
	IRemittance remittance;

	uint256 public exchangeRate;

	mapping (address=>uint256) public balanceOf;

	modifier hasEnoughBalance(uint256 _amount) {
		require(balanceOf[msg.sender] >= _amount);
		_;
	}

	function Exchange(address _localCurrencyImplementation, address _remittanceImplementation, uint256 _exchangeRate) public {
		require(_localCurrencyImplementation != address(0));
		require(_remittanceImplementation != address(0));
		require(_exchangeRate != 0);
		
		localCurrency = ILocalCurrency(_localCurrencyImplementation);
		remittance = IRemittance(_remittanceImplementation);

		exchangeRate = _exchangeRate;
	}

	function () public payable {}

	function convert(
		bytes32 _exchangePasswordHash,
		bytes32 _receiverPasswordHash,
		address _senderAddress,
		uint256 _amount
	) 
		public
	{
		uint256 oldBalance = address(this).balance;
		
		require(remittance.withdrawEther(_exchangePasswordHash, _receiverPasswordHash, _senderAddress, _amount));

		uint256 newBalance = address(this).balance;

		assert(oldBalance.add(_amount) == newBalance);

		uint256 convertedLocalCurrencyAmount = (_amount.mul(exchangeRate)).div(1 ether);

		balanceOf[msg.sender] = balanceOf[msg.sender].add(convertedLocalCurrencyAmount);

		LogCurrencyConversion(msg.sender, _senderAddress, _amount, convertedLocalCurrencyAmount);
	}

	function withdrawLocalCurrency(uint256 _amount) public hasEnoughBalance(_amount) {
		balanceOf[msg.sender] = balanceOf[msg.sender].sub(_amount);

		require(localCurrency.transfer(msg.sender, _amount));

		LogWithdrawal(msg.sender, _amount);
	}

	function setExchangeRate(uint256 _newExchangeRate) public onlyOwner {
		exchangeRate = _newExchangeRate;
		LogExchangeRateChanged(_newExchangeRate);
	}
}