var fixedSupplyToken = artifacts.require("./FixedSupplyToken.sol");


contract('FixedSupplyToken_test', function(accounts) {

	it('first account should own all tokens', function() {
		var _totalSupply;
		var myTokenInstance;
		return fixedSupplyToken.deployed().then(function(instance) {
			myTokenInstance = instance;
			return myTokenInstance.totalSupply.call();
		}).then(function(totalSupply) {
			_totalSupply = totalSupply;
			return myTokenInstance.balanceOf(accounts[0]);
		}).then(function(balanceAccountOwner) {
			assert.equal(balanceAccountOwner.toNumber(), _totalSupply.toNumber(), "owner balance should equal total balance of tokens");
		})
	})

	it('second acount should have no tokens', function() {
		var myTokenInstance;
		return fixedSupplyToken.deployed().then(function(instance) {
			myTokenInstance = instance;
			return myTokenInstance.balanceOf(accounts[1]);
		}).then(function(accountBalance) {
			assert.equal(accountBalance.toNumber(), 0, "account two balance should equal 0 tokens");
		})
	})

	it('check transfer function', function() {

		var account_one = accounts[0];
		var account_two = accounts[1];

		var account_one_initial;
		var account_two_initial;
		var account_one_end;
		var account_two_end;

		var transfer_amount = 1;

		var myTokenInstance;
		return fixedSupplyToken.deployed().then(function(instance){
			myTokenInstance = instance;
			return myTokenInstance.balanceOf(account_one);
		}).then(function(balance) {
			account_one_initial = balance.toNumber();
			return myTokenInstance.balanceOf(account_two);
		}).then(function(balance) {
			account_two_initial = balance.toNumber();
			return myTokenInstance.transfer(account_two,transfer_amount);
		}).then(function() {
			return myTokenInstance.balanceOf(account_one);
		}).then(function(balance) {
			account_one_end = balance.toNumber();
			return myTokenInstance.balanceOf(account_two);
		}).then(function(balance) {
			account_two_end = balance.toNumber();
			assert.equal(account_one_end, account_one_initial - transfer_amount, "account one balance is incorrect");
			assert.equal(account_two_end, account_two_initial + transfer_amount, "account two balance is incorrect");
		})
	})
})