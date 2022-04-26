const connect = require('../../../../../index.js')
const dashboard = require('@layeredapps/dashboard')

module.exports = {
  get: async (req) => {
    if (!req.query || !req.query.stripeid) {
      throw new Error('invalid-stripeid')
    }
    let stripeAccount = await dashboard.StorageCache.get(req.query.stripeid)
    if (!stripeAccount) {
      const stripeAccountInfo = await connect.Storage.StripeAccount.findOne({
        where: {
          stripeid: req.query.stripeid,
          appid: req.appid || global.appid
        }
      })
      if (!stripeAccountInfo) {
        throw new Error('invalid-stripeid')
      }
      if (stripeAccountInfo.dataValues.accountid !== req.account.accountid) {
        throw new Error('invalid-account')
      }
      stripeAccount = {}
      for (const field of stripeAccountInfo._options.attributes) {
        stripeAccount[field] = stripeAccountInfo.get(field)
      }
      await dashboard.StorageCache.set(req.query.stripeid, stripeAccount)
    }
    if (stripeAccount.accountid !== req.account.accountid) {
      throw new Error('invalid-account')
    }
    return stripeAccount
  }
}
