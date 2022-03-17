const stripeCache = require('../../../../stripe-cache.js')
const connect = require('../../../../../index.js')

module.exports = {
  delete: async (req) => {
    if (!req.query || !req.query.stripeid) {
      throw new Error('invalid-stripeid')
    }
    const stripeAccount = await global.api.user.connect.StripeAccount.get(req)
    if (stripeAccount.accountid !== req.account.accountid) {
      throw new Error('invalid-stripe-account')
    }
    await stripeCache.execute('accounts', 'del', req.query.stripeid, req.stripeKey)
    await connect.Storage.StripeAccount.destroy({
      where: {
        stripeid: req.query.stripeid
      }
    })
    return true
  }
}
