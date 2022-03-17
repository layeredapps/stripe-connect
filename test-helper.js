/* eslint-env mocha */
global.applicationPath = global.applicationPath || __dirname
global.stripeAPIVersion = '2020-08-27'
global.maximumStripeRetries = 0
global.testConfiguration = global.testConfiguration || {}
global.testConfiguration.stripeJS = false
global.testConfiguration.maximumStripeRetries = 0
global.testConfiguration.webhooks = []

const Log = require('@layeredapps/dashboard/src/log.js')('stripe-connect')
const util = require('util')
const ngrok = require('ngrok')
const packageJSON = require('./package.json')
const path = require('path')
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
  apiKey: process.env.STRIPE_KEY
}

const wait = util.promisify((callback) => {
  return setTimeout(callback, 100)
})

module.exports = {
  createExternalAccount,
  createPayout,
  createPerson,
  createStripeAccount,
  deleteOldWebhooks,
  setupBefore,
  setupBeforeEach,
  setupWebhook,
  submitCompanyOwners,
  submitCompanyDirectors,
  submitCompanyExecutives,
  submitStripeAccount,
  triggerVerification,
  updatePerson,
  updateStripeAccount,
  waitForAccountRequirement: util.promisify(waitForAccountRequirement),
  waitForPersonRequirement: util.promisify(waitForPersonRequirement),
  waitForPersonCurrentlyDueFields,
  waitForCurrentlyDueFields,
  waitForPendingFieldsToLeave: util.promisify(waitForPendingFieldsToLeave),
  waitForVerification: util.promisify(waitForVerification),
  waitForPayoutsEnabled: util.promisify(waitForPayoutsEnabled),
  waitForVerificationFieldsToLeave: util.promisify(waitForVerificationFieldsToLeave),
  waitForCurrentlyDueFieldsToLeave: util.promisify(waitForCurrentlyDueFieldsToLeave),
  waitForVerificationFailure: util.promisify(waitForVerificationFailure),
  waitForVerificationStart: util.promisify(waitForVerificationStart),
  waitForPayout,
  waitForWebhook: util.promisify(waitForWebhook),
  'success_id_scan_front.png': {
    filename: 'id_scan_front.png',
    name: 'id_scan_front.png',
    path: path.join(__dirname, '/test-documentid-success.png')
  },
  'fail_id_scan_front.png': {
    filename: 'id_scan_front.png',
    name: 'id_scan_front.png',
    path: path.join(__dirname, '/test-documentid-failed.png')
  },
  'success_id_scan_back.png': {
    filename: 'id_scan_back.png',
    name: 'id_scan_back.png',
    path: path.join(__dirname, '/test-documentid-success.png')
  },
  'fail_id_scan_back.png': {
    filename: 'id_scan_back.png',
    name: 'id_scan_back.png',
    path: path.join(__dirname, '/test-documentid-failed.png')
  }
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

async function setupBefore () {
  if (!webhook) {
    await deleteOldWebhooks(true)
    await setupWebhook()
    await require('./index.js').setup()
  }
  const helperRoutes = require('./test-helper-routes.js')
  global.sitemap['/api/fake-payout'] = helperRoutes.fakePayout
  global.sitemap['/api/substitute-failed-document-front'] = helperRoutes.substituteFailedDocumentFront
  global.sitemap['/api/substitute-failed-document-back'] = helperRoutes.substituteFailedDocumentBack
}

async function setupBeforeEach () {
  global.webhooks = []
  const connect = require('./index.js')
  await connect.Storage.flush()
}

let webhook, tunnel, data
async function setupWebhook () {
  if (webhook) {
    return
  }
  let newAddress
  ngrok.kill()
  tunnel = null
  while (!tunnel) {
    try {
      tunnel = await ngrok.connect({
        port: global.port,
        auth: process.env.NGROK_AUTH
      })
      if (!tunnel) {
        continue
      }
      newAddress = tunnel
      break
    } catch (error) {
      continue
    }
  }
  if (newAddress) {
    webhook = await stripe.webhookEndpoints.create({
      url: `${newAddress}/webhooks/connect/index-connect-data`,
      enabled_events: [
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
      ],
      connect: true
    }, stripeKey)
    global.connectWebhookEndPointSecret = webhook.secret
  }
}

before(setupBefore)
beforeEach(setupBeforeEach)

afterEach(async () => {
  if (data) {
    await deleteOldStripeAccounts()
    data = false
  }
  const connect = require('./index.js')
  await connect.Storage.flush()
})

after(async () => {
  if (webhook) {
    await deleteOldWebhooks()
    webhook = null
  }
  ngrok.kill()
})

async function deleteOldWebhooks () {
  webhook = null
  let webhooks
  while (true) {
    try {
      webhooks = await stripe.webhookEndpoints.list(stripeKey)
      break
    } catch (error) {
    }
  }
  while (webhooks.data && webhooks.data.length) {
    for (const webhook of webhooks.data) {
      if (webhook === 0) {
        continue
      }
      try {
        await stripe.webhookEndpoints.del(webhook.id, stripeKey)
      } catch (error) {
      }
    }
    try {
      webhooks = await stripe.webhookEndpoints.list(stripeKey)
    } catch (error) {
      webhooks = { data: [0] }
    }
  }
}

async function deleteOldStripeAccounts () {
  let accounts
  while (true) {
    try {
      accounts = await stripe.accounts.list(stripeKey)
      break
    } catch (error) {
    }
  }
  while (accounts.data && accounts.data.length) {
    for (const account of accounts.data) {
      try {
        await stripe.accounts.del(account.id, stripeKey)
      } catch (error) {
      }
    }
    try {
      accounts = await stripe.accounts.list(stripeKey)
    } catch (error) {
    }
  }
}

async function createStripeAccount (user, body) {
  data = true
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
    await wait()
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
    await wait()
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
    await wait()
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
    await wait()
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
    await wait()
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
      if (user.stripeAccount.stripeObject.requirements.pending_verification.length) {
        return wait()
      }
      return user.stripeAccount
    } catch (error) {
    }
  }
}

