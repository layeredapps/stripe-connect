/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')
const TestStripeAccounts = require('../../../../../test-stripe-accounts.js')
const DashboardTestHelper = require('@layeredapps/dashboard/test-helper.js')

describe('/api/user/connect/update-payment-information', function () {
  before(TestHelper.disableMetrics)
  after(TestHelper.enableMetrics)
  describe('exceptions', () => {
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
      let req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      // account holder type
      req.body = TestStripeAccounts.createBankingData('individual', TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country)
      delete (req.body.account_holder_type)
      try {
        await req.patch()
      } catch (error) {
        cachedResponses.missingAccountHolderType = error.message
      }
      req.body.account_holder_type = 'invalid'
      try {
        await req.patch()
      } catch (error) {
        cachedResponses.invalidAccountHolderType = error.message
      }
      // currency
      req.body = TestStripeAccounts.createBankingData('individual', TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country)
      delete (req.body.currency)
      try {
        await req.patch()
      } catch (error) {
        cachedResponses.missingCurrency = error.message
      }
      req.body.currency = 'invalid'
      try {
        await req.patch()
      } catch (error) {
        cachedResponses.invalidCurrency = error.message
      }
      // iban
      req.body = TestStripeAccounts.createBankingData('individual', TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country)
      delete (req.body.iban)
      try {
        await req.patch()
      } catch (error) {
        cachedResponses.missingIBAN = error.message
      }
      req.body.iban = 'invalid'
      try {
        await req.patch()
      } catch (error) {
        cachedResponses.invalidIBAN = error.message
      }
      // account number
      await TestHelper.createStripeAccount(user, {
        country: 'AU',
        business_type: 'individual'
      })
      req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      req.body = TestStripeAccounts.createBankingData('individual', TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country)
      delete (req.body.account_number)
      try {
        await req.patch()
      } catch (error) {
        cachedResponses.missingAccountNumber = error.message
      }
      req.body.account_number = 'invalid'
      try {
        await req.patch()
      } catch (error) {
        cachedResponses.invalidAccountNumber = error.message
      }
      // bsb number
      req.body = TestStripeAccounts.createBankingData('individual', TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country)
      delete (req.body.bsb_number)
      try {
        await req.patch()
      } catch (error) {
        cachedResponses.missingBSBNumber = error.message
      }
      req.body.bsb_number = 'invalid'
      try {
        await req.patch()
      } catch (error) {
        cachedResponses.invalidBSBNumber = error.message
      }
      // intiitution number
      await TestHelper.createStripeAccount(user, {
        country: 'CA',
        business_type: 'individual'
      })
      req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      req.body = TestStripeAccounts.createBankingData('individual', TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country)
      delete (req.body.institution_number)
      try {
        await req.patch()
      } catch (error) {
        cachedResponses.missingInstitutionNumber = error.message
      }
      req.body.institution_number = 'invalid'
      try {
        await req.patch()
      } catch (error) {
        cachedResponses.invalidInstitutionNumber = error.message
      }
      // transit number
      req.body = TestStripeAccounts.createBankingData('individual', TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country)
      delete (req.body.transit_number)
      try {
        await req.patch()
      } catch (error) {
        cachedResponses.missingTransitNumber = error.message
      }
      req.body.transit_number = 'invalid'
      try {
        await req.patch()
      } catch (error) {
        cachedResponses.invalidTransitNumber = error.message
      }
      // sort code
      await TestHelper.createStripeAccount(user, {
        country: 'GB',
        business_type: 'individual'
      })
      req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      req.body = TestStripeAccounts.createBankingData('individual', TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country)
      delete (req.body.sort_code)
      try {
        await req.patch()
      } catch (error) {
        cachedResponses.missingSortCode = error.message
      }
      req.body.sort_code = 'invalid'
      try {
        await req.patch()
      } catch (error) {
        cachedResponses.invalidSortCode = error.message
      }
      // branch code
      await TestHelper.createStripeAccount(user, {
        country: 'HK',
        business_type: 'individual'
      })
      req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      req.body = TestStripeAccounts.createBankingData('individual', TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country)
      delete (req.body.branch_code)
      try {
        await req.patch()
      } catch (error) {
        cachedResponses.missingBranchCode = error.message
      }
      req.body.branch_code = 'invalid'
      try {
        await req.patch()
      } catch (error) {
        cachedResponses.invalidBranchCode = error.message
      }
      // clearing code
      req.body = TestStripeAccounts.createBankingData('individual', TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country)
      delete (req.body.clearing_code)
      try {
        await req.patch()
      } catch (error) {
        cachedResponses.missingClearingCode = error.message
      }
      req.body.clearing_code = 'invalid'
      try {
        await req.patch()
      } catch (error) {
        cachedResponses.invalidClearingCode = error.message
      }
      // bank code
      await TestHelper.createStripeAccount(user, {
        country: 'JP',
        business_type: 'company'
      })
      req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      req.body = TestStripeAccounts.createBankingData('individual', TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country)
      delete (req.body.bank_code)
      try {
        await req.patch()
      } catch (error) {
        cachedResponses.missingBankCode = error.message
      }
      req.body.bank_code = 'invalid'
      try {
        await req.patch()
      } catch (error) {
        cachedResponses.invalidBankCode = error.message
      }
      // routing number
      await TestHelper.createStripeAccount(user, {
        country: 'MY',
        business_type: 'company'
      })
      req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      req.body = TestStripeAccounts.createBankingData('individual', TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country)
      delete (req.body.routing_number)
      try {
        await req.patch()
      } catch (error) {
        cachedResponses.missingRoutingNumber = error.message
      }
      req.body.routing_number = 'invalid'
      try {
        await req.patch()
      } catch (error) {
        cachedResponses.invalidRoutingNumber = error.message
      }
      // invalid stripe id
      req = TestHelper.createRequest('/api/user/connect/update-payment-information')
      req.account = user.account
      req.session = user.session
      req.body = TestStripeAccounts.createBankingData('individual', TestHelper.nextIdentity(), 'US')
      try {
        await req.patch()
      } catch (error) {
        cachedResponses.missingStripeID = error.message
      }
      req = TestHelper.createRequest('/api/user/connect/update-payment-information?stripeid=invalid')
      req.account = user.account
      req.session = user.session
      req.body = TestStripeAccounts.createBankingData('individual', TestHelper.nextIdentity(), 'US')
      try {
        await req.patch()
      } catch (error) {
        cachedResponses.invalidStripeID = error.message
      }
      // invalid account
      const user2 = await TestHelper.createUser()
      req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user2.account
      req.session = user2.session
      req.body = TestStripeAccounts.createBankingData('individual', TestHelper.nextIdentity(), 'US')
      try {
        await req.patch()
      } catch (error) {
        cachedResponses.invalidAccount = error.message
      }
      cachedResponses.finished = true
    }

    describe('invalid-stripeid', () => {
      it('missing querystring stripeid', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.missingStripeID
        assert.strictEqual(errorMessage, 'invalid-stripeid')
      })

      it('invalid querystring stripeid', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.invalidStripeID
        assert.strictEqual(errorMessage, 'invalid-stripeid')
      })
    })

    describe('invalid-account', () => {
      it('ineligible accessing account', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.invalidAccount
        assert.strictEqual(errorMessage, 'invalid-account')
      })
    })

    describe('invalid-account_holder_type', () => {
      it('missing querystring account_holder_type', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.missingAccountHolderType
        assert.strictEqual(errorMessage, 'invalid-account_holder_type')
      })
      it('invalid querystring account_holder_type', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.invalidAccountHolderType
        assert.strictEqual(errorMessage, 'invalid-account_holder_type')
      })
    })

    describe('invalid-currency', () => {
      it('missing querystring currency', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.missingCurrency
        assert.strictEqual(errorMessage, 'invalid-currency')
      })
      it('invalid querystring currency', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.invalidCurrency
        assert.strictEqual(errorMessage, 'invalid-currency')
      })
    })

    describe('invalid-iban', () => {
      it('missing querystring iban', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.missingIBAN
        assert.strictEqual(errorMessage, 'invalid-external_account.iban')
      })
      it('invalid querystring iban', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.invalidIBAN
        assert.strictEqual(errorMessage, 'invalid-external_account.iban')
      })
    })

    describe('invalid-account_number', () => {
      it('missing querystring account_number', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.missingAccountNumber
        assert.strictEqual(errorMessage, 'invalid-external_account.account_number')
      })
      it('invalid querystring account_number', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.invalidAccountNumber
        assert.strictEqual(errorMessage, 'invalid-external_account.account_number')
      })
    })

    describe('invalid-bsb_number', () => {
      it('missing querystring bsb_number', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.missingBSBNumber
        assert.strictEqual(errorMessage, 'invalid-external_account.bsb_number')
      })
      it('invalid querystring bsb_number', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.invalidBSBNumber
        assert.strictEqual(errorMessage, 'invalid-external_account.bsb_number')
      })
    })

    describe('invalid-institution_number', () => {
      it('missing querystring institution_number', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.missingInstitutionNumber
        assert.strictEqual(errorMessage, 'invalid-external_account.institution_number')
      })
      it('invalid querystring institution_number', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.invalidInstitutionNumber
        assert.strictEqual(errorMessage, 'invalid-external_account.institution_number')
      })
    })

    describe('invalid-transit_number', () => {
      it('missing querystring transit_number', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.missingTransitNumber
        assert.strictEqual(errorMessage, 'invalid-external_account.transit_number')
      })
      it('invalid querystring transit_number', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.invalidTransitNumber
        assert.strictEqual(errorMessage, 'invalid-external_account.transit_number')
      })
    })

    describe('invalid-sort_code', () => {
      it('missing querystring sort_code', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.missingSortCode
        assert.strictEqual(errorMessage, 'invalid-external_account.sort_code')
      })
      it('invalid querystring sort_code', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.invalidSortCode
        assert.strictEqual(errorMessage, 'invalid-external_account.sort_code')
      })
    })

    describe('invalid-clearing_code', () => {
      it('missing querystring clearing_code', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.missingClearingCode
        assert.strictEqual(errorMessage, 'invalid-external_account.clearing_code')
      })
      it('invalid querystring clearing_code', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.invalidClearingCode
        assert.strictEqual(errorMessage, 'invalid-external_account.clearing_code')
      })
    })

    describe('invalid-bank_code', () => {
      it('missing querystring bank_code', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.missingBankCode
        assert.strictEqual(errorMessage, 'invalid-external_account.bank_code')
      })
      it('invalid querystring bank_code', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.invalidBankCode
        assert.strictEqual(errorMessage, 'invalid-external_account.bank_code')
      })
    })

    describe('invalid-routing_number', () => {
      it('missing querystring routing_number', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.missingRoutingNumber
        assert.strictEqual(errorMessage, 'invalid-external_account.routing_number')
      })
      it('invalid querystring routing_number', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.invalidRoutingNumber
        assert.strictEqual(errorMessage, 'invalid-external_account.routing_number')
      })
    })
  })

  describe('receives', () => {
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
        country: 'DE',
        business_type: 'company'
      })
      let req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      // account holder type
      // currency
      // iban
      req.body = TestStripeAccounts.createBankingData('individual', TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country)
      cachedResponses.accountHolderType = cachedResponses.currency = cachedResponses.iban = await req.patch()
      // account number
      // bsb number
      await TestHelper.createStripeAccount(user, {
        country: 'AU',
        business_type: 'company'
      })
      req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      req.body = TestStripeAccounts.createBankingData('individual', TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country)
      cachedResponses.accountNumber = cachedResponses.BSBNUmber = await req.patch()
      // institution number
      // transit number
      await TestHelper.createStripeAccount(user, {
        country: 'CA',
        business_type: 'company'
      })
      req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      req.body = TestStripeAccounts.createBankingData('individual', TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country)
      cachedResponses.institutionNumber = cachedResponses.transitNumber = await req.patch()
      // sort code
      await TestHelper.createStripeAccount(user, {
        country: 'GB',
        business_type: 'company'
      })
      req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      req.body = TestStripeAccounts.createBankingData('individual', TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country)
      cachedResponses.sortCode = await req.patch()
      // branch code
      // clearing code
      await TestHelper.createStripeAccount(user, {
        country: 'HK',
        business_type: 'company'
      })
      req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      req.body = TestStripeAccounts.createBankingData('individual', TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country)
      cachedResponses.branchCode = cachedResponses.clearingCode = await req.patch()
      // bank code
      await TestHelper.createStripeAccount(user, {
        country: 'JP',
        business_type: 'company'
      })
      req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      req.body = TestStripeAccounts.createBankingData('individual', TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country)
      cachedResponses.bankCode = await req.patch()
      // routing number
      await TestHelper.createStripeAccount(user, {
        country: 'MY',
        business_type: 'company'
      })
      req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      req.body = TestStripeAccounts.createBankingData('individual', TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country)
      cachedResponses.routingNumber = await req.patch()
      cachedResponses.finished = true
    }

    it('required posted account_holder_type', async function () {
      await bundledData(this.test.currentRetry())
      const stripeAccountNow = cachedResponses.routingNumber
      assert.strictEqual(stripeAccountNow.stripeObject.external_accounts.total_count, 1)
    })

    it('required posted currency', async function () {
      await bundledData(this.test.currentRetry())
      const stripeAccountNow = cachedResponses.routingNumber
      assert.strictEqual(stripeAccountNow.stripeObject.external_accounts.total_count, 1)
    })

    it('optionally-required posted iban', async function () {
      await bundledData(this.test.currentRetry())
      const stripeAccountNow = cachedResponses.routingNumber
      assert.strictEqual(stripeAccountNow.stripeObject.external_accounts.total_count, 1)
    })

    it('optionally-required posted account_number', async function () {
      await bundledData(this.test.currentRetry())
      const stripeAccountNow = cachedResponses.routingNumber
      assert.strictEqual(stripeAccountNow.stripeObject.external_accounts.total_count, 1)
    })

    it('optionally-required posted bsb_number', async function () {
      await bundledData(this.test.currentRetry())
      const stripeAccountNow = cachedResponses.routingNumber
      assert.strictEqual(stripeAccountNow.stripeObject.external_accounts.total_count, 1)
    })

    it('optionally-required posted institution_number', async function () {
      await bundledData(this.test.currentRetry())
      const stripeAccountNow = cachedResponses.routingNumber
      assert.strictEqual(stripeAccountNow.stripeObject.external_accounts.total_count, 1)
    })

    it('optionally-required posted transit_number', async function () {
      await bundledData(this.test.currentRetry())
      const stripeAccountNow = cachedResponses.routingNumber
      assert.strictEqual(stripeAccountNow.stripeObject.external_accounts.total_count, 1)
    })

    it('optionally-required posted sort_code', async function () {
      await bundledData(this.test.currentRetry())
      const stripeAccountNow = cachedResponses.routingNumber
      assert.strictEqual(stripeAccountNow.stripeObject.external_accounts.total_count, 1)
    })

    it('optionally-required posted branch_code', async function () {
      await bundledData(this.test.currentRetry())
      const stripeAccountNow = cachedResponses.routingNumber
      assert.strictEqual(stripeAccountNow.stripeObject.external_accounts.total_count, 1)
    })

    it('optionally-required posted clearing_code', async function () {
      await bundledData(this.test.currentRetry())
      const stripeAccountNow = cachedResponses.routingNumber
      assert.strictEqual(stripeAccountNow.stripeObject.external_accounts.total_count, 1)
    })

    it('optionally-required posted bank_code', async function () {
      await bundledData(this.test.currentRetry())
      const stripeAccountNow = cachedResponses.routingNumber
      assert.strictEqual(stripeAccountNow.stripeObject.external_accounts.total_count, 1)
    })

    it('optionally-required posted routing_number', async function () {
      await bundledData(this.test.currentRetry())
      const stripeAccountNow = cachedResponses.routingNumber
      assert.strictEqual(stripeAccountNow.stripeObject.external_accounts.total_count, 1)
    })
  })

  describe('returns', () => {
    it('object', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'US',
        business_type: 'individual'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      req.body = TestStripeAccounts.createBankingData('individual', TestHelper.nextIdentity(), 'US')
      req.filename = __filename
      req.saveResponse = true
      const stripeAccountNow = await req.patch()
      assert.strictEqual(stripeAccountNow.object, 'stripeAccount')
      assert.strictEqual(stripeAccountNow.stripeObject.external_accounts.data.length, 1)
    })
  })
})
