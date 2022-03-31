const stripeCache = require('../../../../stripe-cache.js')
const connect = require('../../../../../index.js')
const dashboard = require('@layeredapps/dashboard')

module.exports = {
  patch: async (req) => {
    if (!req.query || !req.query.stripeid) {
      throw new Error('invalid-stripeid')
    }
    if (!req.body || !req.body.reason) {
      throw new Error('invalid-reason')
    }
    if (req.body.reason !== 'fraud' && req.body.reason !== 'other' && req.body.reason !== 'terms_of_service') {
      throw new Error('invalid-reason')
    }
    const stripeAccount = await global.api.administrator.connect.StripeAccount.get(req)
    if (!stripeAccount) {
      throw new Error('invalid-stripeid')
    }
    const updateInfo = {
      reason: req.body.reason
    }
    const stripeAccountNow = await stripeCache.execute('accounts', 'reject', req.query.stripeid, updateInfo, req.stripeKey)
    await connect.Storage.StripeAccount.update({
      stripeObject: stripeAccountNow
    }, {
      where: {
        stripeid: req.query.stripeid
      }
    })
    await dashboard.StorageCache.remove(req.query.stripeid)
    return global.api.administrator.connect.StripeAccount.get(req)
  }
}
