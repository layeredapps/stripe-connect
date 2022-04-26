/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')

describe('/api/administrator/connect/set-stripe-account-rejected', function () {
  before(TestHelper.disableMetrics)
  after(TestHelper.enableMetrics)
  describe('exceptions', () => {
    describe('invalid-stripeid', () => {
      it('missing querystring stripeid', async () => {
        const administrator = await TestHelper.createOwner()
        const req = TestHelper.createRequest('/api/administrator/connect/set-stripe-account-rejected')
        req.account = administrator.account
        req.session = administrator.session
        req.body = {
          reason: 'fraud'
        }
        let errorMessage
        try {
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-stripeid')
      })

      it('invalid querystring stripeid', async () => {
        const administrator = await TestHelper.createOwner()
        const req = TestHelper.createRequest('/api/administrator/connect/set-stripe-account-rejected?stripeid=invalid')
        req.account = administrator.account
        req.session = administrator.session
        req.body = {
          reason: 'fraud'
        }
        let errorMessage
        try {
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-stripeid')
      })
    })

    describe('invalid-reason', () => {
      it('missing posted reason', async () => {
        const administrator = await TestHelper.createOwner()
        const req = TestHelper.createRequest('/api/administrator/connect/set-stripe-account-rejected?stripeid=invalid')
        req.account = administrator.account
        req.session = administrator.session
        req.body = {
          reason: ''
        }
        let errorMessage
        try {
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-reason')
      })

      it('invalid posted reason', async () => {
        const administrator = await TestHelper.createOwner()
        const req = TestHelper.createRequest('/api/administrator/connect/set-stripe-account-rejected?stripeid=invalid')
        req.account = administrator.account
        req.session = administrator.session
        req.body = {
          reason: 'invalid'
        }
        let errorMessage
        try {
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-reason')
      })
    })
  })

  describe('returns', () => {
    it('boolean', async () => {
      const administrator = await TestHelper.createOwner()
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'DE',
        business_type: 'company'
      })
      const req = TestHelper.createRequest(`/api/administrator/connect/set-stripe-account-rejected?stripeid=${user.stripeAccount.stripeid}`)
      req.account = administrator.account
      req.session = administrator.session
      req.filename = __filename
      req.saveResponse = true
      req.body = {
        reason: 'fraud'
      }
      const accountNow = await req.patch()
      assert.strictEqual(accountNow.stripeObject.requirements.disabled_reason, 'rejected.fraud')
    })
  })
})
