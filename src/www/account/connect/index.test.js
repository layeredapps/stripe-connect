/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')

describe('/account/connect', () => {
  describe('before', () => {
    it('should bind data to req', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'US',
        business_type: 'individual'
      })
      const req = TestHelper.createRequest('/account/connect')
      req.account = user.account
      req.session = user.session
      await req.route.api.before(req)
      assert.strictEqual(req.data.stripeAccounts[0].id, user.stripeAccount.stripeid)
    })
  })

  describe('view', () => {
    it('should have row for each Stripe account (screenshots)', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'US',
        business_type: 'individual'
      })
      const req = TestHelper.createRequest('/account/connect')
      req.account = user.account
      req.session = user.session
      req.filename = __filename
      req.screenshots = [
        { hover: '#account-menu-container' },
        { click: '/account/connect' }
      ]
      global.pageSize = 50
      const result = await req.get()
      const doc = TestHelper.extractDoc(result.html)
      const row = doc.getElementById(user.stripeAccount.stripeid)
      assert.strictEqual(row.tag, 'tr')
    })
  })
})
