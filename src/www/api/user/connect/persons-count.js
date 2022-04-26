const connect = require('../../../../../index.js')

module.exports = {
  get: async (req) => {
    if (!req.query || !req.query.stripeid) {
      throw new Error('invalid-stripeid')
    }
    const stripeAccount = await global.api.user.connect.StripeAccount.get(req)
    if (!stripeAccount) {
      throw new Error('invalid-stripeid')
    }
    if (stripeAccount.stripeObject.business_type !== 'company') {
      throw new Error('invalid-stripe-account')
    }
    return connect.Storage.Person.count({
      where: {
        stripeid: req.query.stripeid,
        appid: req.appid || global.appid
      }
    })
  }
}
