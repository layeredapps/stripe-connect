/* eslint-env mocha */
global.appid = global.appid || 'tests'
global.language = global.language || 'en'
global.applicationPath = global.applicationPath || __dirname
global.stripeAPIVersion = '2020-08-27'
global.maximumStripeRetries = 0
global.testConfiguration = global.testConfiguration || {}
global.testConfiguration.stripeJS = false
global.testConfiguration.maximumStripeRetries = 0

const util = require('util')
const ngrok = require('ngrok')
const packageJSON = require('./package.json')
const stripe = require('stripe')({
  apiVersion: global.stripeAPIVersion,
  telemetry: false,
  maxNetworkRetries: global.maximumStripeRetries || 0,
  appInfo: {
    version: packageJSON.version,
    name: '@layeredapps/stripe-connect (test suite)',
    url: 'https://github.com/layeredapps/stripe-connect'
  }
})
const stripeKey = {
  apiKey: process.env.CONNECT_STRIPE_KEY || process.env.STRIPE_KEY
}
const enabledEvents = [
  // 'setup_intent.canceled',
  // 'setup_intent.created',
  // 'setup_intent.setup_failed',
  // 'setup_intent.succeeded',
  // 'sigma.scheduled_query_run.created',
  // 'review.closed',
  // 'review.opened',
  // 'sku.created',
  // 'sku.deleted',
  // 'sku.updated',
  // 'source.canceled',
  // 'source.chargeable',
  // 'source.failed',
  // 'source.mandate_notification',
  // 'source.refund_attributes_required',
  // 'source.transaction.created',
  // 'source.transaction.updated',
  // 'tax_rate.created',
  // 'tax_rate.updated',
  // 'topup.canceled',
  // 'topup.created',
  // 'topup.failed',
  // 'topup.reversed',
  // 'topup.succeeded',
  // 'transfer.created',
  // 'transfer.failed',
  // 'transfer.paid',
  // 'transfer.reversed',
  // 'transfer.updated',
  // 'reporting.report_run.failed',
  // 'reporting.report_run.succeeded',
  // 'reporting.report_type.updated',
  // 'product.created',
  // 'product.deleted',
  // 'product.updated',
  // 'price.created',
  // 'price.deleted',
  // 'price.updated',
  // 'plan.created',
  // 'plan.deleted',
  // 'plan.updated',
  // 'order_return.created',
  // 'payment_intent.amount_capturable_updated',
  // 'payment_intent.canceled',
  // 'payment_intent.created',
  // 'payment_intent.payment_failed',
  // 'payment_intent.processing',
  // 'payment_intent.succeeded',
  // 'order.payment_succeeded',
  // 'payment_method.attached',
  // 'payment_method.card_automatically_updated',
  // 'payment_method.detached',
  // 'payment_method.updated',
  'payout.canceled',
  'payout.created',
  'payout.failed',
  'payout.paid',
  'payout.updated',
  // 'mandate.updated',
  'person.created',
  'person.deleted',
  'person.updated',
  // 'issuing_card.created',
  // 'issuing_card.updated',
  // 'order.created',
  // 'order.payment_failed',
  // 'order.updated',
  // 'issuing_dispute.created',
  // 'issuing_dispute.funds_reinstated',
  // 'issuing_dispute.updated',
  // 'issuing_transaction.created',
  // 'issuing_transaction.updated',
  // 'issuing_authorization.created',
  // 'issuing_authorization.request',
  // 'issuing_authorization.updated',
  // 'file.created',
  // 'credit_note.created',
  // 'credit_note.updated',
  // 'credit_note.voided',
  // 'issuing_cardholder.created',
  // 'issuing_cardholder.updated',
  // 'invoiceitem.created',
  // 'invoiceitem.deleted',
  // 'invoiceitem.updated',
  // 'invoice.created',
  // 'invoice.deleted',
  // 'invoice.finalized',
  // 'invoice.marked_uncollectible',
  // 'invoice.paid',
  // 'invoice.payment_action_required',
  // 'invoice.payment_failed',
  // 'invoice.payment_succeeded',
  // 'invoice.sent',
  // 'invoice.upcoming',
  // 'invoice.updated',
  // 'invoice.voided',
  // 'coupon.created',
  // 'coupon.deleted',
  // 'coupon.updated',
  // 'checkout.session.async_payment_failed',
  // 'checkout.session.async_payment_succeeded',
  // 'checkout.session.completed',
  // 'customer.created',
  // 'customer.deleted',
  // 'customer.updated',
  // 'customer.discount.created',
  // 'customer.discount.deleted',
  // 'customer.discount.updated',
  // 'customer.source.created',
  // 'customer.source.deleted',
  // 'customer.source.expiring',
  // 'customer.source.updated',
  // 'customer.subscription.created',
  // 'customer.subscription.deleted',
  // 'customer.subscription.pending_update_applied',
  // 'customer.subscription.pending_update_expired',
  // 'customer.subscription.trial_will_end',
  // 'customer.subscription.updated',
  // 'customer.tax_id.created',
  // 'customer.tax_id.deleted',
  // 'customer.tax_id.updated',
  'account.external_account.deleted',
  // 'charge.captured',
  // 'charge.expired',
  // 'charge.failed',
  // 'charge.pending',
  // 'charge.refunded',
  // 'charge.succeeded',
  // 'charge.updated',
  // 'charge.dispute.closed',
  // 'charge.dispute.created',
  // 'charge.dispute.funds_reinstated',
  // 'charge.dispute.funds_withdrawn',
  // 'charge.dispute.updated',
  // 'charge.refund.updated',
  // 'capability.updated',
  // 'balance.available',
  'account.updated',
  'account.external_account.created',
  'account.external_account.updated'
  // 'subscription_schedule.aborted',
  // 'subscription_schedule.canceled',
  // 'subscription_schedule.completed',
  // 'subscription_schedule.created',
  // 'subscription_schedule.expiring',
  // 'subscription_schedule.released',
  // 'subscription_schedule.updated'
]

