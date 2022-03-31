/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')
const TestStripeAccounts = require('../../../../test-stripe-accounts.js')

describe('/account/connect/submit-company-executives', function () {
  describe('exceptions', () => {
    it('should reject invalid stripeid', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest('/account/connect/submit-company-executives?stripeid=invalid')
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

    it('should reject individual registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'US',
        business_type: 'individual'
      })
      const req = TestHelper.createRequest(`/account/connect/submit-company-executives?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      let errorMessage
      try {
        await req.route.api.before(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-stripe-account')
    })

    it('should reject Stripe account that doesn\'t require executives', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'JP',
        business_type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/submit-company-executives?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      let errorMessage
      try {
        await req.route.api.before(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-stripe-account')
    })
  })

  describe('before', () => {
    it('should bind data to req', async () => {
      const user = await TestStripeAccounts.createCompanyWithExecutives('DE', 2)
      const req = TestHelper.createRequest(`/account/connect/submit-company-executives?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      await req.route.api.before(req)
      assert.strictEqual(req.data.stripeAccount.id, user.stripeAccount.stripeid)
      assert.strictEqual(req.data.executives.length, 2)
    })
  })

  describe('view', () => {
    it('should reject if a executive requires information', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'DE',
        business_type: 'company'
      })
      await TestHelper.createPerson(user, {
        relationship_executive: 'true',
        relationship_title: 'Chairperson',
        relationship_percent_ownership: '0'
      })
      const req = TestHelper.createRequest(`/account/connect/submit-company-executives?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      const result = await req.get()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-company-executives')
    })

    it('should present the form without executives', async () => {
      const user = await TestStripeAccounts.createCompanyWithExecutives('DE', 0)
      const req = TestHelper.createRequest(`/account/connect/submit-company-executives?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      const result = await req.get()
      const doc = TestHelper.extractDoc(result.html)
      assert.strictEqual(doc.getElementById('submit-form').tag, 'form')
      assert.strictEqual(doc.getElementById('submit-button').tag, 'button')
    })

    it('should present the form with executives', async () => {
      const user = await TestStripeAccounts.createCompanyWithExecutives('DE', 1)
      const executiveData = TestStripeAccounts.createPersonData(TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country, user.executive.stripeObject)
      const documents = {
        verification_document_back: TestStripeAccounts['success_id_scan_back.png'],
        verification_document_front: TestStripeAccounts['success_id_scan_front.png']
      }
      await TestHelper.updatePerson(user, user.executive, executiveData, documents)
      const req = TestHelper.createRequest(`/account/connect/submit-company-executives?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      const result = await req.get()
      const doc = TestHelper.extractDoc(result.html)
      assert.strictEqual(doc.getElementById('submit-form').tag, 'form')
      assert.strictEqual(doc.getElementById('submit-button').tag, 'button')
    })
  })

  describe('submit', () => {
    it('should submit executives (screenshots)', async () => {
      const user = await TestStripeAccounts.createCompanyWithExecutives('DE', 1)
      const executiveData = TestStripeAccounts.createPersonData(TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country, user.executive.stripeObject)
      await TestStripeAccounts.waitForPersonField(user, 'executive', 'first_name')
      await TestHelper.updatePerson(user, user.executive, executiveData)
      await TestStripeAccounts.waitForPersonField(user, 'executive', 'verification.document')
      const documents = {
        verification_document_back: TestStripeAccounts['success_id_scan_back.png'],
        verification_document_front: TestStripeAccounts['success_id_scan_front.png'],
        verification_additional_document_back: TestStripeAccounts['success_id_scan_back.png'],
        verification_additional_document_front: TestStripeAccounts['success_id_scan_front.png']
      }
      await TestHelper.updatePerson(user, user.executive, {}, documents)
      await TestStripeAccounts.waitForPersonFieldToLeave(user, 'executive', 'verification.document')
      const req = TestHelper.createRequest(`/account/connect/submit-company-executives?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      req.body = {}
      req.filename = __filename
      req.screenshots = [
        { hover: '#account-menu-container' },
        { click: '/account/connect' },
        { click: '/account/connect/stripe-accounts' },
        { click: `/account/connect/stripe-account?stripeid=${user.stripeAccount.stripeid}` },
        { click: `/account/connect/submit-company-executives?stripeid=${user.stripeAccount.stripeid}` },
        { fill: '#submit-form' }
      ]
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })

    it('should submit without executives', async () => {
      const user = await TestStripeAccounts.createCompanyWithExecutives('DE', 0)
      const req = TestHelper.createRequest(`/account/connect/submit-company-executives?stripeid=${user.stripeAccount.stripeid}`)
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
