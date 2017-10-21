pragma solidity ^0.4.8;

import "./owned.sol";
import "./FixedSupplyToken.sol";

contract Exchange is owned {

	// General structure
	struct Offer {
		uint amount;
		address who;
	}

	struct OrderBook {
		uint higherPrice;
		uint lowerPrice;

		mapping(uint => Offer) offers;

		uint offers_key;
		uint offers_length;
	}

	struct Token {
		address tokenContract;
		string symbolName;

		mapping (uint => OrderBook) buyBook;

		uint curBuyPrice;
		uint lowestBuyPrice;
		uint amountBuyPrices;

		mapping (uint => OrderBook) sellBook;
		
		uint curSellPrice;
		uint highestSellPrice;
		uint amountSellPrices;
	}

	// support of a maximum of 255 tokens...
	mapping (uint8 => Token) tokens;
	uint8 symbolNameIndex;

	// ethere and token balance
	mapping (address => mapping (uint8 => uint)) tokenBalanceForAddress;
	mapping (address => uint) balanceEthForAddress;


	// events
	event etherDeposit(address sender, uint value);
	event etherWithraw(address sender, uint value);

	event tokenCreated(string symbolName, address erc20TokenAddress);
	event tokenDeposited(address sender, string symbolName, uint amount);
	event tokenWithdraw(address sender, string symbolName, uint amount);

	event buyOfferCreated(uint8 symbolIndex, uint priceInWei, uint amount, address who);
	event buyOrderCancelled(uint symbolIndex, uint priceInWei, uint offerKey);
	event buyOrderFulfilled(uint8 symbolIndex, uint volumeAtPriceFromAddress, uint whilePrice, uint offers_key);

	event sellOfferCreated(uint8 symbolIndex, uint priceInWei, uint amount, address who);
	event sellOrderCancelled(uint8 symbolIndex, uint priceInWei, uint offerKey);
	event sellOrderFulfilled(uint8 symbolIndex, uint volumeAtPriceFromAddress, uint whilePrice, uint offers_key);

	event test(uint test);
	

	// desposit ether into exchange
	function depositEther() payable {
		require(balanceEthForAddress[msg.sender] + msg.value >= balanceEthForAddress[msg.sender]);
		balanceEthForAddress[msg.sender] += msg.value;
		etherDeposit(msg.sender, msg.value);
	}

	// withdraw ether from exchange
	function withdrawEther(uint amountInWei) {
		require(balanceEthForAddress[msg.sender] - amountInWei >= 0);
		require(balanceEthForAddress[msg.sender] - amountInWei <= balanceEthForAddress[msg.sender]);
		balanceEthForAddress[msg.sender] -= amountInWei;
		msg.sender.transfer(amountInWei);
		etherWithraw(msg.sender, amountInWei);
	}

	// get account ether balance in exchange
	function getEthBalanceInWei() constant returns (uint) {
		return balanceEthForAddress[msg.sender];
	}

	// token management
	function addToken(string symbolName, address erc20TokenAddress) onlyowner {
		require(!hasToken(symbolName));
		symbolNameIndex++;
		tokens[symbolNameIndex].tokenContract = erc20TokenAddress;
		tokens[symbolNameIndex].symbolName = symbolName;
		tokenCreated(symbolName, erc20TokenAddress);
	}

	// check if token exists on exchange
	function hasToken(string symbolName) constant returns (bool) {
		uint index = getSymbolIndex(symbolName);
		if (index == 0) {
			return false;
		}
		return true;
	}

	// returns 0 if token symbol is not found on exchange
	function getSymbolIndex(string symbolName) internal returns (uint8) {
		for (uint8 i = 1; i <= symbolNameIndex; i++) {
			if (stringsEqual(tokens[i].symbolName,symbolName)) {
				return i;
			}
		}
		return 0;
	}

	// ** Standard string comparison function **
	function stringsEqual(string storage _a, string memory _b) internal returns (bool) {
		bytes storage a = bytes(_a);
		bytes memory b = bytes(_b);
		if (a.length != b.length) {
			return false;
		}
		for (uint i = 0; i < a.length; i++) {
			if (a[i] != b[i]) {
				return false;
			}
		return true;
		}
	}


	// desposit token in exchange
	function depositToken(string symbolName, uint amount) {
		uint8 symbolIndex = getSymbolIndex(symbolName);
		require(symbolIndex > 0);

		ERC20Interface token = ERC20Interface(tokens[symbolIndex].tokenContract);

		require(token.transferFrom(msg.sender, address(this), amount) == true);
		require(tokenBalanceForAddress[msg.sender][symbolIndex] + amount >= tokenBalanceForAddress[msg.sender][symbolIndex]);
		tokenBalanceForAddress[msg.sender][symbolIndex] += amount;
		tokenDeposited(msg.sender, symbolName, amount);
	}

	// withdraw token from exchange
	function withdrawToken(string symbolName, uint amount) {
		uint8 symbolIndex = getSymbolIndex(symbolName);
		require(symbolIndex > 0);

		ERC20Interface token = ERC20Interface(tokens[symbolIndex].tokenContract);

		require(tokenBalanceForAddress[msg.sender][symbolIndex] - amount >= 0);
		require(tokenBalanceForAddress[msg.sender][symbolIndex] - amount <= tokenBalanceForAddress[msg.sender][symbolIndex]);
		tokenBalanceForAddress[msg.sender][symbolIndex] -= amount;
		require(token.transfer(msg.sender, amount) == true);
		tokenWithdraw(msg.sender, symbolName, amount);
	}

	// get account token balance on exchange
	function getTokenBalance(string symbolName) constant returns (uint) {
		uint8 symbolIndex = getSymbolIndex(symbolName);
		require(symbolIndex > 0);

		return tokenBalanceForAddress[msg.sender][symbolIndex];
	}

	// order book - bid orders
	function getBuyOrderBook(string symbolName) constant returns (uint[], uint[]) {
		uint8 symbolIndex = getSymbolIndex(symbolName);
		require(symbolIndex > 0);
		uint[] memory arrPricesBuy = new uint[] (tokens[symbolIndex].amountBuyPrices);
		uint[] memory arrVolumesBuy = new uint[] (tokens[symbolIndex].amountBuyPrices);

		uint whilePrice = tokens[symbolIndex].lowestBuyPrice;
		uint counter = 0;
		if (tokens[symbolIndex].curBuyPrice > 0) {
			while (whilePrice <= tokens[symbolIndex].curBuyPrice) {
				arrPricesBuy[counter] = whilePrice;
				uint volumeAtPrice = 0;
				uint offers_key = 0;

				offers_key = tokens[symbolIndex].buyBook[whilePrice].offers_key;
				while (offers_key <= tokens[symbolIndex].buyBook[whilePrice].offers_length) {
					volumeAtPrice += tokens[symbolIndex].buyBook[whilePrice].offers[offers_key].amount;
					offers_key++;
				}

				arrVolumesBuy[counter] = volumeAtPrice;

				if (whilePrice == tokens[symbolIndex].buyBook[whilePrice].higherPrice) {
					break;
				} else {
					whilePrice = tokens[symbolIndex].buyBook[whilePrice].higherPrice;
				}
				counter++;
			}
		}
		return (arrPricesBuy, arrVolumesBuy);
	}

	// order book - ask orders
	function getSellOrderBook(string symbolName) constant returns (uint[], uint[]) {
		uint8 symbolIndex = getSymbolIndex(symbolName);
		require(symbolIndex > 0);
		uint[] memory arrPricesSell = new uint[] (tokens[symbolIndex].amountSellPrices);
		uint[] memory arrVolumesSell = new uint[] (tokens[symbolIndex].amountSellPrices);

		uint whilePrice = tokens[symbolIndex].curSellPrice;
		uint counter = 0;

		if (tokens[symbolIndex].curSellPrice > 0) {
			while (whilePrice <= tokens[symbolIndex].highestSellPrice) {
				arrPricesSell[counter] = whilePrice;
				uint volumeAtPrice = 0;
				uint offers_key = 0;

				offers_key = tokens[symbolIndex].sellBook[whilePrice].offers_key;
				while (offers_key <= tokens[symbolIndex].sellBook[whilePrice].offers_length) {
					volumeAtPrice += tokens[symbolIndex].sellBook[whilePrice].offers[offers_key].amount;
					offers_key++;
				}

				arrVolumesSell[counter] = volumeAtPrice;

				if (tokens[symbolIndex].sellBook[whilePrice].higherPrice == 0) {
					break;
				} else {
					whilePrice = tokens[symbolIndex].sellBook[whilePrice].higherPrice;
				}
				counter++;
			}
		}
		return (arrPricesSell, arrVolumesSell);
	}

	// new order - bid order
	function buyToken(string symbolName, uint priceInWei, uint amount) {
		uint8 symbolIndex = getSymbolIndex(symbolName);
		require(symbolIndex > 0);

		var totalPrice = priceInWei * amount;

		if (tokens[symbolIndex].amountSellPrices == 0 || tokens[symbolIndex].curSellPrice > priceInWei) {
			// overflow checks
			require(totalPrice >= amount);
			require(totalPrice >= priceInWei);
			require(balanceEthForAddress[msg.sender] >= totalPrice);
			require(balanceEthForAddress[msg.sender] - totalPrice >= 0);

			balanceEthForAddress[msg.sender] -= totalPrice;

			addBuyOffer(symbolIndex, priceInWei, amount, msg.sender);
			buyOfferCreated(symbolIndex, priceInWei, amount, msg.sender);
		} else {
			uint whilePrice = tokens[symbolIndex].curSellPrice;
			uint amountNecessary = amount;
			uint offers_key;
			while(whilePrice <= priceInWei && amountNecessary > 0) {
				offers_key = tokens[symbolIndex].sellBook[whilePrice].offers_key;
				while(offers_key <= tokens[symbolIndex].sellBook[whilePrice].offers_length && amountNecessary > 0) {
					uint volumeAtPriceFromAddress = tokens[symbolIndex].sellBook[whilePrice].offers[offers_key].amount;

					if (volumeAtPriceFromAddress <= amountNecessary) {
						totalPrice = volumeAtPriceFromAddress * whilePrice;

						require(balanceEthForAddress[msg.sender] >= totalPrice);
						require(balanceEthForAddress[msg.sender] + totalPrice >= balanceEthForAddress[msg.sender]);

						balanceEthForAddress[msg.sender] -= totalPrice;

						tokenBalanceForAddress[msg.sender][symbolIndex] += volumeAtPriceFromAddress;
						tokens[symbolIndex].sellBook[whilePrice].offers[offers_key].amount = 0;
						balanceEthForAddress[tokens[symbolIndex].sellBook[whilePrice].offers[offers_key].who] += totalPrice;
						tokens[symbolIndex].sellBook[whilePrice].offers_key++;

						buyOrderFulfilled(symbolIndex, volumeAtPriceFromAddress, whilePrice, offers_key);

						amountNecessary -= volumeAtPriceFromAddress;
					} else {
						require(volumeAtPriceFromAddress - amountNecessary > 0);
						
						totalPrice = volumeAtPriceFromAddress * whilePrice;

						balanceEthForAddress[msg.sender] -= totalPrice;

						tokens[symbolIndex].sellBook[whilePrice].offers[offers_key].amount -= amountNecessary;
						balanceEthForAddress[tokens[symbolIndex].sellBook[whilePrice].offers[offers_key].who] += totalPrice;
						tokenBalanceForAddress[msg.sender][symbolIndex] += amountNecessary;

						buyOrderFulfilled(symbolIndex, volumeAtPriceFromAddress, whilePrice, offers_key);

						amountNecessary = 0;
					}
					if (offers_key == tokens[symbolIndex].sellBook[whilePrice].offers_length && tokens[symbolIndex].sellBook[whilePrice].offers[offers_key].amount == 0) {
						tokens[symbolIndex].amountSellPrices--;

						if (whilePrice == tokens[symbolIndex].sellBook[whilePrice].higherPrice || tokens[symbolIndex].sellBook[whilePrice].higherPrice == 0) {
							tokens[symbolIndex].curSellPrice = 0;
						} else {
							tokens[symbolIndex].curSellPrice = tokens[symbolIndex].sellBook[whilePrice].higherPrice;
							tokens[symbolIndex].sellBook[tokens[symbolIndex].sellBook[whilePrice].higherPrice].lowerPrice = 0;
						}
					}
					offers_key++;
				}
				whilePrice = tokens[symbolIndex].curSellPrice;
			}
			if (amountNecessary > 0) {
				buyToken(symbolName, priceInWei, amountNecessary);
			}
		}
	}

	function addBuyOffer(uint8 symbolIndex, uint priceInWei, uint amount, address who)  internal {
		tokens[symbolIndex].buyBook[priceInWei].offers_length++;	
		tokens[symbolIndex].buyBook[priceInWei].offers[tokens[symbolIndex].buyBook[priceInWei].offers_length] = Offer(amount, who);

		if (tokens[symbolIndex].buyBook[priceInWei].offers_length == 1) {
			tokens[symbolIndex].buyBook[priceInWei].offers_key = 1;

			// new buy order
			tokens[symbolIndex].amountBuyPrices++;

			uint curBuyPrice = tokens[symbolIndex].curBuyPrice;

			uint lowestBuyPrice = tokens[symbolIndex].lowestBuyPrice;

			if(lowestBuyPrice == 0 || lowestBuyPrice > priceInWei) {
				if (curBuyPrice == 0) {
					// no buy orders
					tokens[symbolIndex].curBuyPrice = priceInWei;
					tokens[symbolIndex].buyBook[priceInWei].higherPrice = priceInWei;
					tokens[symbolIndex].buyBook[priceInWei].lowerPrice = 0;
				} else {
					// lowest buy order
					tokens[symbolIndex].buyBook[lowestBuyPrice].lowerPrice = priceInWei;
					tokens[symbolIndex].buyBook[priceInWei].higherPrice = lowestBuyPrice;
					tokens[symbolIndex].buyBook[priceInWei].lowerPrice = 0;
				}
				tokens[symbolIndex].lowestBuyPrice = priceInWei;
			}
			else if (curBuyPrice < priceInWei) {
				// highest buy order
				tokens[symbolIndex].buyBook[curBuyPrice].higherPrice = priceInWei;
				tokens[symbolIndex].buyBook[priceInWei].higherPrice = priceInWei;
				tokens[symbolIndex].buyBook[priceInWei].lowerPrice = curBuyPrice;
				tokens[symbolIndex].curBuyPrice = priceInWei;
			}
			else {
				uint buyPrice = tokens[symbolIndex].curBuyPrice;
				bool weFoundIt = false;
				while (buyPrice > 0 && !weFoundIt) {
					if ( buyPrice < priceInWei && tokens[symbolIndex].buyBook[buyPrice].higherPrice > priceInWei) {
						tokens[symbolIndex].buyBook[priceInWei].lowerPrice = buyPrice;
						tokens[symbolIndex].buyBook[priceInWei].higherPrice = tokens[symbolIndex].buyBook[buyPrice].higherPrice;

						tokens[symbolIndex].buyBook[tokens[symbolIndex].buyBook[buyPrice].higherPrice].lowerPrice = priceInWei;
						tokens[symbolIndex].buyBook[buyPrice].higherPrice = priceInWei;

						weFoundIt = true;

					}
					buyPrice = tokens[symbolIndex].buyBook[buyPrice].lowerPrice;
				}
			}
		}

	}

	// new order - ask order
	function sellToken(string symbolName, uint priceInWei, uint amount) {
		uint8 symbolIndex = getSymbolIndex(symbolName);
		require(symbolIndex > 0);

		// overflow checks
		require(amount >= 0);
		require(priceInWei >= 0);
		require(tokenBalanceForAddress[msg.sender][symbolIndex] >= amount);
		require(tokenBalanceForAddress[msg.sender][symbolIndex] - amount >= 0);

		tokenBalanceForAddress[msg.sender][symbolIndex]  -= amount;

		if (tokens[symbolIndex].amountBuyPrices == 0 || tokens[symbolIndex].curBuyPrice < priceInWei) {
			addSellOffer(symbolIndex, priceInWei, amount, msg.sender);
			sellOfferCreated(symbolIndex, priceInWei, amount, msg.sender);
		} else {
			uint whilePrice = tokens[symbolIndex].curBuyPrice;
			uint amountNecessary = amount;
			uint offers_key;
			uint totalPrice;
			while (whilePrice >= priceInWei && amountNecessary > 0) {
				offers_key = tokens[symbolIndex].buyBook[whilePrice].offers_key;
				while (offers_key <= tokens[symbolIndex].buyBook[whilePrice].offers_length && amountNecessary > 0) {
					uint volumeAtPriceFromAddress = tokens[symbolIndex].buyBook[whilePrice].offers[offers_key].amount;
					// completely use up buy order (sell order amount >= buy order amount)
					if (volumeAtPriceFromAddress <= amountNecessary) {
						totalPrice = volumeAtPriceFromAddress * whilePrice;
						//overflow check
						require(tokenBalanceForAddress[msg.sender][symbolIndex] - volumeAtPriceFromAddress >= 0);
						require(tokenBalanceForAddress[tokens[symbolIndex].buyBook[whilePrice].offers[offers_key].who][symbolIndex] + volumeAtPriceFromAddress >= tokenBalanceForAddress[tokens[symbolIndex].buyBook[symbolIndex].offers[offers_key].who][symbolIndex]);
						require(balanceEthForAddress[msg.sender] + totalPrice >= balanceEthForAddress[msg.sender]);

						tokenBalanceForAddress[tokens[symbolIndex].buyBook[whilePrice].offers[offers_key].who][symbolIndex] += volumeAtPriceFromAddress;
						tokens[symbolIndex].buyBook[whilePrice].offers[offers_key].amount = 0;
						balanceEthForAddress[msg.sender] += totalPrice;
						tokens[symbolIndex].buyBook[whilePrice].offers_key++;

						sellOrderFulfilled(symbolIndex, volumeAtPriceFromAddress, whilePrice, offers_key);

						amountNecessary -= volumeAtPriceFromAddress;
					// only use a portion of buy order (sell order amount < buy order amount)
					} else {
						require(volumeAtPriceFromAddress - amountNecessary > 0);
						totalPrice = amountNecessary * whilePrice;

						// overflow check
						require(tokenBalanceForAddress[msg.sender][symbolIndex] >= amountNecessary);
						require(balanceEthForAddress[msg.sender] + totalPrice >= balanceEthForAddress[msg.sender]);
						require(tokenBalanceForAddress[tokens[symbolIndex].buyBook[whilePrice].offers[offers_key].who][symbolIndex] + amountNecessary >= tokenBalanceForAddress[tokens[symbolIndex].buyBook[whilePrice].offers[offers_key].who][symbolIndex]);

						tokens[symbolIndex].buyBook[whilePrice].offers[offers_key].amount -= amountNecessary;
						balanceEthForAddress[msg.sender] += totalPrice;
						tokenBalanceForAddress[tokens[symbolIndex].buyBook[whilePrice].offers[offers_key].who][symbolIndex] += amountNecessary;

						sellOrderFulfilled(symbolIndex, volumeAtPriceFromAddress, whilePrice, offers_key);

						amountNecessary = 0;
					}
					if (offers_key == tokens[symbolIndex].buyBook[whilePrice].offers_length && tokens[symbolIndex].buyBook[whilePrice].offers[offers_key].amount == 0) {
						tokens[symbolIndex].amountBuyPrices--;

						if (whilePrice == tokens[symbolIndex].buyBook[whilePrice].lowerPrice || tokens[symbolIndex].buyBook[whilePrice].lowerPrice == 0) {
							tokens[symbolIndex].curBuyPrice = 0;
						} else {
							tokens[symbolIndex].curBuyPrice = tokens[symbolIndex].buyBook[whilePrice].lowerPrice;
							tokens[symbolIndex].buyBook[tokens[symbolIndex].buyBook[whilePrice].lowerPrice].higherPrice = tokens[symbolIndex].curBuyPrice;
						}
					}
					offers_key++;
				}
				whilePrice = tokens[symbolIndex].curBuyPrice;
			}
			if (amountNecessary > 0) {
				sellToken(symbolName, priceInWei, amountNecessary);
			}
		}
	}

	function addSellOffer(uint8 symbolIndex, uint priceInWei, uint amount, address who) internal {
		tokens[symbolIndex].sellBook[priceInWei].offers_length++;
		tokens[symbolIndex].sellBook[priceInWei].offers[tokens[symbolIndex].sellBook[priceInWei].offers_length] = Offer(amount, who);

		if (tokens[symbolIndex].sellBook[priceInWei].offers_length == 1) {
			tokens[symbolIndex].sellBook[priceInWei].offers_key = 1;

			tokens[symbolIndex].amountSellPrices++;

			uint curSellPrice = tokens[symbolIndex].curSellPrice;

			uint highestSellPrice = tokens[symbolIndex].highestSellPrice;

			if(highestSellPrice == 0 || highestSellPrice < priceInWei) {
				if (curSellPrice == 0) {
					// no sell orders
					tokens[symbolIndex].curSellPrice = priceInWei;
					tokens[symbolIndex].sellBook[priceInWei].higherPrice = 0;
					tokens[symbolIndex].sellBook[priceInWei].lowerPrice = 0;
				}
				else {
					// highest sell order
					tokens[symbolIndex].sellBook[priceInWei].higherPrice = 0;
					tokens[symbolIndex].sellBook[priceInWei].lowerPrice = highestSellPrice;
					tokens[symbolIndex].sellBook[highestSellPrice].higherPrice = priceInWei;
				}
				tokens[symbolIndex].highestSellPrice = priceInWei;
			}
			else if (curSellPrice > priceInWei) {
				// lowest sell order
				tokens[symbolIndex].sellBook[priceInWei].higherPrice = curSellPrice;
				tokens[symbolIndex].sellBook[priceInWei].lowerPrice = 0;
				tokens[symbolIndex].sellBook[curSellPrice].lowerPrice = priceInWei;
				tokens[symbolIndex].curSellPrice = priceInWei;
			}
			else {
				uint sellPrice = tokens[symbolIndex].curSellPrice;
				bool weFoundIt = false;
				while (sellPrice > 0 && !weFoundIt) {
					if (sellPrice < priceInWei && tokens[symbolIndex].sellBook[sellPrice].higherPrice > priceInWei) {
						tokens[symbolIndex].sellBook[priceInWei].lowerPrice = sellPrice;
						tokens[symbolIndex].sellBook[priceInWei].higherPrice = tokens[symbolIndex].sellBook[sellPrice].higherPrice;

						tokens[symbolIndex].sellBook[tokens[symbolIndex].sellBook[sellPrice].higherPrice].lowerPrice = priceInWei;
						tokens[symbolIndex].sellBook[sellPrice].higherPrice = priceInWei;

						weFoundIt = true;
					}
					sellPrice = tokens[symbolIndex].sellBook[sellPrice].higherPrice;
				}
			}
		}
	}

	function cancelOrder(string symbolName, bool isSellOrder, uint priceInWei, uint offerKey) {
		uint8 symbolIndex = getSymbolIndex(symbolName);
		require(symbolIndex > 0);

		if (isSellOrder) {
			require(tokens[symbolIndex].sellBook[priceInWei].offers[offerKey].who == msg.sender);

			uint tokenAmount = tokens[symbolIndex].sellBook[priceInWei].offers[offerKey].amount;
			require(tokenBalanceForAddress[msg.sender][symbolIndex] + tokenAmount >= tokenBalanceForAddress[msg.sender][symbolIndex]);

			tokenBalanceForAddress[msg.sender][symbolIndex] += tokenAmount;
			tokens[symbolIndex].sellBook[priceInWei].offers[offerKey].amount = 0;
			sellOrderCancelled(symbolIndex, priceInWei, offerKey);
		} else {
			require(tokens[symbolIndex].buyBook[priceInWei].offers[offerKey].who == msg.sender);

			uint etherAmount = tokens[symbolIndex].buyBook[priceInWei].offers[offerKey].amount * priceInWei;
			require(balanceEthForAddress[msg.sender] + etherAmount >= balanceEthForAddress[msg.sender]);

			balanceEthForAddress[msg.sender] += etherAmount;
			tokens[symbolIndex].buyBook[priceInWei].offers[offerKey].amount = 0;
			buyOrderCancelled(symbolIndex, priceInWei, offerKey);
		}
	}

}