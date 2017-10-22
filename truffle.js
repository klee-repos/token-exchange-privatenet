// Allows us to use ES6 in our migrations and tests.
require('babel-register')

module.exports = {
  networks: {
    development: {
      host: 'localhost',
      port: 8545,
      network_id: '*' // Match any network id
    },
    rinkeby: {
      host: 'localhost',
      port: 8545,
      network_id: '4', // Rinkeby network id
      from: "0xbfe1600fc882366016691704879a00eb7284929d",
      gas: 4600000
    }
  }

}
