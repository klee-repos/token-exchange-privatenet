var exchange = artifacts.require("./Exchange.sol");
var fixedSupplyToken = artifacts.require("./fixedSupplyToken.sol");

contract ('buyOrder_test', function(accounts) {

	var sellPrice_1 = 15000;
	var sellQuantity_1 = 1;
	var sellTotal_1 = sellPrice_1 * sellQuantity_1;

	var sellPrice_2 = 17000;
	var sellQuantity_2 = 1;
	var sellTotal_2 = sellPrice_2 * sellQuantity_2;

	var sellPrice_3 = 20000;
	var sellQuantity_3 = 2;
	var sellTotal_3 = sellPrice_3 * sellQuantity_3;

	var buyPrice_1 = 1000;
	var buyQuantity_1 = 1;
	var buyTotal_1 = buyPrice_1 * buyQuantity_1;

	var buyPrice_2 = 10000;
	var buyQuantity_2 = 1;
	var buyTotal_2 = buyPrice_2 * buyQuantity_2;

	var buyPrice_3 = 12000;
	var buyQuantity_3 = 1;
	var buyTotal_3 = buyPrice_3 * buyQuantity_3;

	var ethDeposit = web3.toWei(5,"ether");

	var tokenDeposit = 1000;

	before(function() {
		var exchangeInstance;
		var tokenInstance;
		return exchange.deployed().then(function(instance) {
			exchangeInstance = instance;
			return exchangeInstance.depositEther({from: accounts[0], to: exchangeInstance.address, value: ethDeposit});
		}).then(function(txResults) {
			return exchangeInstance.depositEther({from: accounts[1], to: exchangeInstance.address, value: ethDeposit});
		}).then(function(txResults) {
			return fixedSupplyToken.deployed()
		}).then(function(instance) {
			tokenInstance = instance;
			return exchangeInstance.addToken("FIXED", tokenInstance.address, {from: accounts[0]});
		}).then(function(txResults) {
			return tokenInstance.approve(exchangeInstance.address, tokenDeposit, {from: accounts[0]});
		}).then(function(boolean) {
			return exchangeInstance.depositToken("FIXED", tokenDeposit, {from: accounts[0]});
		}).then(function(txResults) {
			return exchangeInstance.sellToken("FIXED", sellPrice_1, sellQuantity_1, {from: accounts[0]});
		}).then(function(txResults) {
			return exchangeInstance.sellToken("FIXED", sellPrice_2, sellQuantity_2, {from: accounts[0]});
		}).then(function(txResults) {
			return exchangeInstance.sellToken("FIXED", sellPrice_3, sellQuantity_3, {from: accounts[0]});
		})
	})

	it('Create and complete buy order on Exchange', function() {
		var exchangeInstance;
		return exchange.deployed().then(function(instance) {
			exchangeInstance = instance;
			return exchangeInstance.buyToken("FIXED", buyPrice_1, buyQuantity_1, {from: accounts[1]});
		}).then(function(txResults) {
			assert.equal(txResults.logs[0].event, "buyOfferCreated", "buyOrderFulfilled 1 event should have fired here" );
			return exchangeInstance.getTokenBalance.call("FIXED", {from: accounts[1]});
		}).then(function(balance) {
			assert.equal(balance.toNumber(), 0, "account 1 token balance is incorrect");
			return exchangeInstance.getSellOrderBook.call("FIXED", {from: accounts[1]});
		}).then(function(orderbook) {
			assert.equal(orderbook[0].length, 3, "sell order book length is incorrect");
			assert.equal(orderbook[1][0].toNumber(), 1, "sell order book values are incorrect");
			return exchangeInstance.buyToken("FIXED", buyPrice_2, buyQuantity_2, {from: accounts[1]});
		}).then(function(txResults) {
			assert.equal(txResults.logs[0].event, "buyOfferCreated", "buyOrderFulfilled 2 event should have fired here" );
			return exchangeInstance.buyToken("FIXED", buyPrice_3, buyQuantity_3, {from: accounts[1]});
		}).then(function(txResults) {
			assert.equal(txResults.logs[0].event, "buyOfferCreated", "buyOrderFulfilled 3 event should have fired here" );
			return exchangeInstance.getBuyOrderBook.call("FIXED", {from: accounts[1]});
		}).then(function(orderbook) {
			assert.equal(orderbook[1][0].toNumber(), 1, "buy order book missing buy order");
		})
	})
})