const wait = util.promisify((quantity, callback) => {
  return setTimeout(callback, quantity || 100)
})

module.exports = {
  createExternalAccount,
  createPayout,
  createPerson,
  createStripeAccount,
  deleteOldWebhooks,
  rotateWebhook,
  setupBefore,
  setupBeforeEach,
  setupWebhook,
  submitCompanyOwners,
  submitCompanyDirectors,
  submitCompanyExecutives,
  submitStripeAccount,
  updatePerson,
  updateStripeAccount
}

const TestHelper = require('@layeredapps/dashboard/test-helper.js')
for (const x in TestHelper) {
  module.exports[x] = TestHelper[x]
}
const createRequest = module.exports.createRequest = (rawURL, method) => {
  const req = TestHelper.createRequest(rawURL, method)
  req.stripeKey = stripeKey
  return req
}

let connect

async function setupBefore () {
  connect = require('./index.js')
  await connect.setup()
  if (!webhook) {
    await deleteOldWebhooks(true)
    await setupWebhook()
  }
  const helperRoutes = require('./test-helper-routes.js')
  global.sitemap['/api/fake-payout'] = helperRoutes.fakePayout
  global.sitemap['/api/substitute-failed-document-front'] = helperRoutes.substituteFailedDocumentFront
  global.sitemap['/api/substitute-failed-document-back'] = helperRoutes.substituteFailedDocumentBack
}

let webhookRotation = 0

async function setupBeforeEach () {
  await connect.Storage.flush()
  await rotateWebhook()
  global.webhooks = []
}

async function rotateWebhook (remake) {
  if (!global.webhooks) {
    global.webhooks = []
  } else if (global.webhooks.length > 0) {
    webhookRotation += global.webhooks.length
    if (remake || webhookRotation >= 20) {
      webhookRotation = 0
      await stripe.webhookEndpoints.del(webhook.id, stripeKey)
      webhook = null
      await setupWebhook()
    }
  }
}

