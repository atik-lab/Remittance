const Exchange = artifacts.require('../../contracts/Exchange.sol');
const Remittance = artifacts.require('../../contracts/Remittance.sol');
const LocalCurrencyFake = artifacts.require('../unit/fakes/LocalCurrencyFake.sol');
const KeccakUtil = artifacts.require('../utils/KeccakUtil.sol');

const assertRevert = require('../utils/assertRevert');

contract('Exchange', ([owner, receiver, sender, exchange, another]) => {
	let sut,
		remittance,
		localCurrency,
		keccakUtil,
		exchangePasswordHash,
		receiverPasswordHash,
		key;

	const defaultExchangeRate = '2000000000000000000';

	before(async () => {
		web3.eth.defaultAccount = owner;
		keccakUtil = await KeccakUtil.new();
		exchangePasswordHash = await keccakUtil.encodePassword('exchange-password');
		receiverPasswordHash = await keccakUtil.encodePassword(('receiver-password'));
		key = await keccakUtil.encodeKey(exchangePasswordHash, receiverPasswordHash, receiver, sender);
	});

	beforeEach(async () => {
		localCurrency = await LocalCurrencyFake.new();
		remittance = await Remittance.new();
		sut = await Exchange.new(localCurrency.address, remittance.address, defaultExchangeRate);
	});

	it('convert Should revert when the exchange is not set as trusted in the remittance contract', async () => {
		// Arrange
		// Act
		// Assert
	});

	it('convert Should revert when trying to convert `_amount` higher than the specified in the remittance request', async () => {
		// Arrange
		// Act
		// Assert
	});

	it('convert Should revert when `msg.sender` is not the `_receiverAddress` embedded in the key of the remittance request', async () => {
		// Arrange
		// Act
		// Assert
	});

	it('convert Should add exact local currency amount to `msg.sender` balance when passed valid arguments', async () => {
		// Arrange
		// Act
		// Assert
	});
});