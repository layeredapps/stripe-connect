
/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')
const TestStripeAccounts = require('../../../../../test-stripe-accounts.js')
const DashboardTestHelper = require('@layeredapps/dashboard/test-helper.js')

describe('/api/administrator/connect/persons', function () {
  before(TestHelper.disableMetrics)
  after(TestHelper.enableMetrics)
  let cachedResponses, cachedPersons
  async function bundledData (retryNumber) {
    if (retryNumber > 0) {
      cachedResponses = {}
    }
    if (cachedResponses && cachedResponses.finished) {
      return
    }
    cachedResponses = {}
    cachedPersons = []
    await DashboardTestHelper.setupBeforeEach()
    await TestHelper.setupBeforeEach()
    const administrator = await TestHelper.createOwner()
    const user = await TestStripeAccounts.createIndividualMissingIndividualDetails()
    const req = TestHelper.createRequest(`/api/administrator/connect/persons?stripeid=${user.stripeAccount.stripeid}`)
    req.account = administrator.account
    req.session = administrator.session
    try {
      await req.get()
    } catch (error) {
      cachedResponses.invalidStripe = error.message
    }
    for (let i = 0, len = global.pageSize + 2; i < len; i++) {
      const user2 = await TestStripeAccounts.createCompanyWithDirectors('DE', 1)
      cachedPersons.unshift(user2.director.personid)
    }
    const user3 = await TestStripeAccounts.createCompanyWithDirectors('DE', 1)
    cachedPersons.unshift(user3.director.personid)
    await TestHelper.createPerson(user3, {
      relationship_director: 'true',
      relationship_executive: 'true',
      relationship_title: 'SVP Testing',
      relationship_percent_ownership: '0'
    })
    cachedPersons.unshift(user3.director.personid)
    const req1 = TestHelper.createRequest('/api/administrator/connect/persons')
    req1.account = administrator.account
    req1.session = administrator.session
    req1.filename = __filename
    req1.saveResponse = true
    cachedResponses.returns = await req1.get()
    global.pageSize = 3
    cachedResponses.pageSize = await req1.get()
    global.pageSize = 2
    const req2 = TestHelper.createRequest('/api/administrator/connect/persons?offset=1')
    req2.account = administrator.account
    req2.session = administrator.session
    cachedResponses.offset = await req2.get()
    const req3 = TestHelper.createRequest('/api/administrator/connect/persons?limit=1')
    req3.account = administrator.account
    req3.session = administrator.session
    cachedResponses.limit = await req3.get()
    const req4 = TestHelper.createRequest('/api/administrator/connect/persons?all=true')
    req4.account = administrator.account
    req4.session = administrator.session
    cachedResponses.all = await req4.get()
    const req5 = TestHelper.createRequest(`/api/administrator/connect/persons?stripeid=${user3.stripeAccount.stripeid}`)
    req5.account = administrator.account
    req5.session = administrator.session
    cachedResponses.stripeid = await req5.get()
    cachedResponses.finished = true
  }
  describe('exceptions', () => {
    describe('invalid-stripeid', () => {
      it('invalid Stripe account is individual', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.invalidStripe
        assert.strictEqual(errorMessage, 'invalid-stripe-account')
      })
    })
  })

  describe('receives', function () {
    it('optional querystring offset (integer)', async function () {
      await bundledData(this.test.currentRetry())
      const offset = 1
      const personsNow = cachedResponses.offset
      for (let i = 0, len = global.pageSize; i < len; i++) {
        assert.strictEqual(personsNow[i].personid, cachedPersons[offset + i])
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
      assert.strictEqual(stripeAccountsNow.length, cachedPersons.length)
    })

    it('optional querystring stripeid (string)', async function () {
      await bundledData(this.test.currentRetry())
      const stripeAccountsNow = cachedResponses.stripeid
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
