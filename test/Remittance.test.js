const Remittance = artifacts.require('../contracts/Remittance.sol')

const assertRevert = require('./utils/assertRevert');
const watchEvent = require('./utils/watchEvent');
const constants = require('./utils/constants');
const increaseTime = require('./utils/increaseTime');

contract('Remittance', ([owner, anotherAccount]) => {
	let sut;

	before(() => {
		web3.eth.defaultAccount = owner;
	});

	beforeEach(async () => {
		sut = await Remittance.new();
	});

	it("OWNER_TAX_DENOMINATOR constant Should have exact value", async () => {
		// Arrange
		// Act
		// Assert
	});

	it("withdrawEther Should revert when executed from non-trusted exchange", async () => {
		// Arrange
		// Act
		// Assert
	});

	it("withdrawEther Should revert when passed `_amount` is greater than the remittance value", async () => {
		// Arrange
		// Act
		// Assert
	});

	it("withdrawEther Should subtract passed `_amount` from current remittance value", async () => {
		// Arrange
		// Act
		// Assert
	});

	it("withdrawEther Should raise LogEtherWithdrawal event when passed valid arguments", async () => {
		// Arrange
		// Act
		// Assert
	});

	it("withdrawEther Should transfer `amount` ETH to the `msg.sender` when passed valid arguments", async () => {
		// Arrange
		// Act
		// Assert
	});

	it("withdrawEther Should return true marking successful operation when passed valid arguments", async () => {
		// Arrange
		// Act
		// Assert
	});

	it("addRemittanceRequest Should add new remittance request with exact remittance details", async () => {
		// Arrange
		// Act
		// Assert
	});

	it("addRemittanceRequest Should raise LogNewRemittanceRequest event when adding new remittance request", async () => {
		// Arrange
		// Act
		// Assert
	});

	it("addRemittanceRequest Should update existing remittance request `validUntil` property when the request is not expired", async () => {
		// Arrange
		// Act
		// Assert
	});

	it("addRemittanceRequest Should update existing remittance request `validUntil` property when the request is expired", async () => {
		// Arrange
		// Act
		// Assert
	});

	it("addRemittanceRequest Should update existing remittance request `value` property when passed valid arguments", async () => {
		// Arrange
		// Act
		// Assert
	});

	it("addRemittanceRequest Should raise LogUpdatedRemittanceRequest event when updating existing remittance request", async () => {
		// Arrange
		// Act
		// Assert
	});

	it("withdrawRemittanceRequest Should revert when the remittance request is non-existing", async () => {
		// Arrange
		// Act
		// Assert
	});

	it("withdrawRemittanceRequest Should revert when the remittance request is not expired", async () => {
		// Arrange
		// Act
		// Assert
	});

	it("withdrawRemittanceRequest Should delete the given remittance request when passed valid arguments", async () => {
		// Arrange
		// Act
		// Assert
	});

	it("withdrawRemittanceRequest Should raise LogRemittanceRequestWithdrawal event when passed valid arguments", async () => {
		// Arrange
		// Act
		// Assert
	});

	it("withdrawRemittanceRequest Should non-zero values to the `msg.sender` when passed valid arguments", async () => {
		// Arrange
		// Act
		// Assert
	});

	it("setValidityDuration Should revert when invoked not from contract owner", async () => {
		// Arrange
		// Act
		// Assert
	});

	it("setValidityDuration Should revert when the passed `_newDuration` argument is less than 1 day", async () => {
		// Arrange
		// Act
		// Assert
	});

	it("setValidityDuration Should revert when the passed `_newDuration` argument is more than 1 year", async () => {
		// Arrange
		// Act
		// Assert
	});

	it("setValidityDuration Should set `validityDuration` when passed valid arguments", async () => {
		// Arrange
		// Act
		// Assert
	});
	
	it("setValidityDuration Should raise LogValidityDurationChange event when passed valid arguments", async () => {
		// Arrange
		// Act
		// Assert
	});

	it("setTrustedExchange Should revert when invoked not from owner account", async () => {
		// Arrange
		// Act
		// Assert
	});

	it("setTrustedExchange set exchange status when passed valid arguments", async () => {
		// Arrange
		// Act
		// Assert
	});

	it("setTrustedExchange raise LogSetTrustedExchange when passed valid arguments", async () => {
		// Arrange
		// Act
		// Assert
	});
});