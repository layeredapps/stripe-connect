/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')
const TestStripeAccounts = require('../../../../test-stripe-accounts.js')

describe('/account/connect/submit-stripe-account', function () {
  describe('exceptions', () => {
    it('should reject invalid stripeid', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest('/account/connect/submit-stripe-account?stripeid=invalid')
      req.account = user.account
      req.session = user.session
      let errorMessage
      try {
        await req.route.api.before(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-stripeid')
    })
  })

  describe('before', () => {
    it('should bind data to req', async () => {
      const user = await TestStripeAccounts.createCompanyReadyForSubmission('NZ')
      const req = TestHelper.createRequest(`/account/connect/submit-stripe-account?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      await req.route.api.before(req)
      assert.strictEqual(req.data.stripeAccount.id, user.stripeAccount.stripeid)
    })
  })

  describe('view', () => {
    it('should reject registration that hasn\'t submitted payment details', async () => {
      const user = await TestStripeAccounts.createCompanyMissingPaymentDetails('NZ')
      const req = TestHelper.createRequest(`/account/connect/submit-stripe-account?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      const result = await req.get()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-payment-details')
    })

    it('should reject company that hasn\'t submitted company owners', async () => {
      const user = await TestStripeAccounts.createCompanyMissingOwners('DE')
      const req = TestHelper.createRequest(`/account/connect/submit-stripe-account?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      const result = await req.get()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-company-owners')
    })

    it('should reject company that hasn\'t submitted company directors', async () => {
      const user = await TestStripeAccounts.createCompanyMissingDirectors('DE')
      const req = TestHelper.createRequest(`/account/connect/submit-stripe-account?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      const result = await req.get()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-company-directors')
    })

    it('should reject company that hasn\'t submitted representative information', async () => {
      const user = await TestStripeAccounts.createCompanyMissingRepresentative('DE')
      const req = TestHelper.createRequest(`/account/connect/submit-stripe-account?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      const result = await req.get()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-company-representative')
    })

    it('should reject company that hasn\'t submitted information', async () => {
      const user = await TestStripeAccounts.createCompanyMissingCompanyDetails('AU')
      const req = TestHelper.createRequest(`/account/connect/submit-stripe-account?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      const result = await req.get()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-registration')
    })

    it('should reject individual that hasn\'t submitted information', async () => {
      const user = await TestStripeAccounts.createIndividualMissingIndividualDetails('DE')
      const req = TestHelper.createRequest(`/account/connect/submit-stripe-account?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      const result = await req.get()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-registration')
    })

    it('should present the form (individual)', async () => {
      const user = await TestStripeAccounts.createIndividualReadyForSubmission('BE')
      const req = TestHelper.createRequest(`/account/connect/submit-stripe-account?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      const result = await req.get()
      const doc = TestHelper.extractDoc(result.html)
      assert.strictEqual(doc.getElementById('submit-form').tag, 'form')
      assert.strictEqual(doc.getElementById('submit-button').tag, 'button')
    })

    it('should present the form (company)', async () => {
      const user = await TestStripeAccounts.createCompanyReadyForSubmission('BE')
      const req = TestHelper.createRequest(`/account/connect/submit-stripe-account?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      const result = await req.get()
      const doc = TestHelper.extractDoc(result.html)
      assert.strictEqual(doc.getElementById('submit-form').tag, 'form')
      assert.strictEqual(doc.getElementById('submit-button').tag, 'button')
    })
  })

  describe('submit', () => {
    it('should submit registration (company) (screenshots)', async () => {
      const user = await TestStripeAccounts.createCompanyReadyForSubmission('LT')
      const req = TestHelper.createRequest(`/account/connect/submit-stripe-account?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      req.body = {}
      req.filename = __filename
      req.screenshots = [
        { hover: '#account-menu-container' },
        { click: '/account/connect' },
        { click: `/account/connect/stripe-account?stripeid=${user.stripeAccount.stripeid}` },
        { click: `/account/connect/submit-stripe-account?stripeid=${user.stripeAccount.stripeid}` },
        { fill: '#submit-form' }
      ]
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })

    it('should submit registration (individual)', async () => {
      const user = await TestStripeAccounts.createIndividualReadyForSubmission('GB')
      const req = TestHelper.createRequest(`/account/connect/submit-stripe-account?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      req.body = {}
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })
  })
})
