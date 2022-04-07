/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')
const TestStripeAccounts = require('../../../../../test-stripe-accounts.js')
const DashboardTestHelper = require('@layeredapps/dashboard/test-helper.js')

describe('/api/administrator/connect/payouts', function () {
  let cachedResponses, cachedPayouts, accountPayouts, stripeAccountPayouts
  async function bundledData (retryNumber) {
    if (retryNumber > 0) {
      cachedResponses = {}
      await TestHelper.rotateWebhook(true)
    }
    if (cachedResponses && cachedResponses.finished) {
      return
    }
    cachedResponses = {}
    cachedPayouts = []
    accountPayouts = []
    stripeAccountPayouts = []
    await DashboardTestHelper.setupBeforeEach()
    await TestHelper.setupBeforeEach()
    const administrator = await TestHelper.createOwner()
    let user = await TestStripeAccounts.createSubmittedIndividual('NZ')
    for (let i = 0, len = global.pageSize; i < len; i++) {
      await TestHelper.createPayout(user)
      cachedPayouts.unshift(user.payout.payoutid)
    }
    user = await TestStripeAccounts.createSubmittedIndividual('NZ')
    const stripeid = user.stripeAccount.stripeid
    await TestHelper.createPayout(user)
    cachedPayouts.unshift(user.payout.payoutid)
    accountPayouts.unshift(user.payout.payoutid)
    stripeAccountPayouts.unshift(user.payout.payoutid)
    user = await TestStripeAccounts.createSubmittedIndividual('NZ', user)
    await TestHelper.createPayout(user)
    cachedPayouts.unshift(user.payout.payoutid)
    accountPayouts.unshift(user.payout.payoutid)
    const req1 = TestHelper.createRequest('/api/administrator/connect/payouts')
    req1.account = administrator.account
    req1.session = administrator.session
    cachedResponses.returns = await req1.get()
    global.pageSize = 3
    cachedResponses.pageSize = await req1.get()
    const req2 = TestHelper.createRequest('/api/administrator/connect/payouts?offset=1')
    req2.account = administrator.account
    req2.session = administrator.session
    cachedResponses.offset = await req2.get()
    const req3 = TestHelper.createRequest('/api/administrator/connect/payouts?limit=1')
    req3.account = administrator.account
    req3.session = administrator.session
    cachedResponses.limit = await req3.get()
    const req4 = TestHelper.createRequest('/api/administrator/connect/payouts?all=true')
    req4.account = administrator.account
    req4.session = administrator.session
    cachedResponses.all = await req4.get()
    const req5 = TestHelper.createRequest(`/api/administrator/connect/payouts?accountid=${user.account.accountid}&all=true`)
    req5.account = administrator.account
    req5.session = administrator.session
    cachedResponses.accountid = await req5.get()
    const req6 = TestHelper.createRequest(`/api/administrator/connect/payouts?stripeid=${stripeid}&all=true`)
    req6.account = administrator.account
    req6.session = administrator.session
    cachedResponses.stripeid = await req6.get()
    cachedResponses.finished = true
  }
  describe('receives', function () {
    it('optional querystring offset (integer)', async function () {
      await bundledData(this.test.currentRetry())
      const offset = 1
      const payoutsNow = cachedResponses.offset
      for (let i = 0, len = global.pageSize; i < len; i++) {
        assert.strictEqual(payoutsNow[i].payoutid, cachedPayouts[offset + i])
      }
    })

    it('optional querystring limit (integer)', async function () {
      await bundledData(this.test.currentRetry())
      const limit = 1
      const payoutsNow = cachedResponses.limit
      assert.strictEqual(payoutsNow.length, limit)
    })

    it('optional querystring all (boolean)', async function () {
      await bundledData(this.test.currentRetry())
      const payoutsNow = cachedResponses.all
      assert.strictEqual(payoutsNow.length, cachedPayouts.length)
    })

    it('optional querystring accountid (string)', async function () {
      await bundledData(this.test.currentRetry())
      const payoutsNow = cachedResponses.accountid
      assert.strictEqual(payoutsNow.length, accountPayouts.length)
    })

    it('optional querystring stripeid (string)', async function () {
      await bundledData(this.test.currentRetry())
      const payoutsNow = cachedResponses.stripeid
      assert.strictEqual(payoutsNow.length, stripeAccountPayouts.length)
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
      global.pageSize = 3
      const payouts = cachedResponses.pageSize
      assert.strictEqual(payouts.length, global.pageSize)
    })
  })
})
