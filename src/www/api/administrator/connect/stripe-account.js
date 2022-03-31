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
          stripeid: req.query.stripeid
        }
      })
      if (!stripeAccountInfo) {
        throw new Error('invalid-stripeid')
      }
      stripeAccount = {}
      for (const field of stripeAccountInfo._options.attributes) {
        stripeAccount[field] = stripeAccountInfo.get(field)
      }
      await dashboard.StorageCache.set(req.query.stripeid, stripeAccount)
    }
    return stripeAccount
  }
}
