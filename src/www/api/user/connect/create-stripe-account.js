const connect = require('../../../../../index.js')
const stripeCache = require('../../../../stripe-cache.js')

module.exports = {
  post: async (req) => {
    if (!req.query || !req.query.accountid) {
      throw new Error('invalid-accountid')
    }
    const account = await global.api.user.Account.get(req)
    if (!account) {
      throw new Error('invalid-account')
    }
    if (!req.body || (req.body.business_type !== 'individual' && req.body.business_type !== 'company')) {
      throw new Error('invalid-business_type')
    }
    if (!req.body.country || !connect.countrySpecIndex[req.body.country]) {
      throw new Error('invalid-country')
    }
    const accountInfo = {
      type: 'custom',
      business_type: req.body.business_type,
      country: req.body.country,
      requested_capabilities: ['card_payments', 'transfers']
    }
    try {
      const stripeAccount = await stripeCache.execute('accounts', 'create', accountInfo, req.stripeKey)
      const allRequirements = stripeAccount.requirements.currently_due.concat(stripeAccount.requirements.eventually_due)
      const requiresOwners = allRequirements.indexOf('owners.last_name') > -1
      const requiresDirectors = allRequirements.indexOf('directors.last_name') > -1
      const requiresExecutives = allRequirements.indexOf('executives.last_name') > -1
      await connect.Storage.StripeAccount.create({
        stripeid: stripeAccount.id,
        accountid: req.query.accountid,
        stripeObject: stripeAccount,
        requiresOwners,
        requiresDirectors,
        requiresExecutives
      })
      req.query.stripeid = stripeAccount.id
      return global.api.user.connect.StripeAccount.get(req)
    } catch (error) {
      if (error.message.startsWith('invalid-')) {
        throw new Error(error.message.split('.').join('_'))
      }
      throw error
    }
  }
}
