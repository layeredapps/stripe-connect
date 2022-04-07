/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')
const DashboardTestHelper = require('@layeredapps/dashboard/test-helper.js')
const TestStripeAccounts = require('../../../../test-stripe-accounts')

describe('/account/connect/submit-company-directors', function () {
  let cachedResponses
  async function bundledData () {
    if (cachedResponses && cachedResponses.finished) {
      return
    }
    cachedResponses = {}
    await DashboardTestHelper.setupBeforeEach()
    await TestHelper.setupBeforeEach()
    const user = await TestHelper.createUser()
    await TestHelper.createStripeAccount(user, {
      country: 'US',
      business_type: 'individual'
    })
    // individual account
    let req = TestHelper.createRequest(`/account/connect/submit-company-directors?stripeid=${user.stripeAccount.stripeid}`)
    req.account = user.account
    req.session = user.session
    try {
      await req.route.api.before(req)
    } catch (error) {
      cachedResponses.individualAccount = error.message
    }
    // does not require directors
    await TestHelper.createStripeAccount(user, {
      country: 'JP',
      business_type: 'company'
    })
    req = TestHelper.createRequest(`/account/connect/submit-company-directors?stripeid=${user.stripeAccount.stripeid}`)
    req.account = user.account
    req.session = user.session
    try {
      await req.route.api.before(req)
    } catch (error) {
      cachedResponses.notRequired = error.message
    }
    // bind
    await TestStripeAccounts.createCompanyWithDirectors('DE', 1, user)
    req = TestHelper.createRequest(`/account/connect/submit-company-directors?stripeid=${user.stripeAccount.stripeid}`)
    req.account = user.account
    req.session = user.session
    await req.route.api.before(req)
    cachedResponses.before = req.data
    // requires information
    cachedResponses.requiresInformation = await req.get()
    // shows directors
    const directorData = TestStripeAccounts.createPersonData(TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country, user.director.stripeObject)
    const documents = {
      verification_document_back: TestStripeAccounts['success_id_scan_back.png'],
      verification_document_front: TestStripeAccounts['success_id_scan_front.png']
    }
    await TestHelper.updatePerson(user, user.director, directorData, documents)
    cachedResponses.formWithDirectors = await req.get()
    // submit directors
    req.filename = __filename
    req.screenshots = [
      { hover: '#account-menu-container' },
      { click: '/account/connect' },
      { click: '/account/connect/stripe-accounts' },
      { click: `/account/connect/stripe-account?stripeid=${user.stripeAccount.stripeid}` },
      { click: `/account/connect/submit-company-directors?stripeid=${user.stripeAccount.stripeid}` },
      { fill: '#submit-form' }
    ]
    cachedResponses.submitDirectors = await req.post()
    // no directors
    await TestStripeAccounts.createCompanyWithDirectors('DE', 0, user)
    req = TestHelper.createRequest(`/account/connect/submit-company-directors?stripeid=${user.stripeAccount.stripeid}`)
    req.account = user.account
    req.session = user.session
    cachedResponses.noDirectors = await req.get()
    cachedResponses.submitWithoutDirectors = await req.post()
    cachedResponses.finished = true
  }

  describe('exceptions', () => {
    it('should reject invalid stripeid', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest('/account/connect/submit-company-directors?stripeid=invalid')
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
      const errorMessage = cachedResponses.individualAccount
      assert.strictEqual(errorMessage, 'invalid-stripe-account')
    })

    it('should reject Stripe account that doesn\'t require directors', async () => {
      const errorMessage = cachedResponses.notRequired
      assert.strictEqual(errorMessage, 'invalid-stripe-account')
    })
  })

  describe('before', () => {
    it('should bind data to req', async () => {
      await bundledData()
      const data = cachedResponses.before
      assert.strictEqual(data.stripeAccount.object, 'account')
      assert.strictEqual(data.directors.length, 1)
    })
  })

  describe('view', () => {
    it('should reject if a director requires information', async () => {
      await bundledData()
      const result = cachedResponses.requiresInformation
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-company-directors')
    })

    it('should present the form without directors', async () => {
      await bundledData()
      const result = cachedResponses.noDirectors
      const doc = TestHelper.extractDoc(result.html)
      assert.strictEqual(doc.getElementById('submit-form').tag, 'form')
      assert.strictEqual(doc.getElementById('submit-button').tag, 'button')
    })

    it('should present the form with directors', async () => {
      await bundledData()
      const result = cachedResponses.formWithDirectors
      const doc = TestHelper.extractDoc(result.html)
      assert.strictEqual(doc.getElementById('submit-form').tag, 'form')
      assert.strictEqual(doc.getElementById('submit-button').tag, 'button')
    })
  })

  describe('submit', () => {
    it('should submit directors (screenshots)', async () => {
      await bundledData()
      const result = cachedResponses.submitDirectors
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })

    it('should submit without directors', async () => {
      await bundledData()
      const result = cachedResponses.submitWithoutDirectors
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })
  })
})
