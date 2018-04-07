const Remittance = artifacts.require('../../contracts/Remittance.sol');
const KeccakUtil = artifacts.require('../utils/KeccakUtil.sol');

const assertRevert = require('../utils/assertRevert');
const watchEvent = require('../utils/watchEvent');
const constants = require('../utils/constants');
const increaseTime = require('../utils/increaseTime');

contract('Remittance', ([owner, receiver, sender, exchange, another]) => {
	let sut,
		keccakUtil,
		exchangePasswordHash,
		receiverPasswordHash,
		key;

	before(async () => {
		web3.eth.defaultAccount = owner;
		keccakUtil = await KeccakUtil.new();
		exchangePasswordHash = await keccakUtil.encodePassword('exchange-password');
		receiverPasswordHash = await keccakUtil.encodePassword(('receiver-password'));
		key = await keccakUtil.encodeKey(exchangePasswordHash, receiverPasswordHash, receiver, sender);
	});

	beforeEach(async () => {
		sut = await Remittance.new();
	});

	it('OWNER_TAX_DENOMINATOR constant Should have exact value', async () => {
		// Arrange
		// Act
		const result = await sut.OWNER_TAX_DENOMINATOR.call();
		// Assert
		assert.equal(result, 1000000);
	});

	it('withdrawEther Should revert when executed from non-trusted exchange', async () => {
		// Arrange
		// Act
		const result = sut.withdrawEther(exchangePasswordHash, receiverPasswordHash, sender, 100);
		// Assert
		await assertRevert(result);
	});

	it('withdrawEther Should revert when passed `_amount` is greater than the remittance value', async () => {
		// Arrange
		await sut.setTrustedExchange(receiver, true);
		await sut.addRemittanceRequest(key, { value: 99 });
		// Act
		const result = sut.withdrawEther(exchangePasswordHash, receiverPasswordHash, sender, 100, { from: receiver });
		// Assert
		await assertRevert(result);
	});

	it('withdrawEther Should revert when `tx.origin` is not the `_receiverAddress` embedded in the key', async () => {
		// Arrange
		await sut.setTrustedExchange(another, true);
		await sut.addRemittanceRequest(key, { value: 142 });
		// Act
		const result = sut.withdrawEther(exchangePasswordHash, receiverPasswordHash, sender, 100, { from: another });
		// Assert
		await assertRevert(result);
	});

	it('withdrawEther Should subtract passed `_amount` from current remittance value', async () => {
		// Arrange
		await sut.setTrustedExchange(receiver, true);
		await sut.addRemittanceRequest(key, { value: 142 });
		// Act
		await sut.withdrawEther(exchangePasswordHash, receiverPasswordHash, sender, 100, { from: receiver });

		const result = await sut.remittances.call(key);
		// Assert
		assert.equal(result[0], 42);
	});

	it('withdrawEther Should raise LogEtherWithdrawal event when passed valid arguments', async () => {
		// Arrange
		await sut.setTrustedExchange(receiver, true);
		await sut.addRemittanceRequest(key, { value: 142 });

		const event = sut.LogEtherWithdrawal();
		const promiEvent = watchEvent(event);
		// Act
		await sut.withdrawEther(exchangePasswordHash, receiverPasswordHash, sender, 100, { from: receiver });

		const result = await promiEvent;
		event.stopWatching();
		// Assert
		assert.equal(result.args.receiver, receiver);
		assert.equal(result.args.sender, sender);
		assert.equal(result.args.amount, 100);
	});

	it('withdrawEther Should transfer `amount` ETH to the `msg.sender` when passed valid arguments', async () => {
		// Arrange
		await sut.setTrustedExchange(receiver, true);
		await sut.addRemittanceRequest(key, { value: 142 });

		const receiverCurrentBalance = await web3.eth.getBalance(receiver);

		const estimate = await sut.withdrawEther.estimateGas(exchangePasswordHash, receiverPasswordHash, sender, 100, { from: receiver });
		// Act
		const transactionReceipt = await sut.withdrawEther(exchangePasswordHash, receiverPasswordHash, sender, 100, { from: receiver });

		const transactionHash = transactionReceipt.tx;
		const transaction = await web3.eth.getTransaction(transactionHash);
		const currentTransactionGasPrice = transaction.gasPrice;
		const transactionCost = currentTransactionGasPrice.mul(estimate);

		const receiverNewBalance = await web3.eth.getBalance(receiver);
		const balanceDifference = receiverCurrentBalance.sub(receiverNewBalance);
		// Assert
		assert.deepEqual(balanceDifference, transactionCost.sub(100));
	});

	it('withdrawEther Should return true marking successful operation when passed valid arguments', async () => {
		// Arrange
		await sut.setTrustedExchange(receiver, true);
		await sut.addRemittanceRequest(key, { value: 142 });
		// Act
		const result = await sut.withdrawEther.call(exchangePasswordHash, receiverPasswordHash, sender, 100, { from: receiver });

		// Assert
		assert.equal(result, true);
	});

	it('addRemittanceRequest Should add new remittance request with exact remittance details', async () => {
		// Arrange
		const validityDuration = await sut.validityDuration.call();
		// Act
		const transaction = await sut.addRemittanceRequest(key, { value: 142 });

		const now = web3.eth.getBlock(transaction.receipt.blockNumber).timestamp;
		const expectedValidUntil = validityDuration.add(now);

		const result = await sut.remittances.call(key);
		// Assert
		assert.equal(result[0], 142, 'Wrong remittance value');
		assert.deepEqual(result[1], expectedValidUntil, 'Wrong remittance validUntil');
	});

	it('addRemittanceRequest Should raise LogNewRemittanceRequest event when adding new remittance request', async () => {
		// Arrange
		const validityDuration = await sut.validityDuration.call();

		const event = sut.LogNewRemittanceRequest();
		const promiEvent = watchEvent(event);
		// Act
		const transaction = await sut.addRemittanceRequest(key, { value: 142 });

		const result = await promiEvent;
		event.stopWatching();

		const now = web3.eth.getBlock(transaction.receipt.blockNumber).timestamp;
		const expectedValidUntil = validityDuration.add(now);
		// Assert
		assert.equal(result.args.key, key);
		assert.equal(result.args.value, 142);
		assert.deepEqual(result.args.validUntil, expectedValidUntil);
	});

	it('addRemittanceRequest Should update existing remittance request `validUntil` property when the request is not expired', async () => {
		// Arrange
		const validityDuration = await sut.validityDuration.call();
		const transaction = await sut.addRemittanceRequest(key, { value: 142 });
		// Act
		await sut.addRemittanceRequest(key, { value: 142 });

		const now = web3.eth.getBlock(transaction.receipt.blockNumber).timestamp;
		const expectedValidUntil = validityDuration.add(validityDuration).add(now);

		const result = await sut.remittances.call(key);
		// Assert
		assert.equal(result[0], 142 * 2);
		assert.deepEqual(result[1], expectedValidUntil);
	});

	it('addRemittanceRequest Should update existing remittance request `validUntil` property when the request is expired', async () => {
		// Arrange
		const validityDuration = await sut.validityDuration.call();
		await sut.addRemittanceRequest(key, { value: 142 });
		await increaseTime(validityDuration.toString(10) * 2);
		// Act
		const transaction = await sut.addRemittanceRequest(key, { value: 142 });

		const now = web3.eth.getBlock(transaction.receipt.blockNumber).timestamp;

		const expectedValidUntil = validityDuration.add(now);

		const result = await sut.remittances.call(key);
		// Assert
		assert.equal(result[0], 142 * 2);
		assert.deepEqual(result[1], expectedValidUntil);
	});

	it('addRemittanceRequest Should update existing remittance request `value` property when passed valid arguments', async () => {
		// Arrange
		await sut.addRemittanceRequest(key, { value: 142 });
		const valueBeforeUpdate = (await sut.remittances.call(key))[0];
		// Act
		const transaction = await sut.addRemittanceRequest(key, { value: 142 });

		const valueAfterUpdate = (await sut.remittances.call(key))[0];
		// Assert
		assert.equal(valueBeforeUpdate, valueAfterUpdate - 142);
	});

	it('addRemittanceRequest Should raise LogUpdatedRemittanceRequest event when updating existing remittance request', async () => {
		// Arrange
		const validityDuration = await sut.validityDuration.call();
		const transaction = await sut.addRemittanceRequest(key, { value: 142 });
		const now = web3.eth.getBlock(transaction.receipt.blockNumber).timestamp;

		const event = sut.LogUpdatedRemittanceRequest();
		const promiEvent = watchEvent(event);
		// Act
		await sut.addRemittanceRequest(key, { value: 142 });

		const expectedValidUntil = validityDuration.add(validityDuration).add(now);

		const result = await promiEvent;
		event.stopWatching();
		// Assert
		assert.equal(result.args.key, key);
		assert.equal(result.args.value, 142 * 2);
		assert.deepEqual(result.args.validUntil, expectedValidUntil);
	});

	it('withdrawRemittanceRequest Should revert when the remittance request is non-existing', async () => {
		// Arrange
		// Act
		const result = sut.withdrawRemittanceRequest(exchangePasswordHash, receiverPasswordHash, receiver);
		// Assert
		await assertRevert(result);
	});

	it('withdrawRemittanceRequest Should revert when the remittance request is not expired', async () => {
		// Arrange
		await sut.addRemittanceRequest(key, { value: 142 });
		// Act
		const result = sut.withdrawRemittanceRequest(exchangePasswordHash, receiverPasswordHash, receiver);
		// Assert
		await assertRevert(result);
	});

	it('withdrawRemittanceRequest Should revert when `msg.sender` is not the `_senderAddress` embedded in the key', async () => {
		// Arrange
		const validityDuration = await sut.validityDuration.call();
		await sut.addRemittanceRequest(key, { value: 142 });
		await increaseTime(validityDuration.toString(10) * 2);
		// Act
		const result = sut.withdrawRemittanceRequest(exchangePasswordHash, receiverPasswordHash, receiver, { from: another });
		// Assert
		await assertRevert(result);
	});

	it('withdrawRemittanceRequest Should delete the given remittance request when passed valid arguments', async () => {
		// Arrange
		const validityDuration = await sut.validityDuration.call();
		await sut.addRemittanceRequest(key, { value: 142 });
		await increaseTime(validityDuration.toString(10) * 2);
		// Act
		await sut.withdrawRemittanceRequest(exchangePasswordHash, receiverPasswordHash, receiver, { from: sender });

		const result = await sut.remittances.call(key);
		// Assert
		assert.equal(result[0], 0);
		assert.equal(result[1], 0);
	});

	it('withdrawRemittanceRequest Should raise LogRemittanceRequestWithdrawal event when passed valid arguments', async () => {
		// Arrange
		const validityDuration = await sut.validityDuration.call();
		await sut.addRemittanceRequest(key, { value: 142 });
		await increaseTime(validityDuration.toString(10) * 2);

		const event = sut.LogRemittanceRequestWithdrawal();
		const promiEvent = watchEvent(event);
		// Act
		await sut.withdrawRemittanceRequest(exchangePasswordHash, receiverPasswordHash, receiver, { from: sender });

		const result = await promiEvent;
		event.stopWatching();
		// Assert
		assert.equal(result.args.receiver, receiver);
		assert.equal(result.args.sender, sender);
		assert.equal(result.args.value, 142);
	});

	it('withdrawRemittanceRequest Should transfer non-zero values to the `msg.sender` when passed valid arguments', async () => {
		// Arrange
		await sut.addRemittanceRequest(key, { value: 142 });

		const validityDuration = await sut.validityDuration.call();
		await increaseTime(validityDuration.toString(10) * 2);

		const senderCurrentBalance = await web3.eth.getBalance(sender);
		const estimate = await sut.withdrawRemittanceRequest.estimateGas(exchangePasswordHash, receiverPasswordHash, receiver, { from: sender });
		// Act
		const transactionReceipt = await sut.withdrawRemittanceRequest(exchangePasswordHash, receiverPasswordHash, receiver, { from: sender });

		const transactionHash = transactionReceipt.tx;
		const transaction = await web3.eth.getTransaction(transactionHash);
		const currentTransactionGasPrice = transaction.gasPrice;
		const transactionCost = currentTransactionGasPrice.mul(estimate);

		const senderNewBalance = await web3.eth.getBalance(sender);
		const balanceDifference = senderCurrentBalance.sub(senderNewBalance);
		// Assert
		assert.deepEqual(balanceDifference, transactionCost.sub(142));
	});

	it('setValidityDuration Should revert when invoked not from contract owner', async () => {
		// Arrange
		// Act
		const result = sut.setValidityDuration(constants.weeks(1), { from: another });
		// Assert
		await assertRevert(result);
	});

	it('setValidityDuration Should revert when the passed `_newDuration` argument is less than 1 day', async () => {
		// Arrange
		// Act
		const result = sut.setValidityDuration(constants.hours(1));
		// Assert
		await assertRevert(result);
	});

	it('setValidityDuration Should revert when the passed `_newDuration` argument is more than 1 year', async () => {
		// Arrange
		// Act
		const result = sut.setValidityDuration(constants.years(2));
		// Assert
		await assertRevert(result);
	});

	it('setValidityDuration Should set `validityDuration` when passed valid arguments', async () => {
		// Arrange
		const expected = constants.days(42);
		// Act
		await sut.setValidityDuration(expected);

		const result = await sut.validityDuration.call();
		// Assert
		assert.equal(result, expected);
	});

	it('setValidityDuration Should raise LogValidityDurationChange event when passed valid arguments', async () => {
		// Arrange
		const expected = constants.days(42);

		const event = sut.LogValidityDurationChange();
		const promiEvent = watchEvent(event);
		// Act
		await sut.setValidityDuration(expected);

		const result = await promiEvent;
		event.stopWatching();
		// Assert
		assert.equal(result.args.newDuration, expected);
	});

	it('setTrustedExchange Should revert when invoked not from owner account', async () => {
		// Arrange
		// Act
		const result = sut.setTrustedExchange(exchange, true, { from: another });
		// Assert
		await assertRevert(result);
	});

	it('setTrustedExchange set exchange status when passed valid arguments', async () => {
		// Arrange
		// Act
		await sut.setTrustedExchange(exchange, true);

		const result = await sut.trustedExchanges(exchange);
		// Assert
		assert.equal(result, true);
	});

	it('setTrustedExchange raise LogSetTrustedExchange when passed valid arguments', async () => {
		// Arrange
		const event = sut.LogSetTrustedExchange();
		const promiEvent = watchEvent(event);
		// Act
		await sut.setTrustedExchange(exchange, true);

		const result = await promiEvent;
		event.stopWatching();
		// Assert
		assert.equal(result.args.exchange, exchange);
		assert.equal(result.args.isTrusted, true);
	});
});