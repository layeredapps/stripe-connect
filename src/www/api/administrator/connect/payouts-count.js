const connect = require('../../../../../index.js')

module.exports = {
  get: async (req) => {
    req.query = req.query || {}
    let where
    if (req.query.stripeid) {
      where = {
        where: {
          stripeid: req.query.stripeid,
          appid: req.appid || global.appid
        }
      }
    } else if (req.query.accountid) {
      where = {
        where: {
          accountid: req.query.accountid,
          appid: req.appid || global.appid
        }
      }
    }
    return connect.Storage.Payout.count(where)
  }
}
