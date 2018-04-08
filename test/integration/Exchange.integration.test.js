const Exchange = artifacts.require('../../contracts/Exchange.sol');
const Remittance = artifacts.require('../../contracts/Remittance.sol');
const LocalCurrencyFake = artifacts.require('../unit/fakes/LocalCurrencyFake.sol');
const KeccakUtil = artifacts.require('../utils/KeccakUtil.sol');

const assertRevert = require('../utils/assertRevert');

contract('Exchange Integration', ([owner, receiver, sender, other]) => {
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
		const weiToConvert = 42;
		await remittance.addRemittanceRequest(key, { value: weiToConvert });
		// Act
		const result = sut.convert(exchangePasswordHash, receiverPasswordHash, sender, weiToConvert, { from: receiver });
		// Assert
		await assertRevert(result);
	});

	it('convert Should revert when trying to convert `_amount` higher than the specified in the remittance request', async () => {
		// Arrange
		const weiToConvert = 42;
		await remittance.addRemittanceRequest(key, { value: weiToConvert });
		await remittance.setTrustedExchange(sut.address, true);
		// Act
		const result = sut.convert(exchangePasswordHash, receiverPasswordHash, sender, weiToConvert + 1, { from: receiver });
		// Assert
		await assertRevert(result);
	});

	it('convert Should revert when `msg.sender` is not the `_receiverAddress` embedded in the key of the remittance request', async () => {
		// Arrange
		const weiToConvert = 42;
		await remittance.addRemittanceRequest(key, { value: weiToConvert });
		await remittance.setTrustedExchange(sut.address, true);
		// Act
		const result = sut.convert(exchangePasswordHash, receiverPasswordHash, sender, weiToConvert, { from: other });
		// Assert
		await assertRevert(result);
	});

	it('convert Should add exact local currency amount to `msg.sender` balance when passed valid arguments', async () => {
		// Arrange
		const weiToConvert = 42;
		await remittance.addRemittanceRequest(key, { value: weiToConvert });
		await remittance.setTrustedExchange(sut.address, true);
		// Act
		await sut.convert(exchangePasswordHash, receiverPasswordHash, sender, weiToConvert, { from: receiver });

		const result = await sut.balanceOf.call(receiver);
		// Assert
		assert.equal(result, 84);
	});
});