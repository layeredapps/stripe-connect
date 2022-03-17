const connect = require('../../../../../index.js')

module.exports = {
  get: async (req) => {
    if (!req.query || !req.query.stripeid) {
      throw new Error('invalid-stripeid')
    }
    let where
    if (req.query && req.query.stripeid) {
      const stripeAccount = await global.api.administrator.connect.StripeAccount.get(req)
      if (!stripeAccount) {
        throw new Error('invalid-stripeid')
      }
      if (stripeAccount.stripeObject.business_type !== 'company') {
        throw new Error('invalid-stripe-account')
      }
      where = {
        where: {
          stripeid: req.query.stripeid
        }
      }
    }
    return connect.Storage.Person.count(where)
  }
}
