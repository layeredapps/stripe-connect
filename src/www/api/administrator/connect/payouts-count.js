const connect = require('../../../../../index.js')

module.exports = {
  get: async (req) => {
    req.query = req.query || {}
    const where = {
      appid: req.appid || global.appid
    }
    if (req.query.stripeid) {
      where.stripeid = req.query.stripeid
    } else if (req.query.accountid) {
      where.accountid = req.query.accountid
    }
    return connect.Storage.Payout.count({
      where
    })
  }
}
