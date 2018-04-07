const Exchange = artifacts.require('../../contracts/Exchange.sol');
const LocalCurrencyFake = artifacts.require('./fakes/LocalCurrencyFake.sol');
const RemittanceFake = artifacts.require('./fakes/RemittanceFake.sol');

contract('Exchange', ([owner, receiver, sender, exchange, another]) => {
	let sut,
		localCurrency,
		remittance;

	const defaultExchangeRate = '2000000000000000000';

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
		// Assert
	});

	it('constructor Should revert when passed empty `_remittanceImplementation` address', async () => {
		// Arrange
		// Act
		// Assert
	});

	it('constructor Should revert when passed zero `_exchangeRate` parameter', async () => {
		// Arrange
		// Act
		// Assert
	});

	it('constructor Should set proper `localCurrency` instance when passed valid arguments', async () => {
		// Arrange
		// Act
		// Assert
	});

	it('constructor Should set proper `remittance` instance when passed valid arguments', async () => {
		// Arrange
		// Act
		// Assert
	});

	it('constructor Should set proper `exchangeRate` value when passed valid arguments', async () => {
		// Arrange
		// Act
		// Assert
	});

	it('convert Should invoke a call on `remittance.withdrawEther` when passed valid arguments', async () => {
		// Arrange
		// Act
		// Assert
	});

	it('convert Should revert when `remittance.withdrawEther` returns false', async () => {
		// Arrange
		// Act
		// Assert
	});

	it('convert Should throw when `remittance.withdrawEther` transfers less ETH than `_amount` expected', async () => {
		// Arrange
		// Act
		// Assert
	});

	it('convert Should add exact local currency amount to `msg.sender` balance when passed valid arguments', async () => {
		// Arrange
		// Act
		// Assert
	});

	it('convert Should raise LogCurrencyConversion event when passed valid arguments', async () => {
		// Arrange
		// Act
		// Assert
	});

	it('withdrawLocalCurrency Should revert when the `msg.sender` has not got enough balance', async () => {
		// Arrange
		// Act
		// Assert
	});

	it('withdrawLocalCurrency Should revert when `localCurrency.transfer` function invocation returns false', async () => {
		// Arrange
		// Act
		// Assert
	});

	it('withdrawLocalCurrency Should revert when `localCurrency.transfer` function invocation returns false', async () => {
		// Arrange
		// Act
		// Assert
	});

	it('withdrawLocalCurrency Should lower the `msg.sender` balance with exact value when passed valid arguments', async () => {
		// Arrange
		// Act
		// Assert
	});

	it('withdrawLocalCurrency Should raise LogWithdrawal event when passed valid arguments', async () => {
		// Arrange
		// Act
		// Assert
	});

	it('setExchangeRate Should revert when invoked not from the contract owner', async () => {
		// Arrange
		// Act
		// Assert
	});

	it('setExchangeRate Should set the new exchange rate when invoked from the contract owner', async () => {
		// Arrange
		// Act
		// Assert
	});

	it('setExchangeRate Should raise LogExchangeRateChanged event', async () => {
		// Arrange
		// Act
		// Assert
	});
});