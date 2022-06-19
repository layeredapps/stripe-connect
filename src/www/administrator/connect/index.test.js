/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')
const TestStripeAccounts = require('../../../../test-stripe-accounts.js')
const ScreenshotData = require('../../../../screenshot-data.js')
const DashboardTestHelper = require('@layeredapps/dashboard/test-helper.js')

describe('/administrator/connect', function () {
  let cachedResponses
  async function bundledData (retryNumber) {
    if (retryNumber > 0) {
      cachedResponses = {}
    }
    if (cachedResponses && cachedResponses.finished) {
      return
    }
    cachedResponses = {}
    await DashboardTestHelper.setupBeforeEach()
    await TestHelper.setupBeforeEach()
    const administrator = await TestHelper.createOwner()
    const user = await TestHelper.createUser()
    await TestHelper.createStripeAccount(user, {
      country: 'US',
      business_type: 'individual'
    })
    const req = TestHelper.createRequest('/administrator/connect')
    req.account = administrator.account
    req.session = administrator.session
    await req.route.api.before(req)
    cachedResponses.before = req.data
    await TestStripeAccounts.createSubmittedIndividual('NZ')
    req.filename = __filename
    req.screenshots = [
      { hover: '#administrator-menu-container' },
      { click: '/administrator/connect' }
    ]
    global.pageSize = 50
    global.packageJSON.dashboard.server.push(ScreenshotData.administratorIndex)
    cachedResponses.view = await req.get()
    cachedResponses.finished = true
  }
  describe('before', () => {
    it('should bind data to req', async function () {
      await bundledData(this.test.currentRetry())
      const data = cachedResponses.before
      assert.strictEqual(data.stripeAccounts.length, 1)
      assert.strictEqual(data.stripeAccounts[0].object, 'account')
    })
  })

  describe('view', () => {
    it('should have chart for Stripe registrations (screenshots)', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.view
      const doc = TestHelper.extractDoc(result.html)
      const container = doc.getElementById('created-chart-container')
      assert.strictEqual(container.tag, 'div')
    })

    it('should have chart for accepted Stripe registrations', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.view
      const doc = TestHelper.extractDoc(result.html)
      const container = doc.getElementById('approved-chart-container')
      assert.strictEqual(container.tag, 'div')
    })

    it('should have chart for payouts', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.view
      const doc = TestHelper.extractDoc(result.html)
      const container = doc.getElementById('payouts-chart-container')
      assert.strictEqual(container.tag, 'div')
    })
  })
})
