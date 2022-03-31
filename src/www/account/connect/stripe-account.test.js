/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')
const TestStripeAccounts = require('../../../../test-stripe-accounts.js')

describe('/account/connect/stripe-account', () => {
  describe('before', () => {
    it('should reject invalid stripeid', async () => {
      const administrator = await TestHelper.createOwner()
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'US',
        business_type: 'individual'
      })
      const req = TestHelper.createRequest('/account/connect/stripe-account?stripeid=invalid')
      req.account = administrator.account
      req.session = administrator.session
      let errorMessage
      try {
        await req.route.api.before(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-stripeid')
    })

    it('should reject other account\'s stripeid', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'US',
        business_type: 'individual'
      })
      const user2 = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/account/connect/stripe-account?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user2.account
      req.session = user2.session
      let errorMessage
      try {
        await req.route.api.before(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-account')
    })

    it('should bind data to req', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'US',
        business_type: 'individual'
      })
      const req = TestHelper.createRequest(`/account/connect/stripe-account?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      await req.route.api.before(req)
      assert.strictEqual(req.data.stripeAccount.id, user.stripeAccount.stripeid)
    })
  })

  describe('view', () => {
    it('should show registration unstarted (screenshots)', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'US',
        business_type: 'individual'
      })
      const req = TestHelper.createRequest(`/account/connect/stripe-account?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      req.filename = __filename
      req.screenshots = [
        { hover: '#account-menu-container' },
        { click: '/account/connect' },
        { click: '/account/connect/stripe-accounts' },
        { click: `/account/connect/stripe-account?stripeid=${user.stripeAccount.stripeid}` }
      ]
      const result = await req.get()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('account-status')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'unstarted-registration')
    })

    it('should show registration completed', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'US',
        business_type: 'individual'
      })
      await TestStripeAccounts.waitForAccountField(user, 'individual.first_name')
      const accountData = TestStripeAccounts.createAccountData(user.profile, user.stripeAccount.stripeObject.country, user.stripeAccount.stripeObject)
      await TestHelper.updateStripeAccount(user, accountData)
      await TestStripeAccounts.waitForAccountFieldToLeave(user, 'individual.first_name')
      const req = TestHelper.createRequest(`/account/connect/stripe-account?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      const result = await req.get()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('account-status')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'completed-registration')
    })

    it('should show payment information required', async () => {
      const user = await TestStripeAccounts.createCompanyMissingPaymentDetails('US')
      const req = TestHelper.createRequest(`/account/connect/stripe-account?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      const result = await req.get()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('payment-information-status')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'no-payment-information')
    })

    it('should show payment information created', async () => {
      const user = await TestStripeAccounts.createIndividualReadyForSubmission('US')
      const req = TestHelper.createRequest(`/account/connect/stripe-account?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      const result = await req.get()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('payment-information-status')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'payment-information')
    })

    it('should show ready to submit', async () => {
      const user = await TestStripeAccounts.createIndividualReadyForSubmission('US')
      const req = TestHelper.createRequest(`/account/connect/stripe-account?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      const result = await req.get()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('submission-status')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'not-submitted-information')
    })

    it('should show registration is submitted', async () => {
      const user = await TestStripeAccounts.createSubmittedCompany('NZ')
      const req = TestHelper.createRequest(`/account/connect/stripe-account?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      const result = await req.get()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('submission-status')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'submitted-information')
    })
  })
})
