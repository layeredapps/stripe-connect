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
      stripeAccount.accountid !== req.account.accountid) {
      throw new Error('invalid-stripe-account')
    }
    if (!stripeAccount.stripeObject.external_accounts.data.length) {
      throw new Error('invalid-payment-details')
    }
    if (stripeAccount.stripeObject.business_type === 'company') {
      if (stripeAccount.requiresOwners && !stripeAccount.stripeObject.company.owners_provided) {
        throw new Error('invalid-company-owner')
      }
      if (stripeAccount.requiresDirectors && !stripeAccount.stripeObject.company.directors_provided) {
        throw new Error('invalid-company-director')
      }
      if (stripeAccount.requiresExecutives && !stripeAccount.stripeObject.company.executives_provided) {
        throw new Error('invalid-company-executive')
      }
      req.query.all = true
      const persons = await global.api.user.connect.Persons.get(req)
      if (persons && persons.length) {
        for (const person of persons) {
          if (person.stripeObject.requirements.currently_due.length) {
            throw new Error('invalid-person')
          }
        }
      }
    }
    if (stripeAccount.stripeObject.requirements.currently_due.length) {
      for (const field of stripeAccount.stripeObject.requirements.currently_due) {
        if (field !== 'tos_acceptance.date' &&
            field !== 'tos_acceptance.ip') {
          throw new Error('invalid-registration')
        }
      }
    }
    const accountInfo = {
      tos_acceptance: {
        ip: req.ip,
        user_agent: req.headers['user-agent'] || 'None',
        date: Math.floor(new Date().getTime() / 1000)
      }
    }
    const stripeAccountNow = await stripeCache.execute('accounts', 'update', req.query.stripeid, accountInfo, req.stripeKey)
    await connect.Storage.StripeAccount.update({
      stripeObject: stripeAccountNow,
      submittedAt: new Date()
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
