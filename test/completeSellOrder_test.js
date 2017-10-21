var exchange = artifacts.require("./Exchange.sol");
var fixedSupplyToken = artifacts.require("./fixedSupplyToken.sol");

contract ('completeSellOrder_test', function(accounts) {

	var buyPrice_1 = 30000;
	var buyQuantity_1 = 3;
	var buyTotal_1 = buyPrice_1 * buyQuantity_1;

	var buyPrice_2 = 20000;
	var buyQuantity_2 = 3;
	var buyTotal_2 = buyPrice_2 * buyQuantity_2;

	var buyPrice_3 = 10000;
	var buyQuantity_3 = 3;
	var buyTotal_3 = buyPrice_3 * buyQuantity_3;

	var sellPrice_1 = 20000;
	var sellQuantity_1 = 4;
	var sellTotal_1 = sellPrice_1 * sellQuantity_1

	var sellPrice_2 = 20000;
	var sellQuantity_2 = 3;
	var sellTotal_2 = sellPrice_2 * sellQuantity_2

	var ethDeposit = web3.toWei(5,"ether");

	var tokenDeposit = 1000;

	before(function() {
		var exchangeInstance;
		var tokenInstance;
		return exchange.deployed().then(function(instance) {
			exchangeInstance = instance;
			return exchangeInstance.depositEther({from: accounts[1], to: exchangeInstance.address, value: ethDeposit});
		}).then(function(txResults) {
			return exchangeInstance.depositEther({from: accounts[0], to: exchangeInstance.address, value: ethDeposit});
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
			return exchangeInstance.buyToken("FIXED", buyPrice_1, buyQuantity_1, {from: accounts[1]});
		}).then(function(txResults) {
			return exchangeInstance.buyToken("FIXED", buyPrice_2, buyQuantity_2, {from: accounts[1]});
		}).then(function(txResults) {
			return exchangeInstance.buyToken("FIXED", buyPrice_3, buyQuantity_3, {from: accounts[1]});
		})
	})

	it('Create and complete sell order on Exchange', function() {
		var exchangeInstance;
		return exchange.deployed().then(function(instance) {
			exchangeInstance = instance;
			return exchangeInstance.sellToken("FIXED", sellPrice_1, sellQuantity_1, {from: accounts[0]});
		}).then(function(txResults) {
			assert.equal(txResults.logs[0].event, "sellOrderFulfilled", "sellOrderFulfilled event should have fired here");
			return exchangeInstance.getTokenBalance.call("FIXED", {from: accounts[0]});
		}).then(function(balance) {
			assert.equal(balance.toNumber(), tokenDeposit - sellQuantity_1, "Account 0 token balance is incorrect");
			return exchangeInstance.getTokenBalance.call("FIXED", {from: accounts[1]});
		}).then(function(balance) {
			assert.equal(balance.toNumber(), sellQuantity_1, "Account 1 token balance is incorrect");
			return exchangeInstance.getBuyOrderBook.call("FIXED", {from: accounts[0]});
		}).then(function(orderbook) {
			assert.equal(orderbook[1].length, 2, "buy order book length incorrect");
			assert.equal(orderbook[1][1], 2, "buy order book [1][1] should be 2");
			return exchangeInstance.sellToken("FIXED", sellPrice_1, sellQuantity_1, {from: accounts[0]});
		}).then(function(txResults) {
			assert.equal(txResults.logs[0].event, "sellOrderFulfilled", "sellOrderFulfilled event should have fired here");
			return exchangeInstance.getSellOrderBook.call("FIXED", {from: accounts[0]});
		}).then(function(orderbook) {
			assert.equal(orderbook[0].length, 1, "sell order book length incorrect");
		})
	})

})