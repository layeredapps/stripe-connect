const connect = require('../../../../../index.js')

module.exports = {
  get: async (req) => {
    const where = {
      appid: req.appid || global.appid
    }
    if (req.query && req.query.accountid) {
      where.accountid = req.query.accountid
    }
    return connect.Storage.StripeAccount.count({
      where
    })
  }
}