let webhook

async function setupWebhook () {
  webhook = null
  while (!webhook) {
    try {
      await deleteOldWebhooks()
      await ngrok.kill()
      const tunnel = await ngrok.connect({
        port: global.port,
        // auth: process.env.NGROK_AUTH,
        onLogEvent: process.env.LOG_LEVEL && process.env.LOG_LEVEL.indexOf('ngrok') > -1 ? console.log : undefined
      })
      webhook = await stripe.webhookEndpoints.create({
        url: `${tunnel}/webhooks/connect/index-connect-data`,
        enabled_events: enabledEvents,
        connect: true
      }, stripeKey)
      global.connectWebhookEndPointSecret = webhook.secret
    } catch (error) {
    }
    if (!webhook) {
      await wait(100)
    }
  }
}

before(setupBefore)
beforeEach(setupBeforeEach)

afterEach(async () => {
  await connect.Storage.flush()
  await deleteOldStripeAccounts()
})

after(async () => {
  if (webhook) {
    await deleteOldWebhooks()
    webhook = null
  }
  await ngrok.kill()
})

async function deleteOldWebhooks () {
  webhook = null
  try {
    const webhooks = await stripe.webhookEndpoints.list({ limit: 100 }, stripeKey)
    if (webhooks && webhooks.data && webhooks.data.length) {
      for (const webhook of webhooks.data) {
        if (webhook === 0) {
          continue
        }
        await stripe.webhookEndpoints.del(webhook.id, stripeKey)
      }
    }
  } catch (error) {
  }
}

async function deleteOldStripeAccounts () {
  try {
    const accounts = await stripe.accounts.list({ limit: 100 }, stripeKey)
    if (accounts && accounts.data && accounts.data.length) {
      for (const account of accounts.data) {
        await stripe.accounts.del(account.id, stripeKey)
      }
    }
  } catch (error) {
  }
}

async function createStripeAccount (user, body) {
  const req = createRequest(`/api/user/connect/create-stripe-account?accountid=${user.account.accountid}`)
  req.session = user.session
  req.account = user.account
  req.body = body
  user.stripeAccount = await req.post()
  return user.stripeAccount
}

async function updateStripeAccount (user, body, uploads) {
  const req = createRequest(`/api/user/connect/update-stripe-account?stripeid=${user.stripeAccount.stripeid}`)
  req.session = user.session
  req.account = user.account
  req.body = TestHelper.createMultiPart(req, body, uploads)
  user.stripeAccount = await req.patch()
  return user.stripeAccount
}

