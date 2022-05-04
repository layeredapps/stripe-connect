/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')
const TestStripeAccounts = require('../../../../test-stripe-accounts.js')
const DashboardTestHelper = require('@layeredapps/dashboard/test-helper.js')

describe('/account/connect/delete-person', function () {
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
    const user = await TestStripeAccounts.createCompanyWithOwners('DE', 1)
    const user2 = await TestHelper.createUser()
    let req = TestHelper.createRequest(`/account/connect/delete-person?personid=${user.owner.personid}`)
    req.account = user2.account
    req.session = user2.session
    await req.route.api.before(req)
    cachedResponses.invalidAccount = req.error
    req = TestHelper.createRequest(`/account/connect/delete-person?personid=${user.owner.personid}`)
    req.account = user.account
    req.session = user.session
    await req.route.api.before(req)
    cachedResponses.before = req.data
    cachedResponses.view = await req.get()
    req.filename = __filename
    req.screenshots = [
      { hover: '#account-menu-container' },
      { click: '/account/connect' },
      { click: '/account/connect/stripe-accounts' },
      { click: `/account/connect/stripe-account?stripeid=${user.stripeAccount.stripeid}` },
      { click: `/account/connect/persons?stripeid=${user.stripeAccount.stripeid}` },
      { click: `/account/connect/person?personid=${user.owner.personid}` },
      { click: `/account/connect/delete-person?personid=${user.owner.personid}` },
      { fill: '#submit-form' }
    ]
    cachedResponses.submit = await req.post()
    // csrf
    await TestHelper.createPerson(user, {
      relationship_director: 'true',
      relationship_title: 'SVP Testing',
      relationship_percent_ownership: '0'
    })
    req = TestHelper.createRequest(`/account/connect/delete-person?personid=${user.director.personid}`)
    req.puppeteer = false
    req.account = user.account
    req.session = user.session
    cachedResponses.csrf = await req.post()
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
    it('should present the form', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.view
      const doc = TestHelper.extractDoc(result.html)
      assert.strictEqual(doc.getElementById('submit-form').tag, 'form')
      assert.strictEqual(doc.getElementById('submit-button').tag, 'button')
    })
  })

  describe('submit', () => {
    it('should delete person (screenshots)', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.submit
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })
  })

  describe('errors', () => {
    it('invalid-personid', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest('/account/connect/delete-person?personid=invalid')
      req.account = user.account
      req.session = user.session
      await req.route.api.before(req)
      assert.strictEqual(req.error, 'invalid-personid')
    })

    it('invalid-account', async function () {
      await bundledData(this.test.currentRetry())
      const errorMessage = cachedResponses.invalidAccount
      assert.strictEqual(errorMessage, 'invalid-account')
    })

    it('invalid-csrf-token', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.csrf
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-csrf-token')
    })
  })
})