async function waitForPayout (payoutid) {
  Log.info('waitForPayout', payoutid)
  const req = module.exports.createRequest(`/api/administrator/connect/payout?payoutid=${payoutid}`)
  req.stripeKey = stripeKey
  while (true) {
    try {
      const payout = await req.route.api.get(req)
      return payout
    } catch (error) {
      await wait(100)
    }
  }
}

async function waitForPayoutsEnabled (user, callback) {
  Log.info('waitForPayoutsEnabled')
  const req = createRequest(`/api/user/connect/stripe-account?stripeid=${user.stripeAccount.stripeid}&from=waitForPayoutsEnabled`)
  req.account = user.account
  req.session = user.session
  req.stripeKey = stripeKey
  async function wait () {
    if (global.testEnded) {
      return
    }
    try {
      const stripeAccount = await global.api.user.connect.StripeAccount.get(req)
      if (stripeAccount.stripeObject.requirements.currently_due.length) {
        throw new Error('account requires fields ' + stripeAccount.stripeObject.requirements.currently_due.join(', '))
      } else if (stripeAccount.stripeObject.requirements.eventually_due.length) {
        throw new Error('account requires fields ' + stripeAccount.stripeObject.requirements.eventually_due.join(', '))
      }
      if (!stripeAccount.stripeObject.payouts_enabled) {
        return setTimeout(wait, 100)
      }
      return setTimeout(() => {
        return callback(null, stripeAccount)
      }, 10)
    } catch (error) {
    }
    return setTimeout(wait, 10)
  }
  return setTimeout(wait, 100)
}

async function waitForVerification (user, callback) {
  Log.info('waitForVerification')
  const req = createRequest(`/api/user/connect/stripe-account?stripeid=${user.stripeAccount.stripeid}&from=waitForVerification`)
  req.account = user.account
  req.session = user.session
  req.stripeKey = stripeKey
  async function wait () {
    if (global.testEnded) {
      return
    }
    try {
      const stripeAccount = await global.api.user.connect.StripeAccount.get(req)
      if (stripeAccount.business_type === 'individual') {
        if (!stripeAccount.individual || stripeAccount.individual.verification.status !== 'verified') {
          return setTimeout(wait, 100)
        }
      }
      if (!stripeAccount.stripeObject.payouts_enabled || stripeAccount.stripeObject.requirements.currently_due.length) {
        return setTimeout(wait, 100)
      }
      user.stripeAccount = stripeAccount
      return callback(null, stripeAccount)
    } catch (error) {
    }
    return setTimeout(wait, 10)
  }
  return setTimeout(wait, 100)
}

async function waitForVerificationFailure (user, callback) {
  Log.info('waitForVerificationFailure')
  const req = createRequest(`/api/user/connect/stripe-account?stripeid=${user.stripeAccount.stripeid}&from=waitForVerificationFailure`)
  req.account = user.account
  req.session = user.session
  req.stripeKey = stripeKey
  async function wait () {
    if (global.testEnded) {
      return
    }
    try {
      const stripeAccount = await global.api.user.connect.StripeAccount.get(req)
      if (stripeAccount.business_type === 'individual') {
        if ((stripeAccount.stripeObject.requirements && stripeAccount.stripeObject.requirements.pending_verification.length) ||
            (stripeAccount.stripeObject.individual && stripeAccount.stripeObject.individual.verification.status !== 'unverified')) {
          return setTimeout(wait, 100)
        }
      } else {
        if ((stripeAccount.stripeObject.requirements && stripeAccount.stripeObject.requirements.pending_verification.length) ||
          (stripeAccount.stripeObject.company && stripeAccount.stripeObject.company.verification.status !== 'unverified')) {
          return setTimeout(wait, 100)
        }
      }
      return setTimeout(callback, 10)
    } catch (error) {
    }
    return setTimeout(wait, 10)
  }
  return setTimeout(wait, 100)
}

