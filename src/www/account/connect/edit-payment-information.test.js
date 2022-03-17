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
    const cachedResults = {}
    before(async () => {
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
      cachedResults.account_holder_type = cachedResults.currency = cachedResults.iban = await req.get()
      // account number, bsb number
      await TestHelper.createStripeAccount(user, {
        country: 'AU',
        business_type: 'individual'
      })
      req = TestHelper.createRequest(`/account/connect/edit-payment-information?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      cachedResults.account_number = cachedResults.bsb_number = await req.get()
      // intiitution number, transit number
      await TestHelper.createStripeAccount(user, {
        country: 'CA',
        business_type: 'individual'
      })
      req = TestHelper.createRequest(`/account/connect/edit-payment-information?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      cachedResults.institution_number = cachedResults.transit_number = await req.get()
      // sort code
      await TestHelper.createStripeAccount(user, {
        country: 'GB',
        business_type: 'individual'
      })
      req = TestHelper.createRequest(`/account/connect/edit-payment-information?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      cachedResults.sort_code = await req.get()
      // branch code, clearing code
      await TestHelper.createStripeAccount(user, {
        country: 'HK',
        business_type: 'individual'
      })
      req = TestHelper.createRequest(`/account/connect/edit-payment-information?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      cachedResults.branch_code = cachedResults.clearing_code = await req.get()
      // bank code
      await TestHelper.createStripeAccount(user, {
        country: 'JP',
        business_type: 'company'
      })
      req = TestHelper.createRequest(`/account/connect/edit-payment-information?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      cachedResults.bank_code = await req.get()
      // routing number
      await TestHelper.createStripeAccount(user, {
        country: 'MY',
        business_type: 'company'
      })
      req = TestHelper.createRequest(`/account/connect/edit-payment-information?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      cachedResults.routing_number = await req.get()
    })
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
    it('should have element for field account_holder_type', async () => {
      const result = cachedResults.account_holder_type
      const doc = TestHelper.extractDoc(result.html)
      const individual = doc.getElementById('individual')
      assert.notStrictEqual(individual, undefined)
      const company = doc.getElementById('company')
      assert.notStrictEqual(company, undefined)
    })
    it('should have element for field currency', async () => {
      const result = cachedResults.currency
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('currency')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field iban', async () => {
      const result = cachedResults.iban
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('iban')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field account_number', async () => {
      const result = cachedResults.account_number
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('account_number')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field bsb_number', async () => {
      const result = cachedResults.bsb_number
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('bsb_number')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field institution_number', async () => {
      const result = cachedResults.institution_number
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('institution_number')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field transit_number', async () => {
      const result = cachedResults.transit_number
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('transit_number')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field sort_code', async () => {
      const result = cachedResults.sort_code
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('sort_code')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field branch_code', async () => {
      const result = cachedResults.branch_code
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('branch_code')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field clearing_code', async () => {
      const result = cachedResults.clearing_code
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('clearing_code')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field bank_code', async () => {
      const result = cachedResults.bank_code
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('bank_code')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field routing_number', async () => {
      const result = cachedResults.routing_number
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
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })
  })

  describe('errors', async () => {
    const cachedResults = {}
    before(async () => {
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
      cachedResults.invalidAccountHolderType = await req.post()
      // currency
      req.body = TestStripeAccounts.createBankingData('individual', TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country)
      req.body.currency = 'invalid'
      cachedResults.invalidCurrency = await req.post()
      // iban
      req.body = TestStripeAccounts.createBankingData('individual', TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country)
      req.body.iban = 'invalid'
      cachedResults.invalidIBAN = await req.post()
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
      cachedResults.invalidAccountNumber = await req.post()
      // bsb number
      req.body = TestStripeAccounts.createBankingData('individual', TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country)
      req.body.bsb_number = 'invalid'
      cachedResults.invalidBSBNumber = await req.post()
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
      cachedResults.invalidInstitutionNumber = await req.post()
      // transit number
      req.body = TestStripeAccounts.createBankingData('individual', TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country)
      req.body.transit_number = 'invalid'
      cachedResults.invalidTransitNumber = await req.post()
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
      cachedResults.invalidSortCode = await req.post()
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
      cachedResults.invalidBranchCode = await req.post()
      // clearing code
      req.body = TestStripeAccounts.createBankingData('individual', TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country)
      req.body.clearing_code = 'invalid'
      cachedResults.invalidClearingCode = await req.post()
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
      cachedResults.invalidBankCode = await req.post()
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
      cachedResults.invalidRoutingNumber = await req.post()
    })

    it('reject invalid field account_holder_type', async () => {
      const result = cachedResults.invalidAccountHolderType
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-account_holder_type')
    })
    it('reject invalid field currency', async () => {
      const result = cachedResults.invalidCurrency
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-currency')
    })
    it('reject invalid field iban', async () => {
      const result = cachedResults.invalidIBAN
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-iban')
    })
    it('reject invalid field account_number', async () => {
      const result = cachedResults.invalidAccountNumber
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-account_number')
    })
    it('reject invalid field bsb_number', async () => {
      const result = cachedResults.invalidBSBNumber
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-bsb_number')
    })
    it('reject invalid field institution_number', async () => {
      const result = cachedResults.invalidInstitutionNumber
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-institution_number')
    })
    it('reject invalid field transit_number', async () => {
      const result = cachedResults.invalidTransitNumber
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-transit_number')
    })
    it('reject invalid field sort_code', async () => {
      const result = cachedResults.invalidSortCode
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-sort_code')
    })
    it('reject invalid field clearing_code', async () => {
      const result = cachedResults.invalidClearingCode
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-clearing_code')
    })
    it('reject invalid field bank_code', async () => {
      const result = cachedResults.invalidBankCode
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-bank_code')
    })
    it('reject invalid field routing_number', async () => {
      const result = cachedResults.invalidRoutingNumber
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-routing_number')
    })
  })
})
