const Exchange = artifacts.require('../../contracts/Exchange.sol');
const LocalCurrencyFake = artifacts.require('./fakes/LocalCurrencyFake.sol');
const RemittanceFake = artifacts.require('./fakes/RemittanceFake.sol');

const assertRevert = require('../utils/assertRevert');
const watchEvent = require('../utils/watchEvent');
const assertThrow = require('../utils/assertThrow');

contract('Exchange', ([owner, other]) => {
	let sut,
		localCurrency,
		remittance;

	const defaultExchangeRate = '2000000000000000000';
	const zeroAddress = '0x0000000000000000000000000000000000000000';
	const notUsed = '0x00000000000000000000000000000000000000ff';

	const defaultSetup = async () => {
		sut = await Exchange.new(localCurrency.address, remittance.address, defaultExchangeRate);
	}

	before(() => {
		web3.eth.defaultAccount = owner;
	});

	beforeEach(async () => {
		localCurrency = await LocalCurrencyFake.new();
		remittance = await RemittanceFake.new();
	});

	it('constructor Should revert when passed empty `_localCurrencyImplementation` address', async () => {
		// Arrange
		// Act
		const result = Exchange.new(zeroAddress, remittance.address, defaultExchangeRate);
		// Assert
		await assertRevert(result);
	});

	it('constructor Should revert when passed empty `_remittanceImplementation` address', async () => {
		// Arrange
		// Act
		const result = Exchange.new(localCurrency.address, zeroAddress, defaultExchangeRate);
		// Assert
		await assertRevert(result);
	});

	it('constructor Should revert when passed zero `_exchangeRate` parameter', async () => {
		// Arrange
		// Act
		const result = Exchange.new(localCurrency.address, remittance.address, 0);
		// Assert
		await assertRevert(result);
	});

	it('constructor Should set proper `localCurrency` instance when passed valid arguments', async () => {
		// Arrange
		await defaultSetup();
		// Act
		const result = await sut.localCurrency.call();
		// Assert
		assert.equal(result, localCurrency.address);
	});

	it('constructor Should set proper `remittance` instance when passed valid arguments', async () => {
		// Arrange
		await defaultSetup();
		// Act
		const result = await sut.remittance.call();
		// Assert
		assert.equal(result, remittance.address);
	});

	it('constructor Should set proper `exchangeRate` value when passed valid arguments', async () => {
		// Arrange
		await defaultSetup();
		// Act
		const result = await sut.exchangeRate.call();
		// Assert
		assert.equal(result, defaultExchangeRate);
	});

	it('convert Should invoke a call on `remittance.withdrawEther` when passed valid arguments', async () => {
		// Arrange
		const transferValue = 100;
		await defaultSetup();
		await web3.eth.sendTransaction({ to: remittance.address, value: transferValue });
		// Act
		await sut.convert(notUsed, notUsed, notUsed, transferValue);
		const result = await remittance.isWithdrawEtherCalled.call();
		// Assert
		assert.equal(result, true);
	});

	it('convert Should revert when `remittance.withdrawEther` returns false', async () => {
		// Arrange
		const transferValue = 42;
		await defaultSetup();
		await web3.eth.sendTransaction({ to: remittance.address, value: transferValue });
		// Act
		const result = sut.convert(notUsed, notUsed, notUsed, transferValue);
		// Assert
		await assertRevert(result);
	});

	it('convert Should throw when `remittance.withdrawEther` transfers less ETH than `_amount` expected', async () => {
		// Arrange
		const transferValue = 256;
		await defaultSetup();
		await web3.eth.sendTransaction({ to: remittance.address, value: transferValue });
		// Act
		const result = sut.convert(notUsed, notUsed, notUsed, transferValue);
		// Assert
		await assertThrow(result);
	});

	it('convert Should add exact local currency amount to `msg.sender` balance when the exchange rate is over a unit', async () => {
		// Arrange
		const transferValue = web3.toWei(1, 'ether');
		await defaultSetup();
		await web3.eth.sendTransaction({ to: remittance.address, value: transferValue });
		// Act
		await sut.convert(notUsed, notUsed, notUsed, transferValue);

		const result = await sut.balanceOf.call(owner);
		// Assert
		assert.equal(result, defaultExchangeRate);
	});

	it('convert Should add exact local currency amount to `msg.sender` balance when the exchange rate is under a unit', async () => {
		// Arrange
		sut = await Exchange.new(localCurrency.address, remittance.address, '500000000000000000');
		const transferValue = web3.toWei(2, 'ether');
		const expectedBalance = web3.toWei(1, 'ether');
		await web3.eth.sendTransaction({ to: remittance.address, value: transferValue });
		// Act
		await sut.convert(notUsed, notUsed, notUsed, transferValue);

		const result = await sut.balanceOf.call(owner);
		// Assert
		assert.equal(result, expectedBalance);
	});

	it('convert Should raise LogCurrencyConversion event when passed valid arguments', async () => {
		// Arrange
		await defaultSetup();

		const event = sut.LogCurrencyConversion();
		const promiEvent = watchEvent(event);

		const transferValue = web3.toWei(1, 'ether');
		await web3.eth.sendTransaction({ to: remittance.address, value: transferValue });
		// Act
		await sut.convert(notUsed, notUsed, notUsed, transferValue);

		const result = await promiEvent;
		event.stopWatching();
		// Assert
		assert.equal(result.args.receiver, owner);
		assert.equal(result.args.sender, notUsed);
		assert.equal(result.args.etherAmount, transferValue);
		assert.equal(result.args.localCurrencyAmount, defaultExchangeRate);
	});

	it('withdrawLocalCurrency Should revert when the `msg.sender` has not got enough balance', async () => {
		// Arrange
		await defaultSetup();
		// Act
		const result = sut.withdrawLocalCurrency(100);
		// Assert
		await assertRevert(result);
	});

	it('withdrawLocalCurrency Should revert when `localCurrency.transfer` function invocation returns false', async () => {
		// Arrange
		const transferValue = web3.toWei(1, 'ether');
		await defaultSetup();
		await web3.eth.sendTransaction({ to: remittance.address, value: transferValue });
		await sut.convert(notUsed, notUsed, notUsed, transferValue);
		// Act
		const result = sut.withdrawLocalCurrency(42);
		// Assert
		await assertRevert(result);
	});

	it('withdrawLocalCurrency Should lower the `msg.sender` balance with exact value when passed valid arguments', async () => {
		// Arrange
		const transferValue = web3.toWei(1, 'ether');
		await defaultSetup();
		await web3.eth.sendTransaction({ to: remittance.address, value: transferValue });
		await sut.convert(notUsed, notUsed, notUsed, transferValue);
		const ownerBalance = await sut.balanceOf.call(owner);
		// Act
		await sut.withdrawLocalCurrency(defaultExchangeRate);

		const ownerNewBalance = await sut.balanceOf.call(owner);
		// Assert
		assert.equal(ownerBalance, defaultExchangeRate);
		assert.equal(ownerNewBalance, 0);
	});

	it('withdrawLocalCurrency Should raise LogWithdrawal event when passed valid arguments', async () => {
		// Arrange
		const transferValue = web3.toWei(1, 'ether');
		await defaultSetup();
		await web3.eth.sendTransaction({ to: remittance.address, value: transferValue });
		await sut.convert(notUsed, notUsed, notUsed, transferValue);
		const event = sut.LogWithdrawal();
		const promiEvent = watchEvent(event);
		// Act
		await sut.withdrawLocalCurrency(defaultExchangeRate);

		const result = await promiEvent;
		event.stopWatching();
		// Assert
		assert.equal(result.args.receiver, owner);
		assert.equal(result.args.amount, defaultExchangeRate);
	});

	it('setExchangeRate Should revert when invoked not from the contract owner', async () => {
		// Arrange
		await defaultSetup();
		const newExchangeRate = 42;
		// Act
		const result = sut.setExchangeRate(newExchangeRate, { from: other });
		// Assert
		assertRevert(result);
	});

	it('setExchangeRate Should set the new exchange rate when invoked from the contract owner', async () => {
		// Arrange
		await defaultSetup();
		const newExchangeRate = 42;
		// Act
		await sut.setExchangeRate(newExchangeRate);
		const result = await sut.exchangeRate.call();
		// Assert
		assert.equal(result, newExchangeRate);
	});

	it('setExchangeRate Should raise LogExchangeRateChanged event', async () => {
		// Arrange
		await defaultSetup();
		const newExchangeRate = 42;
		const event = sut.LogExchangeRateChanged();
		const promiEvent = watchEvent(event);
		// Act
		await sut.setExchangeRate(newExchangeRate);

		const result = await promiEvent;
		event.stopWatching();
		// Assert
		assert.equal(result.args.newExchangeRate, newExchangeRate);
	});
});