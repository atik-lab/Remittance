pragma solidity ^0.4.18;
 
import '../node_modules/zeppelin-solidity/contracts/math/SafeMath.sol';
import '../node_modules/zeppelin-solidity/contracts/lifecycle/Destructible.sol';
 
 
contract Remittance is Destructible {
	using SafeMath for uint256;
 
	event LogEtherWithdrawal(address indexed receiver, address indexed sender, uint256 amount);
	event LogNewRemittanceRequest(bytes32 key, uint256 value, uint256 validUntil);
	event LogUpdatedRemittanceRequest(bytes32 key, uint256 value, uint256 validUntil);
	event LogRemittanceRequestWithdrawal(address indexed receiver, address indexed sender, uint256 value);
	event LogValidityDurationChange(uint256 newDuration);
	event LogSetTrustedExchange(address indexed exchange, bool isTrusted);
 
	struct RemittanceDetails {
		uint256 value;
		uint256 validUntil;
	}

	/**
	* @dev The contract owner will take 1/1000000 integer part
	* of every remittance request.
	* @notice The customer has no incentive to accumulate only
	* low-value requests(less than 1Mwei), because they will
	* pay more for transaction gas costs.
	*/ 
	uint24 public constant OWNER_TAX_DENOMINATOR = 1000000;

	uint256 public validityDuration = 7 days;
 
	mapping (bytes32=>RemittanceDetails) public remittances;
	mapping (address=>bool) public trustedExchanges;
 
	modifier validityDurationRestricted(uint256 _newDuration) {
		require(_newDuration >= 1 days && _newDuration <= 1 years);
		_;
	}

	modifier onlyFromTrustedExchange() {
		require(trustedExchanges[msg.sender]);
		_;
	}

	/**
	* @dev Key derivation -> sha3(sha3(_exchangePassword), sha3(_receiverPassword), _receiverAddress, _senderAddress);
	* @notice The function is designed to be invoked from the same `tx.origin` as the embedded `_receiverAddress`.
	*/ 
	function withdrawEther(
		bytes32 _exchangePasswordHash,
		bytes32 _receiverPasswordHash,
		address _senderAddress,
		uint256 _amount
	)
		external
		onlyFromTrustedExchange
		returns
		(bool success)
	{
		bytes32 key = keccak256(_exchangePasswordHash, _receiverPasswordHash, tx.origin, _senderAddress);

		require(remittances[key].value >= _amount);

		remittances[key].value = remittances[key].value.sub(_amount);

		LogEtherWithdrawal(tx.origin, _senderAddress, _amount);

		msg.sender.transfer(_amount);

		return true;
	}

 	/**
	* @dev Key derivation -> sha3(sha3(_exchangePassword), sha3(_receiverPassword), _receiverAddress, _senderAddress);
	*/ 
	function addRemittanceRequest(bytes32 key) public payable {
		uint256 valueToAdd = msg.value.sub(msg.value.div(OWNER_TAX_DENOMINATOR));

		if (remittances[key].validUntil == 0) {
			remittances[key] = RemittanceDetails({value: valueToAdd, validUntil: now.add(validityDuration)});
			LogNewRemittanceRequest(key, remittances[key].value, remittances[key].validUntil);
		} else {
			if (remittances[key].validUntil > now) {
				remittances[key].validUntil = remittances[key].validUntil.add(validityDuration);
			} else {
				remittances[key].validUntil = now.add(validityDuration);
			}
 
			remittances[key].value = remittances[key].value.add(valueToAdd);
			LogUpdatedRemittanceRequest(key, remittances[key].value, remittances[key].validUntil);
		}
		
	}
 
 	/**
	* @dev Key derivation -> sha3(sha3(_exchangePassword), sha3(_receiverPassword), _receiverAddress, _senderAddress);
	* @notice The function is designed to be invoked from the same `msg.sender` as the embedded `_senderAddress`.
	*/ 
	function withdrawRemittanceRequest(
		bytes32 _exchangePasswordHash,
		bytes32 _receiverPasswordHash,
		address _receiverAddress
	)
		public
	{
		bytes32 key = keccak256(_exchangePasswordHash, _receiverPasswordHash, _receiverAddress, msg.sender);

		require(remittances[key].validUntil != 0 && remittances[key].validUntil < now);

		uint256 transferAmount = remittances[key].value;

		delete remittances[key];

		LogRemittanceRequestWithdrawal(_receiverAddress, msg.sender, transferAmount);

		if (transferAmount > 0) {
			msg.sender.transfer(transferAmount);
		}
	}
 
	function setValidityDuration(uint256 _newDuration)
		public
		onlyOwner
		validityDurationRestricted(_newDuration)
	{
		validityDuration = _newDuration;
 
		LogValidityDurationChange(_newDuration);
	}

	function setTrustedExchange(
		address _exchange,
		bool _isTrusted
	)
		public
		onlyOwner
	{
		trustedExchanges[_exchange] = _isTrusted;

		LogSetTrustedExchange(_exchange, _isTrusted);
	}
}