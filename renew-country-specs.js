(async () => {
  const stripeKey = {
    apiKey: process.env.STRIPE_KEY
  }
  const stripe = require('stripe')({
    apiVersion: global.stripeAPIVersion,
    telemetry: false,
    maxNetworkRetries: global.maximumStripeRetries || 0,
    appInfo: {
      version: '0.0.1',
      name: '@layeredapps/stripe-connect',
      url: 'https://github.com/layeredapps/stripe-connect'
    }
  })

  const countrySpecs = await stripe.countrySpecs.list({ limit: 100 }, stripeKey)
  console.log(JSON.stringify(countrySpecs, null, ' '))
})()
