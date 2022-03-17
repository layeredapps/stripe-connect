const connect = require('../../../../../index.js')

module.exports = {
  get: async (req) => {
    if (!req.query || !req.query.stripeid) {
      throw new Error('invalid-stripeid')
    }
    const stripeAccountInfo = await connect.Storage.StripeAccount.findOne({
      where: {
        stripeid: req.query.stripeid
      }
    })
    if (!stripeAccountInfo) {
      throw new Error('invalid-stripeid')
    }
    if (stripeAccountInfo.dataValues.accountid !== req.account.accountid) {
      throw new Error('invalid-account')
    }
    const stripeAccount = {}
    for (const field of stripeAccountInfo._options.attributes) {
      stripeAccount[field] = stripeAccountInfo.get(field)
    }
    return stripeAccount
  }
}
