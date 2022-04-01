/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')
const DashboardTestHelper = require('@layeredapps/dashboard/test-helper.js')
const TestStripeAccounts = require('../../../../test-stripe-accounts')

describe.only('/account/connect/submit-stripe-account', function () {
  const cachedResponses = {}
  before(async () => {
    console.log(1)
    await DashboardTestHelper.setupBeforeEach()
    await TestHelper.setupBeforeEach()
    const user = await TestStripeAccounts.createCompanyReadyForSubmission('NZ')
    console.log(2)
    // before
    let req = TestHelper.createRequest(`/account/connect/submit-stripe-account?stripeid=${user.stripeAccount.stripeid}`)
    req.account = user.account
    req.session = user.session
    cachedResponses.before = await req.route.api.before(req)
    console.log(3)
    // missing payment details
    const user2 = await TestStripeAccounts.createIndividualMissingPaymentDetails('NZ')
    req = TestHelper.createRequest(`/account/connect/submit-stripe-account?stripeid=${user2.stripeAccount.stripeid}`)
    req.account = user2.account
    req.session = user2.session
    cachedResponses.missingPayment = await req.get()
    console.log(4)
    // missing owners
    const user3 = await TestStripeAccounts.createCompanyMissingOwners('DE')
    req = TestHelper.createRequest(`/account/connect/submit-stripe-account?stripeid=${user3.stripeAccount.stripeid}`)
    req.account = user3.account
    req.session = user3.session
    cachedResponses.missingOwners = await req.get()
    console.log(5)
    // missing directors
    const user4 = await TestStripeAccounts.createCompanyMissingDirectors('DE')
    req = TestHelper.createRequest(`/account/connect/submit-stripe-account?stripeid=${user4.stripeAccount.stripeid}`)
    req.account = user4.account
    req.session = user4.session
    cachedResponses.missingDirectors = await req.get()
    console.log(6)
    // missing representative
    const user5 = await TestStripeAccounts.createCompanyMissingRepresentative('DE')
    req = TestHelper.createRequest(`/account/connect/submit-stripe-account?stripeid=${user5.stripeAccount.stripeid}`)
    req.account = user5.account
    req.session = user5.session
    cachedResponses.missingRepresentative = await req.get()
    console.log(7)
    // missing company information
    const user6 = await TestStripeAccounts.createCompanyMissingCompanyDetails('DE')
    req = TestHelper.createRequest(`/account/connect/submit-stripe-account?stripeid=${user6.stripeAccount.stripeid}`)
    req.account = user6.account
    req.session = user6.session
    cachedResponses.missingCompanyInformation = await req.get()
    console.log(8)
    // missing individual information
    const user7 = await TestStripeAccounts.createIndividualMissingIndividualDetails('DE')
    req = TestHelper.createRequest(`/account/connect/submit-stripe-account?stripeid=${user7.stripeAccount.stripeid}`)
    req.account = user7.account
    req.session = user7.session
    cachedResponses.missingIndividualInformation = await req.get()
    console.log(9)
    // company ready to submit
    req = TestHelper.createRequest(`/account/connect/submit-stripe-account?stripeid=${user.stripeAccount.stripeid}`)
    req.account = user.account
    req.session = user.session
    cachedResponses.companyForm = await req.get()
    console.log(10)
    // company submit
    req.filename = __filename
    req.screenshots = [
      { hover: '#account-menu-container' },
      { click: '/account/connect' },
      { click: `/account/connect/stripe-account?stripeid=${user.stripeAccount.stripeid}` },
      { click: `/account/connect/submit-stripe-account?stripeid=${user.stripeAccount.stripeid}` },
      { fill: '#submit-form' }
    ]
    cachedResponses.companySubmit = await req.post()
    console.log(11)
    // individual ready to submit
    await TestStripeAccounts.createIndividualReadyForSubmission('NZ', user)
    req.account = user.account
    req.session = user.session
    cachedResponses.individualForm = await req.get()
    cachedResponses.individualSubmit = await req.post()
  })
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
      const data = cachedResponses.before
      assert.strictEqual(data.stripeAccount.object, 'account')
    })
  })

  describe('view', () => {
    it('should reject registration that hasn\'t submitted payment details', async () => {
      const result = cachedResponses.missingPayment
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-payment-details')
    })

    it('should reject company that hasn\'t submitted company owners', async () => {
      const result = cachedResponses.missingOwners
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-company-owners')
    })

    it('should reject company that hasn\'t submitted company directors', async () => {
      const result = cachedResponses.missingDirectors
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-company-directors')
    })

    it('should reject company that hasn\'t submitted representative information', async () => {
      const result = cachedResponses.missingRepresentative
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-company-representative')
    })

    it('should reject company that hasn\'t submitted information', async () => {
      const result = cachedResponses.missingCompanyInformation
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-registration')
    })

    it('should reject individual that hasn\'t submitted information', async () => {
      const result = cachedResponses.missingIndividualInformation
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-registration')
    })

    it('should present the form (individual)', async () => {
      const result = cachedResponses.individualForm
      const doc = TestHelper.extractDoc(result.html)
      assert.strictEqual(doc.getElementById('submit-form').tag, 'form')
      assert.strictEqual(doc.getElementById('submit-button').tag, 'button')
    })

    it('should present the form (company)', async () => {
      const result = cachedResponses.companyForm
      const doc = TestHelper.extractDoc(result.html)
      assert.strictEqual(doc.getElementById('submit-form').tag, 'form')
      assert.strictEqual(doc.getElementById('submit-button').tag, 'button')
    })
  })

  describe('submit', () => {
    it('should submit registration (company) (screenshots)', async () => {
      const result = cachedResponses.companySubmit
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })

    it('should submit registration (individual)', async () => {
      const result = cachedResponses.individualSubmit
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })
  })
})
