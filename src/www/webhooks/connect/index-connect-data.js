const Log = require('@layeredapps/dashboard/src/log.js')('stripe-connect')
const packageJSON = require('../../../../package.json')
const stripe = require('stripe')({
  apiVersion: global.stripeAPIVersion,
  telemetry: false,
  maxNetworkRetries: global.maximumStripeRetries || 0,
  appInfo: {
    version: packageJSON.version,
    name: '@layeredapps/stripe-connect',
    url: 'https://github.com/layeredapps/stripe-connect'
  }
})
const stripeCache = require('../../../stripe-cache.js')
const connect = require('../../../../index.js')
const dashboard = require('@layeredapps/dashboard')

module.exports = {
  auth: false,
  template: false,
  post: async (req, res) => {
    res.statusCode = 200
    if (!req.body || !req.bodyRaw) {
      return res.end()
    }
    let stripeEvent
    try {
      stripeEvent = stripe.webhooks.constructEvent(req.bodyRaw, req.headers['stripe-signature'], req.endpointSecret || global.connectWebhookEndPointSecret)
    } catch (error) {
    }
    if (!stripeEvent) {
      return res.end()
    }
    Log.info('stripe event', stripeEvent.type)
    res.statusCode = 200
    switch (stripeEvent.type) {
      case 'payout.canceled':
      case 'payout.created':
      case 'payout.failed':
      case 'payout.paid':
      case 'payout.updated':
        await updatePayout(stripeEvent, req.stripeKey)
        break
      case 'person.created':
      case 'person.deleted':
      case 'person.updated':
        await updatePerson(stripeEvent, req.stripeKey)
        break
      case 'account.updated':
      // case 'account.external_account.created':
      // case 'account.external_account.updated':
      // case 'account.external_account.deleted':
        await updateStripeAccount(stripeEvent, req.stripeKey)
        break
    }
    // for testing we stash the webhooks for analysis but
    // since ngrok throttles requests we delay to space things out
    if (global.testNumber) {
      global.webhooks = global.webhooks || []
      setTimeout(() => {
        global.webhooks.unshift(stripeEvent)
      }, 20000)
    }
    if (stripeEvent.data && stripeEvent.data.object && stripeEvent.data.object.id) {
      await dashboard.StorageCache.remove(stripeEvent.data.object.id)
    }
    return res.end()
  }
}

async function upsert (dataStore, idName, id, newValues) {
  const existing = await dataStore.findOne({
    where: {
      [idName]: id
    }
  })
  if (!existing) {
    return dataStore.create(newValues)
  }
  const object = {}
  for (const field in newValues) {
    object[field] = newValues[field] || existing.dataValues[field]
  }
  return dataStore.update(object, {
    where: {
      [idName]: id
    }
  })
}

async function load (id, group, key) {
  try {
    return stripeCache.retrieve(id, group, key)
  } catch (error) {
  }
}

async function loadPerson (stripeid, id, key) {
  try {
    return stripeCache.retrievePerson(stripeid, id, key)
  } catch (error) {
  }
}

async function updatePerson (stripeEvent, stripeKey) {
  const stripeObject = await loadPerson(stripeEvent.data.object.account, stripeEvent.data.object.id, stripeKey)
  if (!stripeObject) {
    return
  }
  await connect.Storage.Person.update({
    stripeObject
  }, {
    where: {
      personid: stripeObject.id
    }
  })
}

async function updateStripeAccount (stripeEvent, stripeKey) {
  const stripeObject = await load(stripeEvent.data.object.id, 'accounts', stripeKey)
  if (!stripeObject) {
    return
  }
  await connect.Storage.StripeAccount.update({
    stripeObject
  }, {
    where: {
      stripeid: stripeObject.id
    }
  })
}

async function updatePayout (stripeEvent, stripeKey) {
  let stripeAccount
  try {
    stripeAccount = await global.api.administrator.connect.StripeAccount.get({
      query: {
        stripeid: stripeEvent.account
      },
      stripeKey
    })
  } catch (error) {
    return
  }
  if (!stripeAccount) {
    return
  }
  const stripeObject = await load(stripeEvent.data.object.id, 'payouts', {
    apiKey: stripeKey.apiKey,
    stripeAccount: stripeEvent.account
  })
  if (!stripeObject) {
    return
  }
  await upsert(connect.Storage.Payout, 'payoutid', stripeObject.id, {
    payoutid: stripeObject.id,
    stripeObject
  })
  await connect.Storage.Payout.update({
    stripeid: stripeAccount.stripeid,
    accountid: stripeAccount.accountid
  }, {
    where: {
      payoutid: stripeObject.id
    }
  })
}
