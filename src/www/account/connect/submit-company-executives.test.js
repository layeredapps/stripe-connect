/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')
const DashboardTestHelper = require('@layeredapps/dashboard/test-helper.js')
const TestStripeAccounts = require('../../../../test-stripe-accounts')

describe('/account/connect/submit-company-executives', function () {
  let cachedResponses
  async function bundledData (retryNumber) {
    if (retryNumber > 0) {
      cachedResponses = {}
      await TestHelper.rotateWebhook(true)
    }
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
    let req = TestHelper.createRequest(`/account/connect/submit-company-executives?stripeid=${user.stripeAccount.stripeid}`)
    req.account = user.account
    req.session = user.session
    await req.route.api.before(req)
    cachedResponses.individualAccount = req.error
    // does not require executives
    await TestHelper.createStripeAccount(user, {
      country: 'JP',
      business_type: 'company'
    })
    req = TestHelper.createRequest(`/account/connect/submit-company-executives?stripeid=${user.stripeAccount.stripeid}`)
    req.account = user.account
    req.session = user.session
    await req.route.api.before(req)
    cachedResponses.notRequired = req.error
    // bind
    await TestStripeAccounts.createCompanyWithExecutives('DE', 1, user)
    req = TestHelper.createRequest(`/account/connect/submit-company-executives?stripeid=${user.stripeAccount.stripeid}`)
    req.account = user.account
    req.session = user.session
    await req.route.api.before(req)
    cachedResponses.before = req.data
    // requires information
    cachedResponses.requiresInformation = await req.get()
    // shows executives
    const executiveData = TestStripeAccounts.createPersonData(TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country, user.executive.stripeObject)
    await TestHelper.updatePerson(user, user.executive, executiveData)
    await TestStripeAccounts.waitForPersonField(user, 'executive', 'verification.document')
    await TestStripeAccounts.waitForPersonField(user, 'executive', 'verification.additional_document')
    const executiveUploads = {
      verification_document_back: TestStripeAccounts['success_id_scan_back.png'],
      verification_document_front: TestStripeAccounts['success_id_scan_front.png'],
      verification_additional_document_back: TestStripeAccounts['success_id_scan_back.png'],
      verification_additional_document_front: TestStripeAccounts['success_id_scan_front.png']
    }
    await TestHelper.updatePerson(user, user.executive, {}, executiveUploads)
    await TestStripeAccounts.waitForPersonFieldToLeave(user, 'executive', 'verification.document')
    await TestStripeAccounts.waitForPersonFieldToLeave(user, 'executive', 'verification.additional_document')
    cachedResponses.formWithExecutives = await req.get()
    // submit executives
    req.filename = __filename
    req.screenshots = [
      { hover: '#account-menu-container' },
      { click: '/account/connect' },
      { click: '/account/connect/stripe-accounts' },
      { click: `/account/connect/stripe-account?stripeid=${user.stripeAccount.stripeid}` },
      { click: `/account/connect/submit-company-executives?stripeid=${user.stripeAccount.stripeid}` },
      { fill: '#submit-form' }
    ]
    global.pageSize = 50
    cachedResponses.submitExecutives = await req.post()
    // no executives
    await TestStripeAccounts.createCompanyWithExecutives('DE', 0, user)
    req = TestHelper.createRequest(`/account/connect/submit-company-executives?stripeid=${user.stripeAccount.stripeid}`)
    req.account = user.account
    req.session = user.session
    cachedResponses.noExecutives = await req.get()
    // csrf
    req.puppeteer = false
    cachedResponses.csrf = await req.post()
    delete (req.puppeteer)
    // submit
    cachedResponses.submitWithoutExecutives = await req.post()
    cachedResponses.finished = true
  }

  describe('before', () => {
    it('should bind data to req', async function () {
      await bundledData(this.test.currentRetry())
      const data = cachedResponses.before
      assert.strictEqual(data.stripeAccount.object, 'account')
      assert.strictEqual(data.executives.length, 1)
    })
  })

  describe('view', () => {
    it('should reject if a executive requires information', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.requiresInformation
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-company-executives')
    })

    it('should present the form without executives', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.noExecutives
      const doc = TestHelper.extractDoc(result.html)
      assert.strictEqual(doc.getElementById('submit-form').tag, 'form')
      assert.strictEqual(doc.getElementById('submit-button').tag, 'button')
    })

    it('should present the form with executives', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.formWithExecutives
      const doc = TestHelper.extractDoc(result.html)
      assert.strictEqual(doc.getElementById('submit-form').tag, 'form')
      assert.strictEqual(doc.getElementById('submit-button').tag, 'button')
    })
  })

  describe('submit', () => {
    it('should submit executives (screenshots)', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.submitExecutives
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })

    it('should submit without executives', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.submitWithoutExecutives
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })
  })

  describe('errors', () => {
    it('invalid-stripeid', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest('/account/connect/submit-company-executives?stripeid=invalid')
      req.account = user.account
      req.session = user.session
      await req.route.api.before(req)
      assert.strictEqual(req.error, 'invalid-stripeid')
    })

    it('invalid-stripe-account', async function () {
      await bundledData(this.test.currentRetry())
      const errorMessage = cachedResponses.individualAccount
      assert.strictEqual(errorMessage, 'invalid-stripe-account')
    })

    it('not-required', async function () {
      await bundledData(this.test.currentRetry())
      const errorMessage = cachedResponses.notRequired
      assert.strictEqual(errorMessage, 'not-required')
    })

    it('invalid-csrf-token', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.csrf
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-csrf-token')
    })
  })
})
