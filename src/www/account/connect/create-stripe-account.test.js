/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')
const DashboardTestHelper = require('@layeredapps/dashboard/test-helper.js')

describe('/account/connect/create-stripe-account', () => {
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
    const user = await TestHelper.createUser()
    const req = TestHelper.createRequest('/account/connect/create-stripe-account')
    req.account = user.account
    req.session = user.session
    cachedResponses.view = await req.get()
    req.body = {
      business_type: 'company',
      country: process.env.GENERATE_COUNTRY || 'US'
    }
    req.filename = __filename
    req.screenshots = [
      { hover: '#account-menu-container' },
      { click: '/account/connect' },
      { click: '/account/connect/create-stripe-account' },
      { fill: '#submit-form' }
    ]
    cachedResponses.submit = await req.post()
    // csrf
    req.puppeteer = false
    req.body = {
      business_type: 'company',
      country: process.env.GENERATE_COUNTRY || 'US',
      'csrf-token': 'invalid'
    }
    cachedResponses.csrf = await req.post()
    cachedResponses.finished = true
  }

  describe('view', () => {
    it('should present the form', async function () {
      await bundledData(this.test.currentRetry())
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest('/account/connect/create-stripe-account')
      req.account = user.account
      req.session = user.session
      const result = await req.get()
      const doc = TestHelper.extractDoc(result.html)
      assert.strictEqual(doc.getElementById('submit-form').tag, 'form')
      assert.strictEqual(doc.getElementById('submit-button').tag, 'button')
    })
  })

  describe('submit', () => {
    it('should create Stripe account (screenshots)', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.submit
      const doc = TestHelper.extractDoc(result.html)
      const accountsTable = doc.getElementById('stripe-accounts-table')
      assert.notStrictEqual(accountsTable, undefined)
      assert.notStrictEqual(accountsTable, null)
    })
  })

  describe('errors', () => {
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
