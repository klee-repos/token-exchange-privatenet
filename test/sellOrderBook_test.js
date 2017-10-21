var exchange = artifacts.require("./Exchange.sol");
var fixedSupplyToken = artifacts.require("./fixedSupplyToken.sol");

contract ('sellOrderBook_tests', function(accounts) {

	it("Deposit 10 ether into Exchange (Account 1)" , function() {
		var exchangeInstance;
		var sendValue = 10;
		return exchange.deployed().then(function(instance) {
			exchangeInstance = instance;
			return exchangeInstance.depositEther({from: accounts[0], to: exchangeInstance.address, value: web3.toWei(sendValue, "ether")});
		}).then(function(txResults) {
			assert.equal(txResults.logs[0].event, "etherDeposit", "etherDeposit event should have fired here");
			return exchangeInstance.getEthBalanceInWei.call({from: accounts[0]});
		}).then(function(balance) {
			assert.equal(balance.toNumber(), web3.toWei(sendValue,"ether"), "Ether deposit into account 1 did not work");
		})
	})

	it("Create FIXED token on the Exchange", function() {
		var exchangeInstance;
		var fixedSupplyTokenInstance;
		return fixedSupplyToken.deployed().then(function(token_instance) {
			fixedSupplyTokenInstance = token_instance;
		}).then(function() {
			return exchange.deployed().then(function(exchange_instance) {
				exchangeInstance = exchange_instance;
				return exchangeInstance.addToken("FIXED", fixedSupplyTokenInstance.address, {from: accounts[0]});
			}).then(function(txResults) {
				assert.equal(txResults.logs[0].event, "tokenCreated", "tokenCreated event should have fired here");
				return exchangeInstance.hasToken.call("FIXED", {from: accounts[0]});
			}).then(function(boolean) {
				assert.equal(boolean, true, "Token was not successfully added to Exchange");
			})
		})
	})

	it('Deposit 1000 FIXED tokens into Exchange', function() {
		var deposit_amount = 1000;
		var fixedSupplyTokenInstance;
		var exchangeInstance;
		return fixedSupplyToken.deployed().then(function(token_instance) {
			fixedSupplyTokenInstance = token_instance;
		}).then(function() {
			return exchange.deployed().then(function(exchange_instance) {
				exchangeInstance = exchange_instance;
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
	})

	it('Withdraw 10 FIXED tokens from Exchange', function() {
		var withdraw_amount = 10;
		var fixedSupplyTokenInstance;
		var exchangeInstance;
		return fixedSupplyToken.deployed().then(function(token_instance) {
			fixedSupplyTokenInstance = token_instance;
		}).then(function() {
			return exchange.deployed().then(function(exchange_instance) {
				exchangeInstance = exchange_instance;
				return exchangeInstance.withdrawToken("FIXED", withdraw_amount, {from: accounts[0]});
			}).then(function(txResults) {
				assert.equal(txResults.logs[0].event, "tokenWithdraw", "tokenWithdraw event should have fired here");
				return exchangeInstance.getTokenBalance.call("FIXED", {from: accounts[0]});
			}).then(function(balance) {
				assert.equal(balance, 990, "Tokens were not withdrawn from Exchange");
			})
		})
	})

	it('Test sell order book from Exchange', function() {
		var sellPrice_1 = 100000;
		var sellQuantity_1 = 1;
		var sellPrice_2 = 200000;
		var sellQuantity_2 = 1;
		var sellPrice_3 = 150000;
		var sellQuantity_3 = 1;
		var exchangeInstance;
		return exchange.deployed().then(function(instance) {
			exchangeInstance = instance;
			return exchangeInstance.sellToken("FIXED", sellPrice_1, sellQuantity_1, {from: accounts[0]});
		}).then(function(txResults) {
			assert.equal(txResults.logs[0].event, "sellOfferCreated", "sellOfferCreated event should have fired here");
			return exchangeInstance.getSellOrderBook.call("FIXED", {from: accounts[0]});
		}).then(function(array) {
			assert.equal(array[0][0].toNumber(), sellPrice_1, "sellPrice_1 is in the wrong location in array");
			assert.equal(array[1][0].toNumber(), sellQuantity_1, "sellQuantity_1 is in the wrong location in array");
			return exchangeInstance.getTokenBalance.call("FIXED", {from: accounts[0]}); 
		}).then(function(balance) {
			assert.equal(balance, 990 - sellQuantity_1, "Token balance incorrect after sell order created");
			return exchangeInstance.sellToken("FIXED", sellPrice_2, sellQuantity_2, {from: accounts[0]});
		}).then(function(txResults) {
			assert.equal(txResults.logs[0].event, "sellOfferCreated", "sellOfferCreated event should have fired here");
			return exchangeInstance.getSellOrderBook.call("FIXED", {from: accounts[0]});
		}).then(function(array) {
			assert.equal(array[0][1].toNumber(), sellPrice_2, "sellPrice_2 is in the wrong location in array");
			assert.equal(array[1][1].toNumber(), sellQuantity_2, "sellQuantity_2 is in the wrong location in array");
			return exchangeInstance.sellToken("FIXED", sellPrice_3, sellQuantity_3, {from: accounts[0]});
		}).then(function(txResults) {
			assert.equal(txResults.logs[0].event, "sellOfferCreated", "sellOfferCreated event should have fired here");
			return exchangeInstance.getSellOrderBook.call("FIXED", {from: accounts[0]});
		}).then(function(array) {
			assert.equal(array[0][1].toNumber(), sellPrice_3, "sellPrice_3 is in the wrong location in array");
			assert.equal(array[1][1].toNumber(), sellQuantity_3, "sellQuantity_3 is in the wrong location in array");
		})
	})

	it('Cancel a sell order from Exchange', function() {
		var exchangeInstance;
		return exchange.deployed().then(function(instance) {
			exchangeInstance = instance;
			return exchangeInstance.cancelOrder("FIXED", true, 150000, 1, {from: accounts[0]});
		}).then(function(txResults) {
			assert.equal(txResults.logs[0].event, "sellOrderCancelled", "sellOrderCancelled event should have fired here");
			return exchangeInstance.getSellOrderBook.call("FIXED", {from: accounts[0]});
		}).then(function(array) {
			assert.equal(array[1][1].toNumber(), 0, "sellQuantity_3 should be 0 after order cancelled");
			return exchangeInstance.getTokenBalance.call("FIXED", {from: accounts[0]}); 
		}).then(function(balance) {
			assert.equal(balance.toNumber(), 988, "Token balance is incorrect after sell order cancellation");
		})
	})

})