async function createExternalAccount (user, body) {
  const req = createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.stripeid}`)
  req.session = user.session
  req.account = user.account
  req.body = body
  user.stripeAccount = await req.patch()
  const req2 = createRequest(`/api/user/connect/stripe-account?stripeid=${user.stripeAccount.stripeid}`)
  req2.session = user.session
  req2.account = user.account
  req2.stripeKey = stripeKey
  while (true) {
    try {
      user.stripeAccount = await global.api.user.connect.StripeAccount.get(req2)
      if (user.stripeAccount.stripeObject.external_accounts.total_count === 1) {
        return user.stripeAccount
      }
    } catch (error) {
    }
    await wait(100)
  }
}

async function createPerson (user, body) {
  const req = createRequest(`/api/user/connect/create-person?stripeid=${user.stripeAccount.stripeid}`)
  req.session = user.session
  req.account = user.account
  req.body = body
  const person = await req.post()
  if (body && body.relationship_owner) {
    user.owner = person
  } else if (body && body.relationship_director) {
    user.director = person
  } else if (body && body.relationship_representative) {
    user.representative = person
  } else if (body && body.relationship_executive) {
    user.executive = person
  }
  return person
}

async function updatePerson (user, person, body, uploads) {
  const req = createRequest(`/api/user/connect/update-person?personid=${person.personid}`)
  req.session = user.session
  req.account = user.account
  req.body = TestHelper.createMultiPart(req, body, uploads)
  const personNow = await req.patch()
  if (personNow.stripeObject.relationship.owner) {
    user.owner = personNow
  } else if (personNow.stripeObject.relationship.director) {
    user.director = personNow
  } else if (personNow.stripeObject.relationship.representative) {
    user.representative = personNow
  }
  return personNow
}

async function createPayout (user) {
  const req = createRequest(`/api/fake-payout?stripeid=${user.stripeAccount.stripeid}`)
  req.session = user.session
  req.account = user.account
  const payout = await req.get()
  const req2 = createRequest(`/api/user/connect/payout?payoutid=${payout.id}`)
  req2.session = user.session
  req2.account = user.account
  req2.stripeKey = stripeKey
  while (true) {
    try {
      const payout = await req2.route.api.get(req2)
      user.payout = payout
      return user.payout
    } catch (error) {
    }
    await wait(100)
  }
}

async function submitCompanyOwners (user) {
  const req = createRequest(`/api/user/connect/set-company-owners-submitted?stripeid=${user.stripeAccount.stripeid}`)
  req.session = user.session
  req.account = user.account
  user.stripeAccount = await req.patch()
  const req2 = createRequest(`/api/user/connect/stripe-account?stripeid=${user.stripeAccount.stripeid}`)
  req2.session = user.session
  req2.account = user.account
  req2.stripeKey = stripeKey
  while (true) {
    try {
      user.stripeAccount = await global.api.user.connect.StripeAccount.get(req2)
      if (user.stripeAccount.stripeObject.company.owners_provided) {
        return user.stripeAccount
      }
    } catch (error) {
    }
    await wait(100)
  }
}

async function submitCompanyDirectors (user) {
  const req = createRequest(`/api/user/connect/set-company-directors-submitted?stripeid=${user.stripeAccount.stripeid}`)
  req.session = user.session
  req.account = user.account
  user.stripeAccount = await req.patch()
  const req2 = createRequest(`/api/user/connect/stripe-account?stripeid=${user.stripeAccount.stripeid}`)
  req2.session = user.session
  req2.account = user.account
  req2.stripeKey = stripeKey
  while (true) {
    try {
      user.stripeAccount = await global.api.user.connect.StripeAccount.get(req2)
      if (user.stripeAccount.stripeObject.company.directors_provided) {
        return user.stripeAccount
      }
    } catch (error) {
    }
    await wait(100)
  }
}

async function submitCompanyExecutives (user) {
  const req = createRequest(`/api/user/connect/set-company-executives-submitted?stripeid=${user.stripeAccount.stripeid}`)
  req.session = user.session
  req.account = user.account
  user.stripeAccount = await req.patch()
  const req2 = createRequest(`/api/user/connect/stripe-account?stripeid=${user.stripeAccount.stripeid}`)
  req2.session = user.session
  req2.account = user.account
  req2.stripeKey = stripeKey
  while (true) {
    try {
      user.stripeAccount = await global.api.user.connect.StripeAccount.get(req2)
      if (user.stripeAccount.stripeObject.company.executives_provided) {
        return user.stripeAccount
      }
    } catch (error) {
    }
    await wait(100)
  }
}

async function submitStripeAccount (user) {
  const req = createRequest(`/api/user/connect/set-stripe-account-submitted?stripeid=${user.stripeAccount.stripeid}`)
  req.session = user.session
  req.account = user.account
  user.stripeAccount = await req.patch()
  const req2 = createRequest(`/api/user/connect/stripe-account?stripeid=${user.stripeAccount.stripeid}`)
  req2.session = user.session
  req2.account = user.account
  req2.stripeKey = stripeKey
  while (true) {
    try {
      user.stripeAccount = await global.api.user.connect.StripeAccount.get(req2)
      if (!user.stripeAccount.stripeObject.requirements.pending_verification.length) {
        return user.stripeAccount
      }
    } catch (error) {
    }
    await wait(100)
  }
}
