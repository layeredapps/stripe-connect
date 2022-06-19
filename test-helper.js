/* eslint-env mocha */
global.appid = global.appid || 'tests'
global.language = global.language || 'en'
global.applicationPath = global.applicationPath || __dirname
global.stripeAPIVersion = '2020-08-27'
global.maximumStripeRetries = 0
global.testConfiguration = global.testConfiguration || {}
global.testConfiguration.stripeJS = false
global.testConfiguration.maximumStripeRetries = 0
global.testConfiguration.stripeKey = process.env.CONNECT_STRIPE_KEY || process.env.STRIPE_KEY
global.testConfiguration.stripePublishableKey = process.env.CONNECT_STRIPE_PUBLISHABLE_KEY || process.env.STRIPE_PUBLISHABLE_KEY
global.testConfiguration.subscriptionWebhookEndPointSecret = process.env.CONNECT_WEBHOOK_SECRET || false

const Log = require('@layeredapps/dashboard/src/log.js')('test-helper-stripe-connect')
const path = require('path')
const util = require('util')
// const packageJSON = require('./package.json')
// const stripe = require('stripe')({
//   apiVersion: global.stripeAPIVersion,
//   telemetry: false,
//   maxNetworkRetries: global.maximumStripeRetries || 0,
//   appInfo: {
//     version: packageJSON.version,
//     name: '@layeredapps/stripe-connect (test suite)',
//     url: 'https://github.com/layeredapps/stripe-connect'
//   }
// })
const stripeKey = {
  apiKey: global.connectStripeKey || global.stripeKey || process.env.CONNECT_STRIPE_KEY || process.env.STRIPE_KEY
}

const wait = util.promisify((quantity, callback) => {
  return setTimeout(callback, quantity || 100)
})

module.exports = {
  createExternalAccount,
  createPayout,
  createPerson,
  createStripeAccount,
  setupBefore,
  setupBeforeEach,
  submitCompanyOwners,
  submitCompanyDirectors,
  submitCompanyExecutives,
  submitStripeAccount,
  updatePerson,
  updateStripeAccount
}

const TestHelper = require('@layeredapps/dashboard/test-helper.js')
for (const x in TestHelper) {
  module.exports[x] = module.exports[x] || TestHelper[x]
}
const createRequest = module.exports.createRequest = (rawURL, method) => {
  const req = TestHelper.createRequest(rawURL, method)
  req.stripeKey = stripeKey
  return req
}

let connect

async function setupBefore () {
  Log.info('setupBefore')
  connect = require('./index.js')
  await connect.setup()
  webhook = await createWebHook()
  global.connectWebhookEndPointSecret = webhook
  global.testConfiguration.connectWebhookEndPointSecret = webhook
  const helperRoutes = require('./test-helper-routes.js')
  global.sitemap['/api/fake-payout'] = helperRoutes.fakePayout
  global.sitemap['/api/substitute-failed-document-front'] = helperRoutes.substituteFailedDocumentFront
  global.sitemap['/api/substitute-failed-document-back'] = helperRoutes.substituteFailedDocumentBack
}

async function setupBeforeEach () {
  Log.info('setupBeforeEach')
  global.webhooks = []
  global.packageJSON.dashboard.serverFilePaths.push(
    path.join(__dirname, '/src/server/bind-stripe-key.js'),
    require.resolve('@layeredapps/maxmind-geoip/src/server/bind-country.js')
  )
  global.packageJSON.dashboard.server.push(
    require(path.join(__dirname, '/src/server/bind-stripe-key.js')),
    require('@layeredapps/maxmind-geoip/src/server/bind-country.js')
  )
  await connect.Storage.flush()
}

let webhook, tunnel

const createWebHook = util.promisify((callback) => {
  const endpoint = `${global.dashboardServer}/webhooks/connect/index-connect-data`
  const childProcess = require('child_process')
  tunnel = childProcess.spawn('stripe', ['--api-key', stripeKey.apiKey, 'listen', '--forward-to', endpoint.substring(endpoint.indexOf('://') + 3), '--latest'], { detached: true })
  tunnel.stderr.on('data', (raw) => {
    const data = (raw || '').toString()
    if (data.indexOf('whsec') > -1) {
      let secret = data.substring(data.indexOf('whsec'))
      secret = secret.substring(0, secret.indexOf(' '))
      return callback(null, secret)
    }
  })
})

before(setupBefore)
beforeEach(setupBeforeEach)

afterEach(async () => {
  Log.info('afterEach')
  await connect.Storage.flush()
  await deleteOldStripeAccounts()
  if (global.webhooks.length) {
    process.kill(-tunnel.pid)
    webhook = await createWebHook()
    global.connectWebhookEndPointSecret = webhook
    global.testConfiguration.connectWebhookEndPointSecret = webhook
  }
})

after(async () => {
  Log.info('after')
  process.kill(-tunnel.pid)
})

async function deleteOldStripeAccounts () {
  // return
  // Log.info('deleteOldStripeAccounts')
  // try {
  //   const accounts = await stripe.accounts.list({ limit: 100 }, stripeKey)
  //   if (accounts && accounts.data && accounts.data.length) {
  //     for (const account of accounts.data) {
  //       try {
  //         await stripe.accounts.del(account.id, stripeKey)
  //       } catch (error) {
  //         Log.error('error deleting account', account.id, error)
  //       }
  //     }
  //   }
  // } catch (error) {
  //   Log.error('error listing accounts for delete', error)
  // }
}

async function createStripeAccount (user, body) {
  Log.info('createStripeAccount', user, body)
  const req = createRequest(`/api/user/connect/create-stripe-account?accountid=${user.account.accountid}`)
  req.session = user.session
  req.account = user.account
  req.body = body
  user.stripeAccount = await req.post()
  return user.stripeAccount
}

async function updateStripeAccount (user, body, uploads) {
  Log.info('updateStripeAccount', user, body, uploads)
  const req = createRequest(`/api/user/connect/update-stripe-account?stripeid=${user.stripeAccount.stripeid}`)
  req.session = user.session
  req.account = user.account
  req.body = TestHelper.createMultiPart(req, body, uploads)
  user.stripeAccount = await req.patch()
  return user.stripeAccount
}

async function createExternalAccount (user, body) {
  Log.info('createExternalAccount', user, body)
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
  Log.info('createPerson', user, body)
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
  Log.info('updatePerson', user, person, body, uploads)
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
  Log.info('createPayout', user)
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
  Log.info('submitCompanyOwners', user)
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
  Log.info('submitCompanyDirectors', user)
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
  Log.info('submitCompanyExecutives', user)
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
  Log.info('submitStripeAccount', user)
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
