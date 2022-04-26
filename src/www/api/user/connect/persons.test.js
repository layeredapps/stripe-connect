
/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')
const DashboardTestHelper = require('@layeredapps/dashboard/test-helper.js')

describe('/api/user/connect/persons', function () {
  before(TestHelper.disableMetrics)
  after(TestHelper.enableMetrics)
  let cachedResponses, cachedPersons
  async function bundledData (retryNumber) {
    if (retryNumber > 0) {
      cachedResponses = {}
      await TestHelper.rotateWebhook(true)
    }
    if (cachedResponses && cachedResponses.finished) {
      return
    }
    cachedResponses = {}
    cachedPersons = []
    await DashboardTestHelper.setupBeforeEach()
    await TestHelper.setupBeforeEach()
    const user = await TestHelper.createUser()
    await TestHelper.createStripeAccount(user, {
      country: 'AT',
      business_type: 'company'
    })
    await TestHelper.createPerson(user, {
      relationship_representative: 'true',
      relationship_executive: 'true',
      relationship_title: 'SVP Testing',
      relationship_percent_ownership: '0'
    })
    cachedPersons.unshift(user.representative.personid)
    for (let i = 0, len = 2; i < len; i++) {
      await TestHelper.createPerson(user, {
        relationship_director: 'true',
        relationship_executive: 'true',
        relationship_title: 'SVP Testing',
        relationship_percent_ownership: '0'
      })
      cachedPersons.unshift(user.director.personid)
      await TestHelper.createPerson(user, {
        relationship_owner: 'true',
        relationship_executive: 'true',
        relationship_title: 'SVP Testing',
        relationship_percent_ownership: '11'
      })
      cachedPersons.unshift(user.owner.personid)
    }
    const req1 = TestHelper.createRequest(`/api/user/connect/persons?stripeid=${user.stripeAccount.stripeid}`)
    req1.account = user.account
    req1.session = user.session
    cachedResponses.returns = await req1.get()
    global.pageSize = 3
    cachedResponses.pageSize = await req1.get()
    global.pageSize = 2
    const req2 = TestHelper.createRequest(`/api/user/connect/persons?stripeid=${user.stripeAccount.stripeid}&offset=1`)
    req2.account = user.account
    req2.session = user.session
    cachedResponses.offset = await req2.get()
    const req3 = TestHelper.createRequest(`/api/user/connect/persons?stripeid=${user.stripeAccount.stripeid}&limit=1`)
    req3.account = user.account
    req3.session = user.session
    cachedResponses.limit = await req3.get()
    const req4 = TestHelper.createRequest(`/api/user/connect/persons?stripeid=${user.stripeAccount.stripeid}&all=true`)
    req4.account = user.account
    req4.session = user.session
    cachedResponses.all = await req4.get()
    cachedResponses.finished = true
  }
  beforeEach(async function () {
    try {
      await bundledData()
    } catch (error) {
      for (const key in cachedResponses) {
        delete (cachedResponses[key])
      }
      cachedPersons.length = 0
    }
  })
  describe('exceptions', () => {
    describe('invalid-stripeid', () => {
      it('missing querystring stripeid', async function () {
        await bundledData(this.test.currentRetry())
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'US',
          business_type: 'individual'
        })
        const req = TestHelper.createRequest('/api/user/connect/persons')
        req.account = user.account
        req.session = user.session
        let errorMessage
        try {
          await req.get()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-stripeid')
      })

      it('invalid querystring stripeid', async function () {
        await bundledData(this.test.currentRetry())
        const user = await TestHelper.createUser()
        const req = TestHelper.createRequest('/api/user/connect/persons?stripeid=invalid')
        req.account = user.account
        req.session = user.session
        let errorMessage
        try {
          await req.get()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-stripeid')
      })
    })

    describe('invalid-account', () => {
      it('ineligible accessing account', async function () {
        await bundledData(this.test.currentRetry())
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'US',
          business_type: 'company'
        })
        const user2 = await TestHelper.createUser()
        const req = TestHelper.createRequest(`/api/user/connect/persons?stripeid=${user.stripeAccount.stripeid}`)
        req.account = user2.account
        req.session = user2.session
        let errorMessage
        try {
          await req.get()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-account')
      })
    })

    describe('invalid-stripe-account', () => {
      it('ineligible stripe account for individual', async function () {
        await bundledData(this.test.currentRetry())
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'US',
          business_type: 'individual'
        })
        const req = TestHelper.createRequest(`/api/user/connect/persons?stripeid=${user.stripeAccount.stripeid}`)
        req.account = user.account
        req.session = user.session
        let errorMessage
        try {
          await req.get()
        } catch (error) {
          errorMessage = error.message
        }
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
      const personsNow = cachedResponses.limit
      assert.strictEqual(personsNow.length, limit)
    })

    it('optional querystring all (boolean)', async function () {
      await bundledData(this.test.currentRetry())
      const personsNow = cachedResponses.all
      assert.strictEqual(personsNow.length, cachedPersons.length)
    })
  })

  describe('returns', function () {
    it('array', async function () {
      await bundledData(this.test.currentRetry())
      const persons = cachedResponses.returns
      assert.strictEqual(persons.length, global.pageSize)
    })
  })

  describe('configuration', function () {
    it('environment PAGE_SIZE', async function () {
      await bundledData(this.test.currentRetry())
      const persons = cachedResponses.pageSize
      assert.strictEqual(persons.length, global.pageSize + 1)
    })
  })
})
