
/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')
const DashboardTestHelper = require('@layeredapps/dashboard/test-helper.js')

describe('/api/administrator/connect/stripe-accounts', function () {
  let cachedResponses, cachedStripeAccounts
  async function bundledData (retryNumber) {
    if (retryNumber > 0) {
      cachedResponses = {}
      await TestHelper.rotateWebhook(true)
    }
    if (cachedResponses && cachedResponses.finished) {
      return
    }
    cachedResponses = {}
    cachedStripeAccounts = []
    await DashboardTestHelper.setupBeforeEach()
    await TestHelper.setupBeforeEach()
    const administrator = await TestHelper.createOwner()
    for (let i = 0, len = global.pageSize + 2; i < len; i++) {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'US',
        business_type: 'company'
      })
      cachedStripeAccounts.unshift(user.stripeAccount.stripeid)
    }
    const user = await TestHelper.createUser()
    await TestHelper.createStripeAccount(user, {
      country: 'US',
      business_type: 'individual'
    })
    cachedStripeAccounts.unshift(user.stripeAccount.stripeid)
    await TestHelper.createStripeAccount(user, {
      country: 'US',
      business_type: 'company'
    })
    cachedStripeAccounts.unshift(user.stripeAccount.stripeid)
    const req1 = TestHelper.createRequest('/api/administrator/connect/stripe-accounts')
    req1.account = administrator.account
    req1.session = administrator.session
    cachedResponses.returns = await req1.get()
    global.pageSize = 3
    cachedResponses.pageSize = await req1.get()
    global.pageSize = 2
    const req2 = TestHelper.createRequest('/api/administrator/connect/stripe-accounts?offset=1')
    req2.account = administrator.account
    req2.session = administrator.session
    cachedResponses.offset = await req2.get()
    const req3 = TestHelper.createRequest('/api/administrator/connect/stripe-accounts?limit=1')
    req3.account = administrator.account
    req3.session = administrator.session
    cachedResponses.limit = await req3.get()
    const req4 = TestHelper.createRequest('/api/administrator/connect/stripe-accounts?all=true')
    req4.account = administrator.account
    req4.session = administrator.session
    cachedResponses.all = await req4.get()
    const req5 = TestHelper.createRequest(`/api/administrator/connect/stripe-accounts?accountid=${user.account.accountid}`)
    req5.account = administrator.account
    req5.session = administrator.session
    cachedResponses.accountid = await req5.get()
    cachedResponses.finished = true
  }
  describe('exceptions', () => {
    describe('invalid-accountid', () => {
      it('invalid querystring accountid', async () => {
        const administrator = await TestHelper.createOwner()
        const req = TestHelper.createRequest('/api/administrator/connect/stripe-accounts?accountid=invalid')
        req.account = administrator.account
        req.session = administrator.session
        let errorMessage
        try {
          await req.get()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-accountid')
      })
    })
  })

  describe('receives', function () {
    it('optional querystring offset (integer)', async function () {
      await bundledData(this.test.currentRetry())
      const offset = 1
      const stripeAccountsNow = cachedResponses.offset
      for (let i = 0, len = global.pageSize; i < len; i++) {
        assert.strictEqual(stripeAccountsNow[i].stripeid, cachedStripeAccounts[offset + i])
      }
    })

    it('optional querystring limit (integer)', async function () {
      await bundledData(this.test.currentRetry())
      const limit = 1
      const stripeAccountsNow = cachedResponses.limit
      assert.strictEqual(stripeAccountsNow.length, limit)
    })

    it('optional querystring all (boolean)', async function () {
      await bundledData(this.test.currentRetry())
      const stripeAccountsNow = cachedResponses.all
      assert.strictEqual(stripeAccountsNow.length, cachedStripeAccounts.length)
    })

    it('optional querystring accountid (string)', async function () {
      await bundledData(this.test.currentRetry())
      const stripeAccountsNow = cachedResponses.accountid
      assert.strictEqual(stripeAccountsNow.length, 2)
    })
  })

  describe('returns', function () {
    it('array', async function () {
      await bundledData(this.test.currentRetry())
      const payouts = cachedResponses.returns
      assert.strictEqual(payouts.length, global.pageSize)
    })
  })

  describe('configuration', function () {
    it('environment PAGE_SIZE', async function () {
      await bundledData(this.test.currentRetry())
      const payouts = cachedResponses.pageSize
      assert.strictEqual(payouts.length, global.pageSize + 1)
    })
  })
})
