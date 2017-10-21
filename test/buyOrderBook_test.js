var exchange = artifacts.require("./Exchange.sol");
var fixedSupplyToken = artifacts.require("./fixedSupplyToken.sol");

contract ('buyOrderBook_test', function(accounts) {

	var buyPrice_1 = web3.toWei(3, "ether");
	var buyQuantity_1 = 1;
	var buyTotal_1 = buyPrice_1 * buyQuantity_1;

	var buyPrice_2 = web3.toWei(2, "ether");
	var buyQuantity_2 = 2;
	var buyTotal_2 = buyPrice_2 * buyQuantity_2;

	var buyPrice_3 = web3.toWei(1, "ether");
	var buyQuantity_3 = 3;
	var buyTotal_3 = buyPrice_3 * buyQuantity_3;

	var sellPrice_1 = web3.toWei(2, "ether");
	var sellQuantity_1 = 2;
	var sellTotal_1 = sellPrice_1 * sellQuantity_1

	var sendValue = web3.toWei(20,"ether");

	var deposit_amount = 1000;

	it("Deposit 10 ether into Exchange (Account 2)" , function() {
		var exchangeInstance;
		return exchange.deployed().then(function(instance) {
			exchangeInstance = instance;
			return exchangeInstance.depositEther({from: accounts[1], to: exchangeInstance.address, value: sendValue});
		}).then(function(txResults) {
			assert.equal(txResults.logs[0].event, "etherDeposit", "etherDeposit event should have fired here");
			return exchangeInstance.getEthBalanceInWei.call({from: accounts[1]});
		}).then(function(balance) {
			assert.equal(balance.toNumber(), sendValue, "Ether deposit into account 1 did not work");
		})
	})

	it("Create FIXED token on the Exchange", function() {
		var fixedSupplyTokenInstance;
		var exchangeInstance;
		return fixedSupplyToken.deployed().then(function(instance) {
			fixedSupplyTokenInstance = instance;
			return exchange.deployed()
		}).then(function(instance) {
			exchangeInstance = instance;
			return exchangeInstance.addToken("FIXED", fixedSupplyTokenInstance.address, {from: accounts[0]});
		}).then(function(txResults) {
			assert.equal(txResults.logs[0].event, "tokenCreated", "tokenCreated event should have fired here");
			return exchangeInstance.hasToken.call("FIXED", {from: accounts[0]});
		}).then(function(boolean) {
			assert.equal(boolean, true, "Token was not successfully added to Exchange");
		})
	})

	it('Deposit FIXED tokens into Exchange', function() {
		var fixedSupplyTokenInstance;
		var exchangeInstance;
		return fixedSupplyToken.deployed().then(function(instance) {
			fixedSupplyTokenInstance = instance;
			return exchange.deployed()
		}).then(function(instance) {
			exchangeInstance = instance;
			return fixedSupplyTokenInstance.approve(exchangeInstance.address, deposit_amount, {from: accounts[0]});
		}).then(function(boolean) {
			return exchangeInstance.depositToken("FIXED", deposit_amount, {from: accounts[0]});
		}).then(function(txResults) {
			assert.equal(txResults.logs[0].event, "tokenDeposited", "tokenDeposited event should have fired here");
			return exchangeInstance.getTokenBalance.call("FIXED", {from: accounts[0]});
		}).then(function(balance) {
			assert.equal(balance, deposit_amount, "Tokens were not successfully transfered to Exchange");
		})
	})

	it('Test buy order book from Exchange', function() {
		var exchangeInstance;
		return exchange.deployed().then(function(instance) {
			exchangeInstance = instance;
			return exchangeInstance.buyToken("FIXED", buyPrice_1, buyQuantity_1, {from: accounts[1]});
		}).then(function(txResults) {
			assert.equal(txResults.logs[0].event, "buyOfferCreated", "buyOfferCreated event should have fired here");
			return exchangeInstance.getBuyOrderBook.call("FIXED", {from: accounts[1]});
		}).then(function(array) {
			assert.equal(array[0][0], buyPrice_1, "buy price 1 not found in correct location (1 order)");
			assert.equal(array[1][0], buyQuantity_1, "buy quantity 1 not found in correct location(1 order)");
			return exchangeInstance.buyToken("FIXED", buyPrice_2, buyQuantity_2, {from: accounts[1]});
		}).then(function(txResults) {
			assert.equal(txResults.logs[0].event, "buyOfferCreated", "buyOfferCreated event should have fired here");
			return exchangeInstance.getBuyOrderBook.call("FIXED", {from: accounts[1]});
		}).then(function(array) {
			assert.equal(array[0][0], buyPrice_2, "buyPrice_2 not found in correct location");
			assert.equal(array[1][0], buyQuantity_2, "buyQuantity_2 not found in correct location");
			return exchangeInstance.buyToken("FIXED", buyPrice_3, buyQuantity_3, {from: accounts[1]});
		}).then(function(txResults) {
			assert.equal(txResults.logs[0].event, "buyOfferCreated", "buyOfferCreated event should have fired here");
			return exchangeInstance.getBuyOrderBook.call("FIXED", {from: accounts[1]});
		}).then(function(array) {
			assert.equal(array[0][0], buyPrice_3, "buyPrice_3 not found in correct location");
			assert.equal(array[1][0], buyQuantity_3, "buyQuantity_3 not found in correct location");
		})
	})

	it('Cancel a buy order from Exchange', function() {
		var exchangeInstance;
		var origBalance;
		return exchange.deployed().then(function(instance) {
			exchangeInstance = instance;
			return exchangeInstance.getEthBalanceInWei.call({from: accounts[1]});
		}).then(function(balance) {
			assert.equal(balance.toNumber(), sendValue - buyTotal_1 - buyTotal_2 - buyTotal_3, "ether balance incorrect");
			origBalance = balance;
			return exchangeInstance.cancelOrder("FIXED", false, buyPrice_2, 1, {from: accounts[1]});
		}).then(function(txResults) {
			assert.equal(txResults.logs[0].event, "buyOrderCancelled", "buyOrderCancelled event should have fired here");
			return exchangeInstance.getBuyOrderBook.call("FIXED", {from: accounts[1]});
		}).then(function(array) {
			assert.equal(array[1][1].toNumber(), 0, "buyQuantity_2 should equal 0 after buy order cancellation");
			return exchangeInstance.getEthBalanceInWei.call({from: accounts[1]});
		}).then(function(balance) {
			assert.equal(balance.toNumber(), sendValue - buyTotal_1 - buyTotal_3, "Ether balance is incorrect after buy order cancellation");
		})
	})

})