async function waitForPendingFieldsToLeave (user, callback) {
  Log.info('waitForPendingFieldsToLeave')
  const req = createRequest(`/api/user/connect/stripe-account?stripeid=${user.stripeAccount.stripeid}`)
  req.account = user.account
  req.session = user.session
  req.stripeKey = stripeKey
  async function wait () {
    if (global.testEnded) {
      return
    }
    try {
      const stripeAccount = await global.api.user.connect.StripeAccount.get(req)
      if (stripeAccount.stripeObject.requirements.pending_verification.length) {
        return setTimeout(wait, 100)
      }
      user.stripeAccount = stripeAccount
      return setTimeout(callback, 10)
    } catch (error) {
    }
    return setTimeout(wait, 10)
  }
  return setTimeout(wait, 100)
}

async function waitForCurrentlyDueFieldsToLeave (user, contains, callback) {
  Log.info('waitForCurrentlyDueFieldsToLeave', contains, user.stripeAccount.stripeObject.requirements.currently_due)
  const req = createRequest(`/api/user/connect/stripe-account?stripeid=${user.stripeAccount.stripeid}`)
  req.account = user.account
  req.session = user.session
  req.stripeKey = stripeKey
  async function wait () {
    if (global.testEnded) {
      return
    }
    try {
      const stripeAccount = await global.api.user.connect.StripeAccount.get(req)
      for (const field of stripeAccount.stripeObject.requirements.currently_due) {
        if (field.indexOf(contains) > -1) {
          Log.info('waitForCurrentlyDueFieldsToLeave', contains, stripeAccount.stripeObject.requirements.currently_due)
          return setTimeout(wait, 100)
        }
      }
      Log.info('finished waitForCurrentlyDueFieldsToLeave', contains, stripeAccount.stripeObject.requirements.currently_due)
      user.stripeAccount = stripeAccount
      return setTimeout(callback, 10)
    } catch (error) {
    }
    return setTimeout(wait, 10)
  }
  return setTimeout(wait, 100)
}

async function waitForVerificationFieldsToLeave (user, contains, callback) {
  Log.info('waitForVerificationFieldsToLeave')
  const req = createRequest(`/api/user/connect/stripe-account?stripeid=${user.stripeAccount.stripeid}`)
  req.account = user.account
  req.session = user.session
  req.stripeKey = stripeKey
  async function wait () {
    if (global.testEnded) {
      return
    }
    try {
      const stripeAccount = await global.api.user.connect.StripeAccount.get(req)
      for (const field of stripeAccount.stripeObject.requirements.eventually_due) {
        if (field.indexOf(contains) > -1) {
          return setTimeout(wait, 100)
        }
      }
      for (const field of stripeAccount.stripeObject.requirements.past_due) {
        if (field.indexOf(contains) > -1) {
          return setTimeout(wait, 100)
        }
      }
      for (const field of stripeAccount.stripeObject.requirements.currently_due) {
        if (field.indexOf(contains) > -1) {
          return setTimeout(wait, 100)
        }
      }
      user.stripeAccount = stripeAccount
      return setTimeout(callback, 10)
    } catch (error) {
    }
    return setTimeout(wait, 10)
  }
  return setTimeout(wait, 100)
}

async function waitForVerificationStart (user, callback) {
  Log.info('waitForVerificationStart')
  const req = createRequest(`/api/user/connect/stripe-account?stripeid=${user.stripeAccount.stripeid}`)
  req.account = user.account
  req.session = user.session
  req.stripeKey = stripeKey
  async function wait () {
    if (global.testEnded) {
      return
    }
    try {
      const stripeAccount = await global.api.user.connect.StripeAccount.get(req)
      if (stripeAccount.stripeObject.requirements.eventually_due.length ||
        stripeAccount.stripeObject.requirements.past_due.length ||
        stripeAccount.stripeObject.requirements.currently_due.length) {
        return setTimeout(wait, 100)
      }
      user.stripeAccount = stripeAccount
      return setTimeout(callback, 10)
    } catch (error) {
    }
    return setTimeout(wait, 10)
  }
  return setTimeout(wait, 100)
}

