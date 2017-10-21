var exchange = artifacts.require("./Exchange.sol");
var fixedSupplyToken = artifacts.require("./fixedSupplyToken.sol");

contract ("exchange_test", function(accounts) {

	it("Deposit 10 ether into Exchange" , function() {
		var sendValue = 10;
		var exchangeInstance;
		return exchange.deployed().then(function(instance) {
			exchangeInstance = instance;
			return exchangeInstance.depositEther({from: accounts[0], to: exchangeInstance.address, value: web3.toWei(sendValue, "ether")});
		}).then(function(txResults) {
			assert.equal(txResults.logs[0].event, "etherDeposit", "etherDeposit event should have fired here");
			return exchangeInstance.getEthBalanceInWei.call({from: accounts[0]});
		}).then(function(balance) {
			assert.equal(balance.toNumber(), web3.toWei(sendValue,"ether"), "Ether deposit did not work");
		})
	})

	it("Withdraw 10 ether from Exchange", function() {
		var withdrawValue = 10;
		var exchangeInstance;
		return exchange.deployed().then(function(instance) {
			exchangeInstance = instance;
			return exchangeInstance.withdrawEther(web3.toWei(withdrawValue, "ether"), {from: accounts[0]});
		}).then(function(txResults) {
			assert.equal(txResults.logs[0].event, "etherWithraw", "etherWithdraw event should have fired here");
			return exchangeInstance.getEthBalanceInWei.call({from: accounts[0]});
		}).then(function(balance) {
			assert.equal(balance.toNumber(), 0, "Ether withdraw did not work");
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

	it('Deposit 10 FIXED tokens into Exchange', function() {
		var deposit_amount = 10;
		var exchangeInstance;
		var fixedSupplyTokenInstance;
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
		var exchangeInstance;
		var fixedSupplyTokenInstance;
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
				assert.equal(balance, 0, "Tokens were not withdrawn from Exchange");
			})
		})
	})


})