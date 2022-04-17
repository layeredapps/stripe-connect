/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')
const TestStripeAccounts = require('../../../../test-stripe-accounts.js')
const ScreenshotData = require('../../../../screenshot-data.js')

describe('/administrator/connect', function () {
  describe('before', () => {
    it('should bind data to req', async () => {
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
      assert.strictEqual(req.data.stripeAccounts[0].id, user.stripeAccount.stripeid)
    })
  })

  describe('view', () => {
    it('should have chart for Stripe registrations (screenshots)', async () => {
      const administrator = await TestHelper.createOwner()
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'US',
        business_type: 'individual'
      })
      const req = TestHelper.createRequest('/administrator/connect')
      req.account = administrator.account
      req.session = administrator.session
      req.filename = __filename
      req.screenshots = [
        { hover: '#administrator-menu-container' },
        { click: '/administrator/connect' }
      ]
      global.pageSize = 50
      global.packageJSON.dashboard.server.push(ScreenshotData.administratorIndex)
      const result = await req.get()
      const doc = TestHelper.extractDoc(result.html)
      const container = doc.getElementById('created-chart-container')
      assert.strictEqual(container.tag, 'div')
    })

    it('should have chart for accepted Stripe registrations', async () => {
      const administrator = await TestHelper.createOwner()
      await TestStripeAccounts.createSubmittedIndividual('NZ')
      const req = TestHelper.createRequest('/administrator/connect')
      req.account = administrator.account
      req.session = administrator.session
      const result = await req.get()
      const doc = TestHelper.extractDoc(result.html)
      const container = doc.getElementById('approved-chart-container')
      assert.strictEqual(container.tag, 'div')
    })

    it('should have chart for payouts', async () => {
      const administrator = await TestHelper.createOwner()
      const user = await TestStripeAccounts.createSubmittedIndividual('NZ')
      await TestHelper.createPayout(user)
      const req = TestHelper.createRequest('/administrator/connect')
      req.account = administrator.account
      req.session = administrator.session
      const result = await req.get()
      const doc = TestHelper.extractDoc(result.html)
      const container = doc.getElementById('payouts-chart-container')
      assert.strictEqual(container.tag, 'div')
    })
  })
})