async function waitForAccountRequirement (user, requirement, callback) {
  Log.info('waitForAccountRequirement', requirement)
  const req = createRequest(`/api/user/connect/stripe-account?stripeid=${user.stripeAccount.stripeid}`)
  req.account = user.account
  req.session = user.session
  req.stripeKey = stripeKey
  async function wait () {
    if (global.testEnded) {
      return
    }
    try {
      const stripeAccount = await global.api.user.connect.StripeAccount.get(req)
      if (!stripeAccount.stripeObject.requirements) {
        return setTimeout(wait, 100)
      }
      if (stripeAccount.stripeObject.requirements.currently_due.indexOf(requirement) > -1) {
        user.stripeAccount = stripeAccount
        return setTimeout(callback, 10)
      }
      if (stripeAccount.stripeObject.requirements.eventually_due.indexOf(requirement) > -1) {
        user.stripeAccount = stripeAccount
        return setTimeout(callback, 10)
      }
      return setTimeout(wait, 100)
    } catch (error) {
    }
    return setTimeout(wait, 10)
  }
  return setTimeout(wait, 100)
}

async function waitForPersonRequirement (user, personid, requirement, callback) {
  Log.info('waitForPersonRequirement', personid, requirement)
  const req = createRequest(`/api/user/connect/person?personid=${personid}`)
  req.account = user.account
  req.session = user.session
  req.stripeKey = stripeKey
  async function wait () {
    if (global.testEnded) {
      return
    }
    try {
      const person = await global.api.user.connect.Person.get(req)
      if (person && person.stripeObject.requirements) {
        if (person.stripeObject.requirements.currently_due.indexOf(requirement) > -1 ||
            person.stripeObject.requirements.eventually_due.indexOf(requirement) > -1) {
          return setTimeout(callback, 10)
        }
      }
    } catch (error) {
    }
    return setTimeout(wait, 100)
  }
  return setTimeout(wait, 100)
}

async function waitForCurrentlyDueFields (user, contains) {
  Log.info('waitForCurrentlyDueFields', contains === false ? 'none' : contains)
  const stripeObject = user.stripeAccount.stripeObject
  const req = createRequest(`/api/user/connect/stripe-account?stripeid=${stripeObject.id}`)
  req.account = user.account
  req.session = user.session
  req.stripeKey = stripeKey
  while (true) {
    if (global.testEnded) {
      return
    }
    try {
      const newObject = await req.route.api.get(req)
      if (contains && newObject.stripeObject.requirements.currently_due.indexOf(contains) > -1) {
        user.stripeAccount = newObject
        return newObject
      } else if (!contains) {
        let invalid = false
        for (const field of newObject.stripeObject.requirements.currently_due) {
          if (field.startsWith('tos_acceptance')) {
            continue
          }
          invalid = true
          break
        }
        if (!invalid) {
          user.stripeAccount = newObject
          return newObject
        }
      }
    } catch (error) {
    }
    await wait()
  }
}

async function waitForPersonCurrentlyDueFields (user, personType, contains) {
  Log.info('waitForPersonCurrentlyDueFields', personType, contains === false ? 'none' : contains)
  const person = user[personType].stripeObject
  const req = createRequest(`/api/user/connect/person?personid=${person.id}`)
  req.account = user.account
  req.session = user.session
  req.stripeKey = stripeKey
  while (true) {
    if (global.testEnded) {
      return
    }
    try {
      const newObject = await req.route.api.get(req)
      if (contains && newObject.stripeObject.requirements.currently_due.indexOf(contains) > -1) {
        user[personType] = newObject
        return newObject
      } else if (!contains && !newObject.stripeObject.requirements.currently_due.length) {
        user[personType] = newObject
        return newObject
      }
    } catch (error) {
    }
    await wait()
  }
}

async function triggerVerification (user) {
  const accountKey = {
    apiKey: stripeKey.apiKey,
    stripeAccount: user.stripeAccount.stripeid
  }
  const chargeInfo = {
    amount: 2000,
    currency: 'usd',
    source: 'tok_visa_triggerVerification',
    description: 'Test charge'
  }
  let charge
  try {
    charge = await stripe.charges.create(chargeInfo, accountKey)
  } catch (error) {
  }
  user.charge = charge
  return charge
}

async function waitForWebhook (webhookType, matching, callback) {
  Log.info('waitForWebhook', webhookType)
  if (!webhook) {
    return callback()
  }
  async function wait () {
    if (global.testEnded) {
      return
    }
    if (!global.webhooks || !global.webhooks.length) {
      return setTimeout(wait, 10)
    }
    for (const received of global.webhooks) {
      if (received.type !== webhookType) {
        continue
      }
      if (matching(received)) {
        return callback()
      }
    }
    return setTimeout(wait, 10)
  }
  return setTimeout(wait, 10)
}
