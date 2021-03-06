const stripeCache = require('../../../../stripe-cache.js')
const connect = require('../../../../../index.js')
const dashboard = require('@layeredapps/dashboard')

module.exports = {
  patch: async (req) => {
    if (!req.query || !req.query.stripeid) {
      throw new Error('invalid-stripeid')
    }
    const stripeAccount = await global.api.user.connect.StripeAccount.get(req)
    if (stripeAccount.submittedAt ||
      stripeAccount.stripeObject.business_type !== 'company' ||
      stripeAccount.accountid !== req.account.accountid ||
      (stripeAccount.stripeObject.company && stripeAccount.stripeObject.company.executives_provided)) {
      throw new Error('invalid-stripe-account')
    }
    if (!stripeAccount.requiresExecutives) {
      throw new Error('invalid-stripe-account')
    }
    const accountInfo = {
      company: {
        executives_provided: true
      }
    }
    const stripeAccountNow = await stripeCache.execute('accounts', 'update', req.query.stripeid, accountInfo, req.stripeKey)
    await connect.Storage.StripeAccount.update({
      stripeObject: stripeAccountNow
    }, {
      where: {
        stripeid: req.query.stripeid,
        appid: req.appid || global.appid
      }
    })
    await dashboard.StorageCache.remove(req.query.stripeid)
    return global.api.user.connect.StripeAccount.get(req)
  }
}
