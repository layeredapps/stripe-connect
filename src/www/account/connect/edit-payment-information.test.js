/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')
const TestStripeAccounts = require('../../../../test-stripe-accounts.js')
const DashboardTestHelper = require('@layeredapps/dashboard/test-helper.js')

describe('/account/connect/edit-payment-information', function () {
  describe('before', () => {
    it('should reject invalid stripeid', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest('/account/connect/edit-payment-information?stripeid=invalid')
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

    it('should bind Stripe account to req', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'US',
        business_type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-payment-information?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      await req.route.api.before(req)
      assert.strictEqual(req.data.stripeAccount.id, user.stripeAccount.stripeid)
    })
  })

  describe('view', async () => {
    let cachedResponses
    async function bundledData (retryNumber) {
      if (retryNumber) {
        cachedResponses = {}
      }
      if (cachedResponses && cachedResponses.finished) {
        return
      }
      cachedResponses = {}
      await DashboardTestHelper.setupBeforeEach()
      await TestHelper.setupBeforeEach()
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'AT',
        business_type: 'individual'
      })
      // account_holder_type, currency, iban
      let req = TestHelper.createRequest(`/account/connect/edit-payment-information?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      cachedResponses.account_holder_type = cachedResponses.currency = cachedResponses.iban = await req.get()
      // account number, bsb number
      await TestHelper.createStripeAccount(user, {
        country: 'AU',
        business_type: 'individual'
      })
      req = TestHelper.createRequest(`/account/connect/edit-payment-information?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      cachedResponses.account_number = cachedResponses.bsb_number = await req.get()
      // intiitution number, transit number
      await TestHelper.createStripeAccount(user, {
        country: 'CA',
        business_type: 'individual'
      })
      req = TestHelper.createRequest(`/account/connect/edit-payment-information?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      cachedResponses.institution_number = cachedResponses.transit_number = await req.get()
      // sort code
      await TestHelper.createStripeAccount(user, {
        country: 'GB',
        business_type: 'individual'
      })
      req = TestHelper.createRequest(`/account/connect/edit-payment-information?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      cachedResponses.sort_code = await req.get()
      // branch code, clearing code
      await TestHelper.createStripeAccount(user, {
        country: 'HK',
        business_type: 'individual'
      })
      req = TestHelper.createRequest(`/account/connect/edit-payment-information?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      cachedResponses.branch_code = cachedResponses.clearing_code = await req.get()
      // bank code
      await TestHelper.createStripeAccount(user, {
        country: 'JP',
        business_type: 'company'
      })
      req = TestHelper.createRequest(`/account/connect/edit-payment-information?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      cachedResponses.bank_code = await req.get()
      // routing number
      await TestHelper.createStripeAccount(user, {
        country: 'MY',
        business_type: 'company'
      })
      req = TestHelper.createRequest(`/account/connect/edit-payment-information?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      cachedResponses.routing_number = await req.get()
      cachedResponses.finished = true
    }
    it('should present the form', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'US',
        business_type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-payment-information?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      const result = await req.get()
      const doc = TestHelper.extractDoc(result.html)
      assert.strictEqual(doc.getElementById('submit-form').tag, 'form')
      assert.strictEqual(doc.getElementById('submit-button').tag, 'button')
    })
    it('should have element for field account_holder_type', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.account_holder_type
      const doc = TestHelper.extractDoc(result.html)
      const individual = doc.getElementById('individual')
      assert.notStrictEqual(individual, undefined)
      const company = doc.getElementById('company')
      assert.notStrictEqual(company, undefined)
    })
    it('should have element for field currency', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.currency
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('currency')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field iban', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.iban
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('iban')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field account_number', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.account_number
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('account_number')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field bsb_number', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.bsb_number
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('bsb_number')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field institution_number', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.institution_number
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('institution_number')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field transit_number', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.transit_number
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('transit_number')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field sort_code', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.sort_code
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('sort_code')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field branch_code', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.branch_code
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('branch_code')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field clearing_code', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.clearing_code
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('clearing_code')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field bank_code', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.bank_code
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('bank_code')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field routing_number', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.routing_number
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('routing_number')
      assert.notStrictEqual(field, undefined)
    })
  })

  describe('submit', async () => {
    it('should update payment information (screenshots)', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'US',
        business_type: 'individual'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-payment-information?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      req.body = TestStripeAccounts.createBankingData('individual', user.profile, user.stripeAccount.stripeObject.country)
      req.filename = __filename
      req.screenshots = [
        { hover: '#account-menu-container' },
        { click: '/account/connect' },
        { click: `/account/connect/stripe-account?stripeid=${user.stripeAccount.stripeid}` },
        { click: `/account/connect/edit-payment-information?stripeid=${user.stripeAccount.stripeid}` },
        { fill: '#submit-form' }
      ]
      global.pageSize = 50
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })
  })

  describe('errors', async () => {
    let cachedResponses
    async function bundledData (retryNumber) {
      if (retryNumber) {
        cachedResponses = {}
      }
      if (cachedResponses && cachedResponses.finished) {
        return
      }
      cachedResponses = {}
      await DashboardTestHelper.setupBeforeEach()
      await TestHelper.setupBeforeEach()
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'AT',
        business_type: 'individual'
      })
      let req = TestHelper.createRequest(`/account/connect/edit-payment-information?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      // account holder type
      req.body = TestStripeAccounts.createBankingData('individual', TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country)
      req.body.account_holder_type = 'invalid'
      cachedResponses.invalidAccountHolderType = await req.post()
      // currency
      req.body = TestStripeAccounts.createBankingData('individual', TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country)
      req.body.currency = 'invalid'
      cachedResponses.invalidCurrency = await req.post()
      // iban
      req.body = TestStripeAccounts.createBankingData('individual', TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country)
      req.body.iban = 'invalid'
      cachedResponses.invalidIBAN = await req.post()
      // account number
      await TestHelper.createStripeAccount(user, {
        country: 'AU',
        business_type: 'individual'
      })
      req = TestHelper.createRequest(`/account/connect/edit-payment-information?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      req.body = TestStripeAccounts.createBankingData('individual', TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country)
      req.body.account_number = 'invalid'
      cachedResponses.invalidAccountNumber = await req.post()
      // bsb number
      req.body = TestStripeAccounts.createBankingData('individual', TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country)
      req.body.bsb_number = 'invalid'
      cachedResponses.invalidBSBNumber = await req.post()
      // intiitution number
      await TestHelper.createStripeAccount(user, {
        country: 'CA',
        business_type: 'individual'
      })
      req = TestHelper.createRequest(`/account/connect/edit-payment-information?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      req.body = TestStripeAccounts.createBankingData('individual', TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country)
      req.body.institution_number = 'invalid'
      cachedResponses.invalidInstitutionNumber = await req.post()
      // transit number
      req.body = TestStripeAccounts.createBankingData('individual', TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country)
      req.body.transit_number = 'invalid'
      cachedResponses.invalidTransitNumber = await req.post()
      // sort code
      await TestHelper.createStripeAccount(user, {
        country: 'GB',
        business_type: 'individual'
      })
      req = TestHelper.createRequest(`/account/connect/edit-payment-information?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      req.body = TestStripeAccounts.createBankingData('individual', TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country)
      req.body.sort_code = 'invalid'
      cachedResponses.invalidSortCode = await req.post()
      // branch code
      await TestHelper.createStripeAccount(user, {
        country: 'HK',
        business_type: 'individual'
      })
      req = TestHelper.createRequest(`/account/connect/edit-payment-information?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      req.body = TestStripeAccounts.createBankingData('individual', TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country)
      req.body.branch_code = 'invalid'
      cachedResponses.invalidBranchCode = await req.post()
      // clearing code
      req.body = TestStripeAccounts.createBankingData('individual', TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country)
      req.body.clearing_code = 'invalid'
      cachedResponses.invalidClearingCode = await req.post()
      // bank code
      await TestHelper.createStripeAccount(user, {
        country: 'JP',
        business_type: 'company'
      })
      req = TestHelper.createRequest(`/account/connect/edit-payment-information?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      req.body = TestStripeAccounts.createBankingData('individual', TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country)
      req.body.bank_code = 'invalid'
      cachedResponses.invalidBankCode = await req.post()
      // routing number
      await TestHelper.createStripeAccount(user, {
        country: 'MY',
        business_type: 'company'
      })
      req = TestHelper.createRequest(`/account/connect/edit-payment-information?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      req.body = TestStripeAccounts.createBankingData('individual', TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country)
      req.body.routing_number = 'invalid'
      cachedResponses.invalidRoutingNumber = await req.post()
      // xss
      req = TestHelper.createRequest(`/account/connect/edit-payment-information?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      req.body = TestStripeAccounts.createBankingData('individual', TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country)
      req.body.routing_number = '<script>'
      cachedResponses.xss = await req.post()
      // csrf
      req = TestHelper.createRequest(`/account/connect/edit-payment-information?stripeid=${user.stripeAccount.stripeid}`)
      req.puppeteer = false
      req.account = user.account
      req.session = user.session
      req.body = TestStripeAccounts.createBankingData('individual', TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country)
      req.body['csrf-token'] = 'invalid'
      cachedResponses.csrf = await req.post()
      cachedResponses.finished = true
    }

    it('invalid-account_holder_type', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.invalidAccountHolderType
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-account_holder_type')
    })
    it('invalid-currency', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.invalidCurrency
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-currency')
    })
    it('invalid-iban', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.invalidIBAN
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-iban')
    })
    it('invalid-account_number', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.invalidAccountNumber
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-account_number')
    })
    it('invalid-bsb_number', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.invalidBSBNumber
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-bsb_number')
    })
    it('invalid-institution_number', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.invalidInstitutionNumber
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-institution_number')
    })
    it('invalid-transit_number', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.invalidTransitNumber
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-transit_number')
    })
    it('invalid-sort_code', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.invalidSortCode
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-sort_code')
    })
    it('invalid-clearing_code', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.invalidClearingCode
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-clearing_code')
    })
    it('invalid-bank_code', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.invalidBankCode
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-bank_code')
    })
    it('invalid-routing_number', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.invalidRoutingNumber
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-routing_number')
    })

    it('invalid-xss-input', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.xss
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-xss-input')
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
