/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')
const TestStripeAccounts = require('../../../../test-stripe-accounts.js')

describe('/administrator/connect/payout', function () {
  describe('before', () => {
    it('should reject invalid payoutid', async () => {
      const administrator = await TestHelper.createOwner()
      const req = TestHelper.createRequest('/administrator/connect/payout?payoutid=invalid')
      req.account = administrator.account
      req.session = administrator.session
      let errorMessage
      try {
        await req.route.api.before(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-payoutid')
    })

    it('should bind data to req', async () => {
      const administrator = await TestHelper.createOwner()
      const user = await TestStripeAccounts.createSubmittedIndividual('NZ')
      await TestHelper.createPayout(user)
      await TestHelper.waitForPayout(user.payout.payoutid)
      const req = TestHelper.createRequest(`/administrator/connect/payout?payoutid=${user.payout.payoutid}`)
      req.account = administrator.account
      req.session = administrator.session
      await req.route.api.before(req)
      assert.strictEqual(req.data.payout.id, user.payout.payoutid)
    })
  })

  describe('view', () => {
    it('should have row for payout (screenshots)', async () => {
      const administrator = await TestHelper.createOwner()
      const user = await TestStripeAccounts.createSubmittedIndividual('NZ')
      await TestHelper.createPayout(user)
      await TestHelper.waitForPayout(user.payout.payoutid)
      const req = TestHelper.createRequest(`/administrator/connect/payout?payoutid=${user.payout.payoutid}`)
      req.account = administrator.account
      req.session = administrator.session
      req.filename = __filename
      req.screenshots = [
        { hover: '#administrator-menu-container' },
        { click: '/administrator/connect' },
        { click: '/administrator/connect/payouts' },
        { click: `/administrator/connect/payout?payoutid=${user.payout.payoutid}` }
      ]
      const result = await req.get()
      const doc = TestHelper.extractDoc(result.html)
      const row = doc.getElementById(user.payout.payoutid)
      assert.strictEqual(row.tag, 'tbody')
    })
  })
})
