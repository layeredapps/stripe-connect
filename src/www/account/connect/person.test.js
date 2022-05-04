/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')
const DashboardTestHelper = require('@layeredapps/dashboard/test-helper.js')
const TestStripeAccounts = require('../../../../test-stripe-accounts.js')

describe('/account/connect/person', function () {
  let cachedResponses
  async function bundledData (retryNumber) {
    if (retryNumber > 0) {
      cachedResponses = {}
      await TestHelper.rotateWebhook(true)
    }
    if (cachedResponses && cachedResponses.finished) {
      return
    }
    cachedResponses = {}
    await DashboardTestHelper.setupBeforeEach()
    await TestHelper.setupBeforeEach()
    const user = await TestStripeAccounts.createCompanyWithOwners('AT', 1)
    let req = TestHelper.createRequest(`/account/connect/person?personid=${user.owner.personid}`)
    req.account = user.account
    req.session = user.session
    // before
    await req.route.api.before(req)
    cachedResponses.before = req.data
    cachedResponses.owner = await req.get()
    // view
    req.filename = __filename
    req.screenshots = [
      { hover: '#account-menu-container' },
      { click: '/account/connect' },
      { click: '/account/connect/stripe-accounts' },
      { click: `/account/connect/stripe-account?stripeid=${user.stripeAccount.stripeid}` },
      { click: `/account/connect/persons?stripeid=${user.stripeAccount.stripeid}` },
      { click: `/account/connect/person?personid=${user.owner.personid}` }
    ]
    global.pageSize = 50
    cachedResponses.view = await req.get()
    // representative
    await TestHelper.createPerson(user, {
      relationship_representative: 'true',
      relationship_title: 'Shareholder',
      relationship_percent_ownership: '10'
    })
    req = TestHelper.createRequest(`/account/connect/person?personid=${user.representative.personid}`)
    req.account = user.account
    req.session = user.session
    cachedResponses.representative = await req.get()
    // director
    await TestHelper.createPerson(user, {
      relationship_director: 'true',
      relationship_executive: 'true',
      relationship_title: 'Shareholder',
      relationship_percent_ownership: '0'
    })
    req = TestHelper.createRequest(`/account/connect/person?personid=${user.director.personid}`)
    req.account = user.account
    req.session = user.session
    cachedResponses.director = await req.get()
    const directorData = TestStripeAccounts.createPersonData(TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country, user.director.stripeObject)
    await TestHelper.updatePerson(user, user.director, directorData)
    await TestStripeAccounts.waitForPersonFieldToLeave(user, 'director', 'address.city')
    await TestStripeAccounts.waitForPersonField(user, 'director', 'verification.document')
    await TestStripeAccounts.waitForPersonField(user, 'director', 'verification.additional_document')
    const directorUploadData = TestStripeAccounts.createPersonUploadData(user.director.stripeObject)
    if (directorUploadData && Object.keys(directorUploadData).length) {
      await TestHelper.updatePerson(user, user.director, {}, directorUploadData)
      await TestStripeAccounts.waitForPersonFieldToLeave(user, 'director', 'verification.document')
    }
    cachedResponses.directorComplete = await req.get()
    cachedResponses.finished = true
  }

  describe('before', () => {
    it('should bind data to req', async function () {
      await bundledData(this.test.currentRetry())
      const data = cachedResponses.before
      assert.strictEqual(data.person.object, 'person')
    })
  })

  describe('view', () => {
    it('should show table for person (screenshots)', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.view
      const doc = TestHelper.extractDoc(result.html)
      const table = doc.getElementById('persons-table')
      assert.strictEqual(table.tag, 'table')
    })

    it('should show person is representative', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.representative
      const doc = TestHelper.extractDoc(result.html)
      const cell = doc.getElementById('representative')
      assert.strictEqual(cell.tag, 'tr')
    })

    it('should show person is owner', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.owner
      const doc = TestHelper.extractDoc(result.html)
      const cell = doc.getElementById('owner')
      assert.strictEqual(cell.tag, 'tr')
    })

    it('should show person is director', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.director
      const doc = TestHelper.extractDoc(result.html)
      const cell = doc.getElementById('director')
      assert.strictEqual(cell.tag, 'tr')
    })

    it('should show person requires additional information', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.director
      const doc = TestHelper.extractDoc(result.html)
      const row = doc.getElementById('requires-information')
      assert.strictEqual(row.tag, 'tr')
    })

    it('should show no additional information required', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.directorComplete
      const doc = TestHelper.extractDoc(result.html)
      const row = doc.getElementById('requires-information')
      assert.strictEqual(row, undefined)
    })
  })

  describe('errors', () => {
    it('invalid-personid', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest('/account/connect/person?personid=invalid')
      req.account = user.account
      req.session = user.session
      await req.route.api.before(req)
      assert.strictEqual(req.error, 'invalid-personid')
    })
  })
})
