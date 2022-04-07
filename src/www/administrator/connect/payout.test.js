/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')
const DashboardTestHelper = require('@layeredapps/dashboard/test-helper.js')
const TestStripeAccounts = require('../../../../test-stripe-accounts.js')

describe('/administrator/connect/payout', function () {
  let cachedResponses
  async function bundledData () {
    if (cachedResponses && cachedResponses.finished) {
      return
    }
    cachedResponses = {}
    await DashboardTestHelper.setupBeforeEach()
    await TestHelper.setupBeforeEach()
    const administrator = await TestHelper.createOwner()
    const user = await TestStripeAccounts.createSubmittedIndividual('NZ')
    await TestHelper.createPayout(user)
    await TestStripeAccounts.waitForWebhook('payout.created', (stripeEvent) => {
      return stripeEvent.data.object.id === user.payout.payoutid
    })
    const req = TestHelper.createRequest(`/administrator/connect/payout?payoutid=${user.payout.payoutid}`)
    req.account = administrator.account
    req.session = administrator.session
    await req.route.api.before(req)
    cachedResponses.before = req.data
    req.filename = __filename
    req.screenshots = [
      { hover: '#administrator-menu-container' },
      { click: '/administrator/connect' },
      { click: '/administrator/connect/payouts' },
      { click: `/administrator/connect/payout?payoutid=${user.payout.payoutid}` }
    ]
    cachedResponses.view = await req.get()
    cachedResponses.finished = true
  }

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
      await bundledData()
      const data = cachedResponses.before
      assert.strictEqual(data.payout.object, 'payout')
    })
  })

  describe('view', () => {
    it('should have row for payout (screenshots)', async () => {
      await bundledData()
      const result = cachedResponses.view
      const doc = TestHelper.extractDoc(result.html)
      const table = doc.getElementById('payouts-table')
      assert.strictEqual(table.tag, 'table')
    })
  })
})
