/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')
const DashboardTestHelper = require('@layeredapps/dashboard/test-helper.js')
const TestStripeAccounts = require('../../../../test-stripe-accounts')

describe('/account/connect/stripe-account', function () {
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
    // invalid account
    const user = await TestHelper.createUser()
    await TestHelper.createStripeAccount(user, {
      country: 'US',
      business_type: 'individual'
    })
    const user2 = await TestHelper.createUser()
    let req = TestHelper.createRequest(`/account/connect/stripe-account?stripeid=${user.stripeAccount.stripeid}`)
    req.account = user2.account
    req.session = user2.session
    try {
      await req.route.api.before(req)
    } catch (error) {
      cachedResponses.invalidAccount = error.message
    }
    // bind data
    req = TestHelper.createRequest(`/account/connect/stripe-account?stripeid=${user.stripeAccount.stripeid}`)
    req.account = user.account
    req.session = user.session
    await req.route.api.before(req)
    cachedResponses.before = req.data
    // unstarted
    req.filename = __filename
    req.screenshots = [
      { hover: '#account-menu-container' },
      { click: '/account/connect' },
      { click: '/account/connect/stripe-accounts' },
      { click: `/account/connect/stripe-account?stripeid=${user.stripeAccount.stripeid}` }
    ]
    global.pageSize = 50
    cachedResponses.unstarted = await req.get()
    // registration completed
    await TestStripeAccounts.waitForAccountField(user, 'individual.first_name')
    const accountData = TestStripeAccounts.createAccountData(user.profile, user.stripeAccount.stripeObject.country, user.stripeAccount.stripeObject)
    await TestHelper.updateStripeAccount(user, accountData)
    await TestStripeAccounts.waitForAccountFieldToLeave(user, 'individual.first_name')
    req = TestHelper.createRequest(`/account/connect/stripe-account?stripeid=${user.stripeAccount.stripeid}`)
    req.account = user.account
    req.session = user.session
    cachedResponses.registrationComplete = await req.get()
    // payment info required
    const user3 = await TestStripeAccounts.createCompanyMissingPaymentDetails('DE')
    req = TestHelper.createRequest(`/account/connect/stripe-account?stripeid=${user3.stripeAccount.stripeid}`)
    req.account = user3.account
    req.session = user3.session
    cachedResponses.paymentInformationRequired = await req.get()
    // payment information created
    const bankingData = TestStripeAccounts.createBankingData(user3.stripeAccount.stripeObject.business_type, user3.profile, user3.stripeAccount.stripeObject.country)
    await TestHelper.createExternalAccount(user3, bankingData)
    cachedResponses.hasPaymentInformation = await req.get()
    // submitted
    await TestHelper.submitStripeAccount(user3)
    cachedResponses.submitted = await req.get()
    cachedResponses.finished = true
  }

  describe('before', () => {
    it('should reject invalid stripeid', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest('/account/connect/stripe-account?stripeid=invalid')
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

    it('should reject other account\'s stripeid', async function () {
      await bundledData(this.test.currentRetry())
      const errorMessage = cachedResponses.invalidAccount
      assert.strictEqual(errorMessage, 'invalid-account')
    })

    it('should bind data to req', async function () {
      await bundledData(this.test.currentRetry())
      const data = cachedResponses.before
      assert.strictEqual(data.stripeAccount.object, 'account')
    })
  })

  describe('view', () => {
    it('should show registration unstarted (screenshots)', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.unstarted
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('account-status')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'unstarted-registration')
    })

    it('should show registration completed', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.registrationComplete
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('account-status')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'completed-registration')
    })

    it('should show payment information required', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.paymentInformationRequired
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('payment-information-status')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'no-payment-information')
    })

    it('should show payment information created', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.hasPaymentInformation
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('payment-information-status')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'payment-information')
    })

    it('should show ready to submit', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.hasPaymentInformation
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('submission-status')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'not-submitted-information')
    })

    it('should show registration is submitted', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.submitted
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('submission-status')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'submitted-information')
    })
  })
})
