const connect = require('../../../../../index.js')
const dashboard = require('@layeredapps/dashboard')
const stripeCache = require('../../../../stripe-cache.js')

module.exports = {
  patch: async (req) => {
    if (!req.query || !req.query.stripeid) {
      throw new Error('invalid-stripeid')
    }
    const stripeAccount = await global.api.user.connect.StripeAccount.get(req)
    if (stripeAccount.accountid !== req.account.accountid) {
      throw new Error('invalid-stripe-account')
    }
    if (!req.body || !req.body.currency || !req.body.currency.length) {
      throw new Error('invalid-currency')
    }
    if (!req.body.country || !req.body.country.length) {
      throw new Error('invalid-country')
    }
    if (!connect.countrySpecIndex[req.body.country]) {
      throw new Error('invalid-country')
    }
    if (!req.body.account_holder_name || !req.body.account_holder_name.length) {
      throw new Error('invalid-account_holder_name')
    }
    if (!req.body.account_holder_type || !req.body.account_holder_type.length) {
      throw new Error('invalid-account_holder_type')
    }
    if (req.body.account_holder_type !== 'individual' &&
        req.body.account_holder_type !== 'company') {
      throw new Error('invalid-account_holder_type')
    }
    let requiredFields
    switch (req.body.country) {
      case 'AU':
        requiredFields = ['account_number', 'bsb_number']
        break
      case 'BR':
        requiredFields = ['account_number', 'routing_number', 'bank_code']
        break
      case 'GB':
        if (req.body.currency === 'gbp') {
          requiredFields = ['account_number', 'sort_code']
        } else {
          requiredFields = ['iban']
        }
        break
      case 'CA':
        requiredFields = ['account_number', 'institution_number', 'transit_number']
        break
      case 'MY':
      case 'US':
      case 'NZ':
        requiredFields = ['account_number', 'routing_number']
        break
      case 'HK':
        requiredFields = ['account_number', 'clearing_code', 'branch_code']
        break
      case 'JP':
      case 'SG':
        requiredFields = ['account_number', 'bank_code', 'branch_code']
        break
      default:
        requiredFields = ['iban']
        break
    }
    for (const field of requiredFields) {
      if (!req.body[field]) {
        throw new Error(`invalid-external_account.${field}`)
      }
      if (field === 'iban') {
        const countryPart = req.body[field].substring(0, 2).toUpperCase()
        if (!connect.countryCurrencyIndex[countryPart]) {
          throw new Error('invalid-external_account.iban')
        }
        const numericPart = req.body[field].substring(2)
        const integers = '0123456789'
        for (let i = 0, len = numericPart.length; i < len; i++) {
          if (integers.indexOf(numericPart.charAt(i)) === -1) {
            throw new Error('invalid-external_account.iban')
          }
        }
        continue
      }
      if (process.env.NODE_ENV === 'testing' && req.body[field] === 'TESTMYKL') {
        // do nothing
      } else {
        if (req.body[field].indexOf('-') === -1) {
          const int = parseInt(req.body[field], 10)
          if (!int && int !== 0) {
            throw new Error(`invalid-external_account.${field}`)
          }
          if (int.toString() !== req.body[field]) {
            if (req.body[field].startsWith('0')) {
              let zeroes = ''
              for (let i = 0, len = req.body[field].length; i < len; i++) {
                if (req.body[field].charAt(i) !== '0') {
                  break
                }
                zeroes += '0'
              }
              if (int > 0) {
                zeroes += int.toString()
              }
              if (zeroes !== req.body[field]) {
                throw new Error(`invalid-external_account.${field}`)
              }
            } else {
              throw new Error(`invalid-external_account.${field}`)
            }
          }
        }
      }
    }
    const currencies = connect.countryCurrencyIndex[stripeAccount.stripeObject.country]
    let foundCurrency = false
    for (const currency of currencies) {
      foundCurrency = currency.currency === req.body.currency
      if (foundCurrency) {
        break
      }
    }
    if (!foundCurrency) {
      throw new Error('invalid-currency')
    }
    const stripeData = {
      external_account: {
        object: 'bank_account',
        currency: req.body.currency,
        country: req.body.country,
        account_holder_name: req.body.account_holder_name,
        account_holder_type: req.body.account_holder_type
      }
    }
    for (const field of requiredFields) {
      if (field === 'iban') {
        stripeData.external_account.account_number = req.body[field]
        continue
      }
      if (req.body.country === 'AU' && field === 'bsb_number') {
        stripeData.external_account.routing_number = req.body[field]
        continue
      }
      if (req.body.country === 'CA' && (field === 'institution_number' || field === 'transit_number')) {
        stripeData.external_account.routing_number = `${req.body.transit_number}-${req.body.institution_number}`
        continue
      }
      if (req.body.country === 'HK' && (field === 'branch_code' || field === 'clearing_code')) {
        stripeData.external_account.routing_number = `${req.body.clearing_code}-${req.body.branch_code}`
        continue
      }
      if (req.body.country === 'JP' && (field === 'bank_code' || field === 'branch_code')) {
        stripeData.external_account.routing_number = `${req.body.branch_code}${req.body.bank_code}`
        continue
      }
      stripeData.external_account[field] = req.body[field]
    }
    try {
      const stripeAccountNow = await stripeCache.execute('accounts', 'update', req.query.stripeid, stripeData, req.stripeKey)
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
    } catch (error) {
      if (error.message && error.message.startsWith('invalid-external_account_')) {
        throw new Error(error.message.replace('external_account_', ''))
      }
      throw error
    }
  }
}
