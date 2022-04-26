/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')
const TestStripeAccounts = require('../../../../../test-stripe-accounts.js')

describe('/api/administrator/connect/persons-count', () => {
  before(TestHelper.disableMetrics)
  after(TestHelper.enableMetrics)
  describe('exceptions', function () {
    describe('invalid-stripe-account', () => {
      it('invalid Stripe account is individual', async () => {
        const administrator = await TestHelper.createOwner()
        const user = await TestStripeAccounts.createIndividualMissingIndividualDetails()
        const req = TestHelper.createRequest(`/api/administrator/connect/persons-count?stripeid=${user.stripeAccount.stripeid}`)
        req.account = administrator.account
        req.session = administrator.session
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
    it('optional querystring stripeid', async function () {
      const administrator = await TestHelper.createOwner()
      const user1 = await TestStripeAccounts.createCompanyWithDirectors('DE', 2)
      await TestStripeAccounts.createCompanyWithDirectors('DE', 1)
      const req = TestHelper.createRequest(`/api/administrator/connect/persons-count?stripeid=${user1.stripeAccount.stripeid}`)
      req.account = administrator.account
      req.session = administrator.session
      const result = await req.get()
      assert.strictEqual(result, 2)
    })
  })

  describe('returns', () => {
    it('integer', async () => {
      const administrator = await TestHelper.createOwner()
      for (let i = 0, len = global.pageSize + 1; i < len; i++) {
        await TestStripeAccounts.createCompanyWithDirectors('DE', 1)
      }
      const req = TestHelper.createRequest('/api/administrator/connect/persons-count')
      req.account = administrator.account
      req.session = administrator.session
      req.filename = __filename
      req.saveResponse = true
      const result = await req.get()
      assert.strictEqual(result, global.pageSize + 1)
    })
  })
})
