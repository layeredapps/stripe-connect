/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')
const TestStripeAccounts = require('../../../../../test-stripe-accounts.js')

describe('/api/user/connect/set-stripe-account-submitted', function () {
  describe('exceptions', () => {
    describe('invalid-stripeid', () => {
      it('missing querystring stripeid', async () => {
        const user = await TestHelper.createUser()
        const req = TestHelper.createRequest('/api/user/connect/set-stripe-account-submitted')
        req.account = user.account
        req.session = user.session
        let errorMessage
        try {
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-stripeid')
      })

      it('invalid querystring stripeid', async () => {
        const user = await TestHelper.createUser()
        const req = TestHelper.createRequest('/api/user/connect/set-stripe-account-submitted?stripeid=invalid')
        req.account = user.account
        req.session = user.session
        let errorMessage
        try {
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-stripeid')
      })
    })

    describe('invalid-stripe-account', () => {
      it('ineligible stripe account is submitted', async () => {
        const user = await TestStripeAccounts.createSubmittedIndividual('NZ')
        const req = TestHelper.createRequest(`/api/user/connect/set-stripe-account-submitted?stripeid=${user.stripeAccount.stripeid}`)
        req.account = user.account
        req.session = user.session
        let errorMessage
        try {
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-stripe-account')
      })
    })

    describe('invalid-account', () => {
      it('ineligible accessing account', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'DE',
          business_type: 'company'
        })
        const user2 = await TestHelper.createUser()
        const req = TestHelper.createRequest(`/api/user/connect/set-stripe-account-submitted?stripeid=${user.stripeAccount.stripeid}`)
        req.account = user2.account
        req.session = user2.session
        let errorMessage
        try {
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-account')
      })
    })

    describe('invalid-payment-details', () => {
      it('ineligible Stripe account missing payment details', async () => {
        const user = await TestStripeAccounts.createCompanyMissingPaymentDetails('US')
        const req = TestHelper.createRequest(`/api/user/connect/set-stripe-account-submitted?stripeid=${user.stripeAccount.stripeid}`)
        req.account = user.account
        req.session = user.session
        let errorMessage
        try {
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-payment-details')
      })
    })

    describe('invalid-registration', () => {
      it('ineligible Stripe account missing information', async () => {
        const user = await TestStripeAccounts.createIndividualMissingIndividualDetails('US')
        const req = TestHelper.createRequest(`/api/user/connect/set-stripe-account-submitted?stripeid=${user.stripeAccount.stripeid}`)
        req.account = user.account
        req.session = user.session
        let errorMessage
        try {
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-registration')
      })
    })

    describe('invalid-person', () => {
      it('ineligible company person missing information', async () => {
        const user = await TestStripeAccounts.createCompanyMissingPaymentDetails('US')
        const req = TestHelper.createRequest(`/api/user/connect/set-stripe-account-submitted?stripeid=${user.stripeAccount.stripeid}`)
        req.account = user.account
        req.session = user.session
        let errorMessage
        try {
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-payment-details')
      })
    })
  })

  describe('returns', () => {
    it('object (individual)', async () => {
      const user = await TestStripeAccounts.createIndividualReadyForSubmission('US')
      assert.strictEqual(user.stripeAccount.submittedAt, undefined)
      const req = TestHelper.createRequest(`/api/user/connect/set-stripe-account-submitted?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      const stripeAccountNow = await req.patch()
      assert.notStrictEqual(stripeAccountNow.submittedAt, undefined)
      assert.notStrictEqual(stripeAccountNow.submittedAt, null)
    })

    it('object (company)', async () => {
      const user = await TestStripeAccounts.createCompanyReadyForSubmission('AU')
      assert.strictEqual(user.stripeAccount.submittedAt, undefined)
      const req = TestHelper.createRequest(`/api/user/connect/set-stripe-account-submitted?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      const stripeAccountNow = await req.patch()
      assert.notStrictEqual(stripeAccountNow.submittedAt, undefined)
      assert.notStrictEqual(stripeAccountNow.submittedAt, null)
    })
  })
})
