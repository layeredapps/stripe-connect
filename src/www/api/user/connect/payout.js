const connect = require('../../../../../index.js')
const dashboard = require('@layeredapps/dashboard')

module.exports = {
  get: async (req) => {
    if (!req.query || !req.query.payoutid) {
      throw new Error('invalid-payoutid')
    }
    let payout = await dashboard.StorageCache.get(req.query.payoutid)
    if (!payout) {
      const payoutInfo = await connect.Storage.Payout.findOne({
        where: {
          payoutid: req.query.payoutid
        }
      })
      if (!payoutInfo) {
        throw new Error('invalid-payoutid')
      }
      if (payoutInfo.dataValues.accountid !== req.account.accountid) {
        throw new Error('invalid-account')
      }
      payout = {}
      for (const field of payoutInfo._options.attributes) {
        payout[field] = payoutInfo.get(field)
      }
      await dashboard.StorageCache.set(req.query.payoutid, payout)
    }
    if (payout.accountid !== req.account.accountid) {
      throw new Error('invalid-account')
    }
    return payout
  }
}
