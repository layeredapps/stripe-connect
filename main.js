(async () => {
  if (!process.env.CONNECT_WEBHOOK_ENDPOINT_SECRET) {
    const stripe = require('stripe')({
      apiVersion: global.stripeAPIVersion
    })
    if (global.maxmimumStripeRetries) {
      stripe.setMaxNetworkRetries(global.maximumStripeRetries)
    }
    const fs = require('fs')
    const path = require('path')
    const events = fs.readdirSync(path.join(__dirname, '/src/www/webhooks/connect/stripe-webhooks'))
    const eventList = []
    for (const event of events) {
      eventList.push(event.substring(0, event.indexOf('.js')))
    }
    const stripeKey = {
      apiKey: process.env.STRIPE_KEY
    }
    const webhooks = await stripe.webhookEndpoints.list({ limit: 100 }, stripeKey)
    if (webhooks && webhooks.data && webhooks.data.length) {
      for (const webhook of webhooks.data) {
        await stripe.webhookEndpoints.del(webhook.id, stripeKey)
      }
    }
    const webhook = await stripe.webhookEndpoints.create({
      connect: true,
      url: `${process.env.DASHBOARD_SERVER}/webhooks/connect/index-connect-data`,
      enabled_events: eventList
    }, stripeKey)
    global.connectWebhookEndPointSecret = webhook.secret
  }
  const dashboard = require('@layeredapps/dashboard')
  await dashboard.start(__dirname)
  require('./index.js').setup()
  if (process.env.NODE_ENV === 'testing') {
    const helperRoutes = require('./test-helper-routes.js')
    global.sitemap['/api/fake-payout'] = helperRoutes.fakePayout
  }
})()
