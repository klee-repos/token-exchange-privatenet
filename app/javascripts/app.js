// Import the page's CSS. Webpack will know what to do with it.
import "../stylesheets/app.css";

// Import jquery and bootstrap
import 'jquery';
import 'bootstrap-loader';

// Import libraries we need.
import { default as Web3} from 'web3';
import { default as contract } from 'truffle-contract';

// Import our contract artifacts and turn them into usable abstractions.
import exchange_artifact from '../../build/contracts/Exchange.json';
import token_artifact from '../../build/contracts/FixedSupplyToken.json';

var ExchangeContract = contract(exchange_artifact);
var TokenContract = contract(token_artifact);

var tokenName = "VINYL";

var accounts;
var account;

window.App = {
  start: function() {
    var self = this;

    ExchangeContract.setProvider(web3.currentProvider);
    TokenContract.setProvider(web3.currentProvider);

    web3.eth.getAccounts(function(err, accs) {
      if (err != null) {
        alert("There was an error obtaining accounts");
        return;
      }
      if (accs.length == 0) {
        alert("Make sure ethereum client is configured correctly");
        return;
      }
      accounts = accs;
      account = accounts[0];
    })

  },

  setStatus: function(message) {
    var status = document.getElementById("status");
    status.innerHTML = message;
  },

  initIndex: function() {
    App.updateBalanceExchange();
    App.printImportantInformation();
    App.watchDepositEvents();
    App.watchWithdrawEvents();
  },

  initTrading: function() {
    App.updateBalanceExchange();
    App.updateOrderBook();
    App.printImportantInformation();
    App.watchBuyToken();
    App.watchSellToken();
  },

  initManageToken: function() {
    App.updateTokenBalance();
    App.watchTokenEvents();
    App.watchTokenCreateEvent();
    App.printImportantInformation();
  },

  updateBalanceExchange: function() {
    var self = this;
    var exchangeInstance;
    ExchangeContract.deployed().then(function(instance) {
      exchangeInstance = instance;
      return exchangeInstance.getTokenBalance.call(tokenName, {from: account});
    }).then(function(balance) {
      var token_balance = document.getElementById("balanceTokenInExchange");
      token_balance.innerHTML = balance.toNumber();
      return exchangeInstance.getEthBalanceInWei.call({from: account});
    }).then(function(balance) {
      var eth_balance = document.getElementById("balanceEthInExchange");
      eth_balance.innerHTML = web3.fromWei(balance.toNumber(), "ether");
    }).catch(function(e) {
      console.log(e);
      self.setStatus("Error getting balance. See log.")
    })
  },

  updateTokenBalance: function() {
    var self = this;
    var tokenInstance;
    TokenContract.deployed().then(function(instance) {
      tokenInstance = instance;
      return tokenInstance.balanceOf.call(account);
    }).then(function(balance) {
      var balance_element = document.getElementById("balanceTokenInToken");
      balance_element.innerHTML = balance.valueOf();
    }).catch(function(e) {
      console.log(e);
      self.setStatus("Error getting balance. See log.");
    })
  },

  watchTokenEvents: function() {
    var self = this;
    var tokenInstance;
    TokenContract.deployed().then(function(instance) {
      tokenInstance = instance;

      tokenInstance.allEvents({fromBlock:0, toBlock:'latest'}).watch(function(error, result) {
        if (error != null) {
          alert("There was an error obtaining events");
          return;
        }
        var alertbox = document.createElement("div");
        alertbox.setAttribute("class", "alert alert-info alert-dismissible");
        var closeBtn = document.createElement("button");
        closeBtn.setAttribute("type", "button");
        closeBtn.setAttribute("class", "close");
        closeBtn.setAttribute("data-dismiss", "alert");
        closeBtn.innerHTML = "<span>&times;</span>";
        alertbox.appendChild(closeBtn);

        var eventTitle = document.createElement("div");
        eventTitle.innerHTML = '<strong>New Event: ' + result.event + '</strong>';
        alertbox.appendChild(eventTitle);

        var argsBox = document.createElement('textarea');
        argsBox.setAttribute("class", "form-control");
        argsBox.innerText = JSON.stringify(result.args);
        alertbox.appendChild(argsBox);
        document.getElementById("tokenEvents").appendChild(alertbox);
      })

    }).catch(function(e) {
      console.log(e);
      self.setStatus("Error getting balance. See log.");
    })
  },

  watchTokenCreateEvent: function() {
    var exchangeInstance;
    ExchangeContract.deployed().then(function(instance) {
      exchangeInstance = instance;

      exchangeInstance.tokenCreated({}, {fromBlock:0, toBlock:'latest'}).watch(function(error, result) {
        if (error != null) {
          alert("There was an error obtaining events");
          return;
        }
        var alertbox = document.createElement("div");
        alertbox.setAttribute("class", "alert alert-info alert-dismissible");
        var closeBtn = document.createElement("button");
        closeBtn.setAttribute("type", "button");
        closeBtn.setAttribute("class", "close");
        closeBtn.setAttribute("data-dismiss", "alert");
        closeBtn.innerHTML = "<span>&times;</span>";
        alertbox.appendChild(closeBtn);

        var eventTitle = document.createElement("div");
        eventTitle.innerHTML = '<strong>New Event: ' + result.event + '</strong>';
        alertbox.appendChild(eventTitle);

        var argsBox = document.createElement('textarea');
        argsBox.setAttribute("class", "form-control");
        argsBox.innerText = JSON.stringify(result.args);
        alertbox.appendChild(argsBox);
        document.getElementById("exchangeEvents").appendChild(alertbox);
      })

    }).catch(function(e) {
      console.log(e);
      App.setStatus("Error getting token creation events");
    })
  },

  watchDepositEvents: function() {
    var exchangeInstance;
    ExchangeContract.deployed().then(function(instance) {
      exchangeInstance = instance;

      exchangeInstance.tokenDeposited({},{fromBlock:0, toBlock:'latest'}).watch(function(error, result) {
        if (error != null) {
          alert("There was an error obtaining events");
          return;
        }
        var alertbox = document.createElement("div");
        alertbox.setAttribute("class", "alert alert-info alert-dismissible");
        var closeBtn = document.createElement("button");
        closeBtn.setAttribute("type", "button");
        closeBtn.setAttribute("class", "close");
        closeBtn.setAttribute("data-dismiss", "alert");
        closeBtn.innerHTML = "<span>&times;</span>";
        alertbox.appendChild(closeBtn);

        var eventTitle = document.createElement("div");
        eventTitle.innerHTML = '<strong>New Event: ' + result.event + '</strong>';
        alertbox.appendChild(eventTitle);

        var argsBox = document.createElement('textarea');
        argsBox.setAttribute("class", "form-control");
        argsBox.innerText = JSON.stringify(result.args);
        alertbox.appendChild(argsBox);
        document.getElementById("depositEvents").appendChild(alertbox);
      })

      exchangeInstance.etherDeposit({},{fromBlock:0, toBlock:'latest'}).watch(function(error, result) {
        if (error != null) {
          alert("There was an error obtaining events");
          return;
        }
        var alertbox = document.createElement("div");
        alertbox.setAttribute("class", "alert alert-info alert-dismissible");
        var closeBtn = document.createElement("button");
        closeBtn.setAttribute("type", "button");
        closeBtn.setAttribute("class", "close");
        closeBtn.setAttribute("data-dismiss", "alert");
        closeBtn.innerHTML = "<span>&times;</span>";
        alertbox.appendChild(closeBtn);

        var eventTitle = document.createElement("div");
        eventTitle.innerHTML = '<strong>New Event: ' + result.event + '</strong>';
        alertbox.appendChild(eventTitle);

        var argsBox = document.createElement('textarea');
        argsBox.setAttribute("class", "form-control");
        argsBox.innerText = JSON.stringify(result.args);
        alertbox.appendChild(argsBox);
        document.getElementById("depositEvents").appendChild(alertbox);
      })

    })
  },

  watchWithdrawEvents: function() {
    var exchangeInstance;
    ExchangeContract.deployed().then(function(instance) {
      exchangeInstance = instance;

      exchangeInstance.tokenWithdraw({},{fromBlock:0, toBlock:'latest'}).watch(function(error, result) {
        if (error != null) {
          alert("There was an error obtaining events");
          return;
        }
        var alertbox = document.createElement("div");
        alertbox.setAttribute("class", "alert alert-info alert-dismissible");
        var closeBtn = document.createElement("button");
        closeBtn.setAttribute("type", "button");
        closeBtn.setAttribute("class", "close");
        closeBtn.setAttribute("data-dismiss", "alert");
        closeBtn.innerHTML = "<span>&times;</span>";
        alertbox.appendChild(closeBtn);

        var eventTitle = document.createElement("div");
        eventTitle.innerHTML = '<strong>New Event: ' + result.event + '</strong>';
        alertbox.appendChild(eventTitle);

        var argsBox = document.createElement('textarea');
        argsBox.setAttribute("class", "form-control");
        argsBox.innerText = JSON.stringify(result.args);
        alertbox.appendChild(argsBox);
        document.getElementById("withdrawEvents").appendChild(alertbox);
      })

      exchangeInstance.etherWithraw({},{fromBlock:0, toBlock:'latest'}).watch(function(error, result) {
        if (error != null) {
          alert("There was an error obtaining events");
          return;
        }
        var alertbox = document.createElement("div");
        alertbox.setAttribute("class", "alert alert-info alert-dismissible");
        var closeBtn = document.createElement("button");
        closeBtn.setAttribute("type", "button");
        closeBtn.setAttribute("class", "close");
        closeBtn.setAttribute("data-dismiss", "alert");
        closeBtn.innerHTML = "<span>&times;</span>";
        alertbox.appendChild(closeBtn);

        var eventTitle = document.createElement("div");
        eventTitle.innerHTML = '<strong>New Event: ' + result.event + '</strong>';
        alertbox.appendChild(eventTitle);

        var argsBox = document.createElement('textarea');
        argsBox.setAttribute("class", "form-control");
        argsBox.innerText = JSON.stringify(result.args);
        alertbox.appendChild(argsBox);
        document.getElementById("withdrawEvents").appendChild(alertbox);
      })

    })
  },

  watchBuyToken: function() {
    var exchangeInstance;
    ExchangeContract.deployed().then(function(instance) {
      exchangeInstance = instance;

      exchangeInstance.buyOfferCreated({},{fromBlock:0, toBlock:'latest'}).watch(function(error, result) {
        if (error != null) {
          alert("There was an error obtaining events");
          return;
        }
        var alertbox = document.createElement("div");
        alertbox.setAttribute("class", "alert alert-info alert-dismissible");
        var closeBtn = document.createElement("button");
        closeBtn.setAttribute("type", "button");
        closeBtn.setAttribute("class", "close");
        closeBtn.setAttribute("data-dismiss", "alert");
        closeBtn.innerHTML = "<span>&times;</span>";
        alertbox.appendChild(closeBtn);

        var eventTitle = document.createElement("div");
        eventTitle.innerHTML = '<strong>New Event: ' + result.event + '</strong>';
        alertbox.appendChild(eventTitle);

        var argsBox = document.createElement('textarea');
        argsBox.setAttribute("class", "form-control");
        argsBox.innerText = JSON.stringify(result.args);
        alertbox.appendChild(argsBox);
        document.getElementById("buyEvents").appendChild(alertbox);
      })

      exchangeInstance.buyOrderFulfilled({},{fromBlock:0, toBlock:'latest'}).watch(function(error, result) {
        if (error != null) {
          alert("There was an error obtaining events");
          return;
        }
        var alertbox = document.createElement("div");
        alertbox.setAttribute("class", "alert alert-info alert-dismissible");
        var closeBtn = document.createElement("button");
        closeBtn.setAttribute("type", "button");
        closeBtn.setAttribute("class", "close");
        closeBtn.setAttribute("data-dismiss", "alert");
        closeBtn.innerHTML = "<span>&times;</span>";
        alertbox.appendChild(closeBtn);

        var eventTitle = document.createElement("div");
        eventTitle.innerHTML = '<strong>New Event: ' + result.event + '</strong>';
        alertbox.appendChild(eventTitle);

        var argsBox = document.createElement('textarea');
        argsBox.setAttribute("class", "form-control");
        argsBox.innerText = JSON.stringify(result.args);
        alertbox.appendChild(argsBox);
        document.getElementById("buyEvents").appendChild(alertbox);
      })
    })
  },

  watchSellToken: function() {
    var exchangeInstance;
    ExchangeContract.deployed().then(function(instance) {
      exchangeInstance = instance;

      exchangeInstance.sellOfferCreated({},{fromBlock:0, toBlock:'latest'}).watch(function(error, result) {
        if (error != null) {
          alert("There was an error obtaining events");
          return;
        }
        var alertbox = document.createElement("div");
        alertbox.setAttribute("class", "alert alert-info alert-dismissible");
        var closeBtn = document.createElement("button");
        closeBtn.setAttribute("type", "button");
        closeBtn.setAttribute("class", "close");
        closeBtn.setAttribute("data-dismiss", "alert");
        closeBtn.innerHTML = "<span>&times;</span>";
        alertbox.appendChild(closeBtn);

        var eventTitle = document.createElement("div");
        eventTitle.innerHTML = '<strong>New Event: ' + result.event + '</strong>';
        alertbox.appendChild(eventTitle);

        var argsBox = document.createElement('textarea');
        argsBox.setAttribute("class", "form-control");
        argsBox.innerText = JSON.stringify(result.args);
        alertbox.appendChild(argsBox);
        document.getElementById("sellEvents").appendChild(alertbox);
      })

      exchangeInstance.sellOrderFulfilled({},{fromBlock:0, toBlock:'latest'}).watch(function(error, result) {
        if (error != null) {
          alert("There was an error obtaining events");
          return;
        }
        var alertbox = document.createElement("div");
        alertbox.setAttribute("class", "alert alert-info alert-dismissible");
        var closeBtn = document.createElement("button");
        closeBtn.setAttribute("type", "button");
        closeBtn.setAttribute("class", "close");
        closeBtn.setAttribute("data-dismiss", "alert");
        closeBtn.innerHTML = "<span>&times;</span>";
        alertbox.appendChild(closeBtn);

        var eventTitle = document.createElement("div");
        eventTitle.innerHTML = '<strong>New Event: ' + result.event + '</strong>';
        alertbox.appendChild(eventTitle);

        var argsBox = document.createElement('textarea');
        argsBox.setAttribute("class", "form-control");
        argsBox.innerText = JSON.stringify(result.args);
        alertbox.appendChild(argsBox);
        document.getElementById("sellEvents").appendChild(alertbox);
      })
    })
  },

  printImportantInformation: function() {
    ExchangeContract.deployed().then(function(instance) {
      var divAddress = document.createElement("div");
      divAddress.appendChild(document.createTextNode("Address Exchange: " + instance.address));
      divAddress.setAttribute("class", "alert alert-info");
      document.getElementById("importantInformation").appendChild(divAddress);
    })
    TokenContract.deployed().then(function(instance) {
      var divAddress = document.createElement("div");
      divAddress.appendChild(document.createTextNode("Address Token: " + instance.address));
      divAddress.setAttribute("class", "alert alert-info");
      document.getElementById("importantInformation").appendChild(divAddress);
    })

    web3.eth.getAccounts(function(errAccounts, accs) {
      web3.eth.getBalance(accs[0], function(errBalance, balance) {
        var divAddress = document.createElement("div");
        var div = document.createElement("div");
        div.appendChild(document.createTextNode("Active Account: " + accs[0]));
        var div2 = document.createElement("div");
        div2.appendChild(document.createTextNode("Balance in ether: " + web3.fromWei(balance, "ether")));
        divAddress.appendChild(div);
        divAddress.appendChild(div2);
        divAddress.setAttribute("class", "alert alert-info");
        document.getElementById("importantInformation").appendChild(divAddress);
      })
    })


  },

  sendToken: function() {
    var amount = parseInt(document.getElementById("inputAmountSendToken").value);
    var receiver = document.getElementById("inputRecipientSendToken").value;

    App.setStatus("Initiating transaction...please wait");

    var tokenInstance;
    TokenContract.deployed().then(function(instance) {
      tokenInstance = instance;
      return tokenInstance.transfer(receiver, amount, {from: account});
    }).then(function(txResults) {
      App.setStatus("Transfer complete!");
      App.updateTokenBalance();
    }).catch(function(e) {
      console.log(e);
      App.setStatus("Error sending coin. See log.");
    })
  }, 

  allowanceToken: function() {
    var amount = parseInt(document.getElementById("inputAmountAllowToken").value);
    var receiver = document.getElementById("inputRecipientAllowToken").value;

    App.setStatus("Initiating allowance of token...please wait");

    var tokenInstance;
    TokenContract.deployed().then(function(instance) {
      tokenInstance = instance;
      tokenInstance.approve(receiver, amount, {from: account});      
    }).then(function(txResults) {
      App.setStatus("Token allowance accepted");
    }).catch(function(e) {
      console.log(e);
      App.setStatus("Token allowance rejected");
    })
  }, 

  addTokenToExchange: function() {
    var nameOfToken = document.getElementById("inputTokenAddExchange").value;
    var addressOfToken = document.getElementById("inputNameAddExchange").value;

    App.setStatus("Initiating addition of Token to Exchange...please wait");

    var exchangeInstance;
    ExchangeContract.deployed().then(function(instance) {
      exchangeInstance = instance;
      return exchangeInstance.addToken(nameOfToken, addressOfToken, {from: account});
    }).then(function(txResult) {
      console.log(txResult);
      App.setStatus("Token succesfully added to Exchange");
    }).catch(function(e) {
      console.log(e);
      App.setStatus("There was an error adding Token to the Exchange. See logs");
    })
  },

  depositTokenIntoExchange: function() {
    var self = this;

    var symbolName = document.getElementById("inputNameDepositToken").value;
    var amount = parseInt(document.getElementById("inputAmountDepositToken").value);

    self.setStatus("Initiating deposit of Token into your account on the Exchange....Please wait");

    var exchangeInstance;
    ExchangeContract.deployed().then(function(instance) {
      exchangeInstance = instance;
      return exchangeInstance.depositToken(symbolName, amount, {from: account});
    }).then(function(txResult) {
      console.log(txResult);
      App.updateBalanceExchange();
      self.setStatus("Token(s) successfully deposited into your account on the Exchange");
    }).catch(function(e) {
      console.log(e);
      self.setStatus("There was an error depositing Token into your account on the Exchange");
    })
  },

  depositEtherIntoExchange: function() {
    var self = this;

    var amount = parseInt(document.getElementById("inputAmountDepositEther").value);

    self.setStatus("Initiating deposit of Ether into your account on the Exchange...Please wait");

    var exchangeInstance;
    ExchangeContract.deployed().then(function(instance) {
      exchangeInstance = instance;
      return exchangeInstance.depositEther({from: account, to: exchangeInstance.address, value: web3.toWei(amount, "ether")});
    }).then(function(txResult) {
      console.log(txResult);
      App.updateBalanceExchange();
      self.setStatus("Ether successfully deposited into your account on the Exchange");
    }).catch(function(e) {
      console.log(e);
      self.setStatus("There was an error depositing Ether into your account on the Exchange");
    })
  }, 

  withdrawTokenFromExchange: function() {
    var self = this;

    var symbolName = document.getElementById("inputNameWithrawToken").value;
    var amount = parseInt(document.getElementById("inputAmountWithdrawToken").value);

    self.setStatus("Initiating withdrawal of Token from your account on the Exchange...Please wait");

    var exchangeInstance;
    ExchangeContract.deployed().then(function(instance) {
      exchangeInstance = instance;
      return exchangeInstance.withdrawToken(symbolName, amount, {from: account});
    }).then(function(txResult) {
      console.log(txResult);
      App.updateBalanceExchange();
      self.setStatus("Token(s) successfully withdrawn from your account on the Exchange");
    }).catch(function(e) {
      console.log(e);
      self.setStatus("There was an error withdrawing Token(s) from your account on the Exchange");
    })
  },

  withdrawEthFromExchange: function() {
    var self = this;

    var amount = parseInt(document.getElementById("inputAmountWithdrawEther").value);

    self.setStatus("Initiating withdraw of Ether from your account on the Exchange...Please wait");

    var exchangeInstance;
    ExchangeContract.deployed().then(function(instance) {
      exchangeInstance = instance;
      return exchangeInstance.withdrawEther(web3.toWei(amount,"ether"), {from: account});
    }).then(function(txResult) {
      console.log(txResult);
      App.updateBalanceExchange();
      self.setStatus("Ether successfully withdrawn from your account on the Exchange");
    }).catch(function(e) {
      console.log(e);
      self.setStatus("There was an error withdrawing Ether from your account on the Exchange");
    })
  }, 

  buyToken: function() {
    var self = this;

    var symbolName = document.getElementById("inputNameBuyToken").value;
    var priceInWei = parseInt(document.getElementById("inputPriceBuyToken").value);
    var amount = parseInt(document.getElementById("inputAmountBuyToken").value);

    self.setStatus("Attempting to buy token on Exchange");

    var exchangeInstance;
    ExchangeContract.deployed().then(function(instance) {
      exchangeInstance = instance;
      return exchangeInstance.buyToken(symbolName, priceInWei, amount, {from: account});
    }).then(function(txResult) {
      console.log(txResult);
      if(txResult.logs[0].event == "buyOfferCreated") {
        self.setStatus("Buy order succesfully created");
      }
      if(txResult.logs[0].event == "buyOrderFulfilled") {
        self.setStatus("Token(s) successfully purchased");
      }
      App.updateBalanceExchange();
    }).catch(function(e) {
      console.log(e);
      self.setStatus("There was an error attempting to create a buy order");
    })
  },

  sellToken: function() {
    var self = this;

    var symbolName = document.getElementById("inputNameSellToken").value;
    var priceInWei = parseInt(document.getElementById("inputPriceSellToken").value);
    var amount = parseInt(document.getElementById("inputAmountSellToken").value);

    self.setStatus("Attempting to sell token on Exchange");

    var exchangeInstance;
    ExchangeContract.deployed().then(function(instance) {
      exchangeInstance = instance;
      return exchangeInstance.sellToken(symbolName, priceInWei, amount, {from: account});
    }).then(function(txResult) {
      console.log(txResult);
      if(txResult.logs[0].event == "sellOfferCreated") {
        self.setStatus("Buy order succesfully created");
      }
      if(txResult.logs[0].event == "sellOrderFulfilled") {
        self.setStatus("Token(s) successfully purchased");
      }
      App.updateBalanceExchange();
    }).catch(function(e) {
      console.log(e);
      self.setStatus("There was an error attempting to create a sell order");
    })
  },

  updateOrderBook: function() {
    var exchangeInstance;

    document.getElementById("buyOrderBook").innerHTML = null;
    document.getElementById("sellOrderBook").innerHTML = null;

    ExchangeContract.deployed().then(function(instance) {
      exchangeInstance = instance;
      return exchangeInstance.getBuyOrderBook(tokenName, {from: account});
    }).then(function(orderbook) {
      if (orderbook[0].length == 0) {
        document.getElementById("buyOrderBook").innerHTML = '<span>No buy orders</span>';
      }
      for (var i=0; i < orderbook[0].length; i++) {
        document.getElementById("buyOrderBook").innerHTML += '<div>buy ' + orderbook[1][i] + '@' + orderbook[0][i] + '</div';
      }
      return exchangeInstance.getSellOrderBook(tokenName, {from: account});
    }).then(function(orderbook) {
      if (orderbook[0].length == 0) {
        document.getElementById("sellOrderBook").innerHTML = '<span>No sell orders</span>';
      }
      for (var i=0; i < orderbook[0].length; i++) {
        document.getElementById("sellOrderBook").innerHTML += '<div>sell ' + orderbook[1][i] + '@' + orderbook[0][i] + '</div';
      }
    })
  }

};

window.addEventListener('load', function() {
  // Checking if Web3 has been injected by the browser (Mist/MetaMask)
  if (typeof web3 !== 'undefined') {
    console.warn("Using web3 detected from external source. http://truffleframework.com/tutorials/truffle-and-metamask")
    // Use Mist/MetaMask's provider
    window.web3 = new Web3(web3.currentProvider);
  } else {
    console.warn("No web3 detected. Falling back to http://localhost:8545. You should remove this fallback when you deploy live, as it's inherently insecure. Consider switching to Metamask for development. More info here: http://truffleframework.com/tutorials/truffle-and-metamask");
    // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
    window.web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
  }

  App.start();
});
