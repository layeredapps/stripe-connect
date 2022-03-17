/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')
const TestStripeAccounts = require('../../../../../test-stripe-accounts.js')

describe('/api/user/connect/payout', function () {
  describe('exceptions', () => {
    describe('invalid-payoutid', () => {
      it('missing querystring payoutid', async () => {
        const user = await TestHelper.createUser()
        const req = TestHelper.createRequest('/api/user/connect/payout')
        req.account = user.account
        req.session = user.session
        let errorMessage
        try {
          await req.get()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-payoutid')
      })

      it('invalid querystring payoutid', async () => {
        const user = await TestHelper.createUser()
        const req = TestHelper.createRequest('/api/user/connect/payout?payoutid=invalid')
        req.account = user.account
        req.session = user.session
        let errorMessage
        try {
          await req.get()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-payoutid')
      })
    })

    describe('invalid-account', function () {
      it('ineligible accessing account', async () => {
        const user = await TestStripeAccounts.createSubmittedIndividual('NZ')
        await TestHelper.createPayout(user)
        const user2 = await TestHelper.createUser()
        const req = TestHelper.createRequest(`/api/user/connect/payout?payoutid=${user.payout.payoutid}`)
        req.account = user2.account
        req.session = user2.session
        let errorMessage
        try {
          await req.get()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-account')
      })
    })
  })

  describe('returns', function () {
    it('object', async () => {
      const user = await TestStripeAccounts.createSubmittedIndividual('NZ')
      await TestHelper.createPayout(user)
      const req = TestHelper.createRequest(`/api/user/connect/payout?payoutid=${user.payout.payoutid}`)
      req.account = user.account
      req.session = user.session
      req.filename = __filename
      req.saveResponse = true
      const payout = await req.get()
      assert.strictEqual(payout.payoutid, user.payout.payoutid)
    })
  })
})
