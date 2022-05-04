/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')
const DashboardTestHelper = require('@layeredapps/dashboard/test-helper.js')

describe('/account/connect/persons', function () {
  let cachedResponses, cachedRepresentative, cachedPersons, cachedDirectors, cachedOwners
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
    cachedDirectors = []
    cachedOwners = []
    await DashboardTestHelper.setupBeforeEach()
    await TestHelper.setupBeforeEach()
    const user = await TestHelper.createUser()
    await TestHelper.createStripeAccount(user, {
      country: 'AT',
      business_type: 'company'
    })
    cachedRepresentative = await TestHelper.createPerson(user, {
      relationship_representative: 'true',
      relationship_executive: 'true',
      relationship_title: 'SVP Testing',
      relationship_percent_ownership: '0'
    })
    for (let i = 0, len = 2; i < len; i++) {
      await TestHelper.createPerson(user, {
        relationship_director: 'true',
        relationship_executive: 'true',
        relationship_title: 'SVP Testing',
        relationship_percent_ownership: '0'
      })
      cachedDirectors.unshift(user.director.personid)
      cachedPersons.unshift(user.director.personid)
      await TestHelper.createPerson(user, {
        relationship_owner: 'true',
        relationship_executive: 'true',
        relationship_title: 'SVP Testing',
        relationship_percent_ownership: '11'
      })
      cachedOwners.unshift(user.owner.personid)
      cachedPersons.unshift(user.owner.personid)
    }
    const req1 = TestHelper.createRequest(`/account/connect/persons?stripeid=${user.stripeAccount.stripeid}`)
    req1.account = user.account
    req1.session = user.session
    req1.filename = __filename
    req1.screenshots = [
      { hover: '#account-menu-container' },
      { click: '/account/connect' },
      { click: '/account/connect/stripe-accounts' },
      { click: `/account/connect/stripe-account?stripeid=${user.stripeAccount.stripeid}` },
      { click: `/account/connect/persons?stripeid=${user.stripeAccount.stripeid}` }
    ]
    global.pageSize = 50
    await req1.route.api.before(req1)
    cachedResponses.before = req1.data
    cachedResponses.returns = await req1.get()
    cachedResponses.finished = true
  }
  describe('before', () => {
    it('should bind data to req', async function () {
      await bundledData(this.test.currentRetry())
      const data = cachedResponses.before
      assert.strictEqual(data.owners.length, 2)
      assert.strictEqual(data.directors.length, 2)
      assert.strictEqual(data.representatives.length, 1)
    })
  })

  describe('view', () => {
    it('should have row for each owner (screenshots)', async function () {
      await bundledData(this.test.currentRetry())
      const result = await cachedResponses.returns
      const doc = TestHelper.extractDoc(result.html)
      const row = doc.getElementById(cachedOwners[0])
      assert.strictEqual(row.tag, 'tr')
    })

    it('should have row for each director', async function () {
      await bundledData(this.test.currentRetry())
      const result = await cachedResponses.returns
      const doc = TestHelper.extractDoc(result.html)
      const row = doc.getElementById(cachedDirectors[0])
      assert.strictEqual(row.tag, 'tr')
    })

    it('should have row for each representative', async function () {
      await bundledData(this.test.currentRetry())
      const result = await cachedResponses.returns
      const doc = TestHelper.extractDoc(result.html)
      const row = doc.getElementById(cachedRepresentative.personid)
      assert.strictEqual(row.tag, 'tr')
    })
  })

  describe('errors', () => {
    it('invalid-stripeid', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest('/account/connect/persons?stripeid=invalid')
      req.account = user.account
      req.session = user.session
      await req.route.api.before(req)
      assert.strictEqual(req.error, 'invalid-stripeid')
    })

    it('invalid-stripe-account', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'US',
        business_type: 'individual'
      })
      const req = TestHelper.createRequest(`/account/connect/persons?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      await req.route.api.before(req)
      assert.strictEqual(req.error, 'invalid-stripe-account')
    })
  })
})
