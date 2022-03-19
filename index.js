global.stripeAPIVersion = '2020-08-27'
global.stripeJS = process.env.STRIPE_JS === 'false' ? false : parseInt(process.env.STRIPE_JS, 10)
global.maximumStripeRetries = parseInt(process.env.MAXIMUM_STRIPE_RETRIES || '0', 10)
global.connectWebhookEndPointSecret = global.connectWebhookEndPointSecret || process.env.CONNECT_WEBHOOK_ENDPOINT_SECRET
if (!global.connectWebhookEndPointSecret) {
  throw new Error('invalid-connect-webhook-endpoint-secret')
}
global.stripePublishableKey = process.env.STRIPE_PUBLISHABLE_KEY
if (global.stripeJS > 0 && !global.stripePublishableKey) {
  throw new Error('invalid-stripe-publishable-key')
}
global.stripeKey = process.env.STRIPE_KEY
if (!global.stripeKey) {
  throw new Error('invalid-stripe-key')
}
const packageJSON = require('./package.json')
require('stripe')({
  apiVersion: global.stripeAPIVersion,
  telemetry: false,
  maxNetworkRetries: global.maximumStripeRetries || 0,
  appInfo: {
    version: packageJSON.version,
    name: '@layeredapps/stripe-connect',
    url: 'https://github.com/layeredapps/stripe-connect'
  }
})
const countryList = require('./countries.json')
const countryNameIndex = {}
for (const country of countryList) {
  countryNameIndex[country.code] = country.name
}
const countrySpecIndex = {}
const countryCurrencyIndex = {}
const countrySpecsRaw = require('./stripe-country-specs.json')
const countrySpecs = []
for (const countrySpec of countrySpecsRaw.data) {
  if (process.env.COUNTRY && process.env.COUNTRY !== countrySpec.id) {
    continue
  }
  countrySpec.name = countryNameIndex[countrySpec.id]
  countrySpecs.push(countrySpec)
  countrySpecIndex[countrySpec.id] = countrySpec
  countryCurrencyIndex[countrySpec.id] = []
  for (const currency in countrySpec.supported_bank_account_currencies) {
    countryCurrencyIndex[countrySpec.id].push({ name: currency.toUpperCase(), currency, object: 'currency' })
  }
}
countrySpecs.sort((a ,b) => {
  return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1
})
const countryDivisions = {}
const raw = require('./country-divisions.json')
for (const object in raw) {
  countryDivisions[raw[object].code] = []
  for (const item in raw[object].divisions) {
    countryDivisions[raw[object].code].push({
      object: 'option',
      text: raw[object].divisions[item],
      value: item
    })
  }
  countryDivisions[raw[object].code].sort((a, b) => {
    return a.text.toLowerCase() < b.text.toLowerCase() ? -1 : 1
  })
}

const merchantCategoryCodes = require('./merchant-category-codes.json')

module.exports = {
  countryList,
  countryDivisions,
  countryNameIndex,
  countrySpecs,
  countrySpecIndex,
  countryCurrencyIndex,
  euCountries: ['AT', 'BE', 'DE', 'DK', 'EE', 'ES', 'FI', 'FR', 'GB', 'GR', 'IE', 'IT', 'LU', 'LT', 'LV', 'NL', 'NO', 'PL', 'PT', 'SE', 'SI', 'SK'],
  getMerchantCategoryCodes: (language) => {
    return merchantCategoryCodes[language || global.language] || merchantCategoryCodes.en
  },
  setup: async () => {
    const Storage = require('./src/storage.js')
    module.exports.Storage = await Storage()
    for (const countrySpec of countrySpecs) {
      await module.exports.Storage.CountrySpec.upsert({
        countryid: countrySpec.id,
        stripeObject: countrySpec
      })
    }
  }
}
