/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')
const DashboardTestHelper = require('@layeredapps/dashboard/test-helper.js')
const TestStripeAccounts = require('../../../../test-stripe-accounts')

describe('/account/connect/submit-company-owners', function () {
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
    let req = TestHelper.createRequest(`/account/connect/submit-company-owners?stripeid=${user.stripeAccount.stripeid}`)
    req.account = user.account
    req.session = user.session
    try {
      await req.route.api.before(req)
    } catch (error) {
      cachedResponses.individualAccount = error.message
    }
    // does not require owners
    await TestHelper.createStripeAccount(user, {
      country: 'JP',
      business_type: 'company'
    })
    req = TestHelper.createRequest(`/account/connect/submit-company-owners?stripeid=${user.stripeAccount.stripeid}`)
    req.account = user.account
    req.session = user.session
    try {
      await req.route.api.before(req)
    } catch (error) {
      cachedResponses.notRequired = error.message
    }
    // bind
    await TestStripeAccounts.createCompanyWithOwners('DE', 1, user)
    req = TestHelper.createRequest(`/account/connect/submit-company-owners?stripeid=${user.stripeAccount.stripeid}`)
    req.account = user.account
    req.session = user.session
    await req.route.api.before(req)
    cachedResponses.before = req.data
    // requires information
    cachedResponses.requiresInformation = await req.get()
    // shows owners
    const ownerData = TestStripeAccounts.createPersonData(TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country, user.owner.stripeObject)
    await TestHelper.updatePerson(user, user.owner, ownerData)
    await TestStripeAccounts.waitForPersonField(user, 'owner', 'verification.document')
    await TestStripeAccounts.waitForPersonField(user, 'owner', 'verification.additional_document')
    const ownerUploads = {
      verification_document_back: TestStripeAccounts['success_id_scan_back.png'],
      verification_document_front: TestStripeAccounts['success_id_scan_front.png'],
      verification_additional_document_back: TestStripeAccounts['success_id_scan_back.png'],
      verification_additional_document_front: TestStripeAccounts['success_id_scan_front.png']
    }
    await TestHelper.updatePerson(user, user.owner, {}, ownerUploads)
    await TestStripeAccounts.waitForPersonFieldToLeave(user, 'owner', 'verification.document')
    await TestStripeAccounts.waitForPersonFieldToLeave(user, 'owner', 'verification.additional_document')
    cachedResponses.formWithOwners = await req.get()
    // submit owners
    req.filename = __filename
    req.screenshots = [
      { hover: '#account-menu-container' },
      { click: '/account/connect' },
      { click: '/account/connect/stripe-accounts' },
      { click: `/account/connect/stripe-account?stripeid=${user.stripeAccount.stripeid}` },
      { click: `/account/connect/submit-company-owners?stripeid=${user.stripeAccount.stripeid}` },
      { fill: '#submit-form' }
    ]
    global.pageSize = 50
    cachedResponses.submitOwners = await req.post()
    // no owners
    await TestStripeAccounts.createCompanyWithOwners('DE', 0, user)
    req = TestHelper.createRequest(`/account/connect/submit-company-owners?stripeid=${user.stripeAccount.stripeid}`)
    req.account = user.account
    req.session = user.session
    cachedResponses.noOwners = await req.get()
    // csrf
    req.puppeteer = false
    cachedResponses.csrf = await req.post()
    delete (req.puppeteer)
    // submit
    cachedResponses.submitWithoutOwners = await req.post()
    cachedResponses.finished = true
  }

  describe('exceptions', () => {
    it('should reject invalid stripeid', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest('/account/connect/submit-company-owners?stripeid=invalid')
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

    it('should reject individual registration', async function () {
      await bundledData(this.test.currentRetry())
      const errorMessage = cachedResponses.individualAccount
      assert.strictEqual(errorMessage, 'invalid-stripe-account')
    })

    it('should reject Stripe account that doesn\'t require owners', async function () {
      await bundledData(this.test.currentRetry())
      const errorMessage = cachedResponses.notRequired
      assert.strictEqual(errorMessage, 'invalid-stripe-account')
    })
  })

  describe('before', () => {
    it('should bind data to req', async function () {
      await bundledData(this.test.currentRetry())
      const data = cachedResponses.before
      assert.strictEqual(data.stripeAccount.object, 'account')
      assert.strictEqual(data.owners.length, 1)
    })
  })

  describe('view', () => {
    it('should reject if an owner requires information', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.requiresInformation
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-company-owners')
    })

    it('should present the form without owners', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.noOwners
      const doc = TestHelper.extractDoc(result.html)
      assert.strictEqual(doc.getElementById('submit-form').tag, 'form')
      assert.strictEqual(doc.getElementById('submit-button').tag, 'button')
    })

    it('should present the form with completed owners', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.formWithOwners
      const doc = TestHelper.extractDoc(result.html)
      assert.strictEqual(doc.getElementById('submit-form').tag, 'form')
      assert.strictEqual(doc.getElementById('submit-button').tag, 'button')
    })
  })

  describe('submit', () => {
    it('should submit owners (screenshots)', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.submitOwners
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })

    it('should submit without owners', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.submitWithoutOwners
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })
  })

  describe('errors', () => {
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
