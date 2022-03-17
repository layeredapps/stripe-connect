const connect = require('../../../../../index.js')

module.exports = {
  get: async (req) => {
    return connect.Storage.CountrySpec.count()
  }
}
