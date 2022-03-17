const connect = require('../../../../../index.js')

module.exports = {
  get: async (req) => {
    let where
    if (req.query && req.query.accountid) {
      where = {
        where: {
          accountid: req.query.accountid
        }
      }
    }
    return connect.Storage.StripeAccount.count(where)
  }
}
