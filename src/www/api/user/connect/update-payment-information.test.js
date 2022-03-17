/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')
const TestStripeAccounts = require('../../../../../test-stripe-accounts.js')
const DashboardTestHelper = require('@layeredapps/dashboard/test-helper.js')

describe('/api/user/connect/update-payment-information', function () {
  describe('exceptions', () => {
    const cachedResults = {}
    before(async () => {
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
        cachedResults.missingAccountHolderType = error.message
      }
      req.body.account_holder_type = 'invalid'
      try {
        await req.patch()
      } catch (error) {
        cachedResults.invalidAccountHolderType = error.message
      }
      // currency
      req.body = TestStripeAccounts.createBankingData('individual', TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country)
      delete (req.body.currency)
      try {
        await req.patch()
      } catch (error) {
        cachedResults.missingCurrency = error.message
      }
      req.body.currency = 'invalid'
      try {
        await req.patch()
      } catch (error) {
        cachedResults.invalidCurrency = error.message
      }
      // iban
      req.body = TestStripeAccounts.createBankingData('individual', TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country)
      delete (req.body.iban)
      try {
        await req.patch()
      } catch (error) {
        cachedResults.missingIBAN = error.message
      }
      req.body.iban = 'invalid'
      try {
        await req.patch()
      } catch (error) {
        cachedResults.invalidIBAN = error.message
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
        cachedResults.missingAccountNumber = error.message
      }
      req.body.account_number = 'invalid'
      try {
        await req.patch()
      } catch (error) {
        cachedResults.invalidAccountNumber = error.message
      }
      // bsb number
      req.body = TestStripeAccounts.createBankingData('individual', TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country)
      delete (req.body.bsb_number)
      try {
        await req.patch()
      } catch (error) {
        cachedResults.missingBSBNumber = error.message
      }
      req.body.bsb_number = 'invalid'
      try {
        await req.patch()
      } catch (error) {
        cachedResults.invalidBSBNumber = error.message
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
        cachedResults.missingInstitutionNumber = error.message
      }
      req.body.institution_number = 'invalid'
      try {
        await req.patch()
      } catch (error) {
        cachedResults.invalidInstitutionNumber = error.message
      }
      // transit number
      req.body = TestStripeAccounts.createBankingData('individual', TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country)
      delete (req.body.transit_number)
      try {
        await req.patch()
      } catch (error) {
        cachedResults.missingTransitNumber = error.message
      }
      req.body.transit_number = 'invalid'
      try {
        await req.patch()
      } catch (error) {
        cachedResults.invalidTransitNumber = error.message
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
        cachedResults.missingSortCode = error.message
      }
      req.body.sort_code = 'invalid'
      try {
        await req.patch()
      } catch (error) {
        cachedResults.invalidSortCode = error.message
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
        cachedResults.missingBranchCode = error.message
      }
      req.body.branch_code = 'invalid'
      try {
        await req.patch()
      } catch (error) {
        cachedResults.invalidBranchCode = error.message
      }
      // clearing code
      req.body = TestStripeAccounts.createBankingData('individual', TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country)
      delete (req.body.clearing_code)
      try {
        await req.patch()
      } catch (error) {
        cachedResults.missingClearingCode = error.message
      }
      req.body.clearing_code = 'invalid'
      try {
        await req.patch()
      } catch (error) {
        cachedResults.invalidClearingCode = error.message
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
        cachedResults.missingBankCode = error.message
      }
      req.body.bank_code = 'invalid'
      try {
        await req.patch()
      } catch (error) {
        cachedResults.invalidBankCode = error.message
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
        cachedResults.missingRoutingNumber = error.message
      }
      req.body.routing_number = 'invalid'
      try {
        await req.patch()
      } catch (error) {
        cachedResults.invalidRoutingNumber = error.message
      }
      // invalid stripe id
      req = TestHelper.createRequest('/api/user/connect/update-payment-information')
      req.account = user.account
      req.session = user.session
      req.body = TestStripeAccounts.createBankingData('individual', TestHelper.nextIdentity(), 'US')
      try {
        await req.patch()
      } catch (error) {
        cachedResults.missingStripeID = error.message
      }
      req = TestHelper.createRequest('/api/user/connect/update-payment-information?stripeid=invalid')
      req.account = user.account
      req.session = user.session
      req.body = TestStripeAccounts.createBankingData('individual', TestHelper.nextIdentity(), 'US')
      try {
        await req.patch()
      } catch (error) {
        cachedResults.invalidStripeID = error.message
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
        cachedResults.invalidAccount = error.message
      }
    })
    describe('invalid-stripeid', () => {
      it('missing querystring stripeid', async () => {
        const errorMessage = cachedResults.missingStripeID
        assert.strictEqual(errorMessage, 'invalid-stripeid')
      })

      it('invalid querystring stripeid', async () => {
        const errorMessage = cachedResults.invalidStripeID
        assert.strictEqual(errorMessage, 'invalid-stripeid')
      })
    })

    describe('invalid-account', () => {
      it('ineligible accessing account', async () => {
        const errorMessage = cachedResults.invalidAccount
        assert.strictEqual(errorMessage, 'invalid-account')
      })
    })

    describe('invalid-account_holder_type', () => {
      it('missing querystring account_holder_type', async () => {
        const errorMessage = cachedResults.missingAccountHolderType
        assert.strictEqual(errorMessage, 'invalid-account_holder_type')
      })
      it('invalid querystring account_holder_type', async () => {
        const errorMessage = cachedResults.invalidAccountHolderType
        assert.strictEqual(errorMessage, 'invalid-account_holder_type')
      })
    })

    describe('invalid-currency', () => {
      it('missing querystring currency', async () => {
        const errorMessage = cachedResults.missingCurrency
        assert.strictEqual(errorMessage, 'invalid-currency')
      })
      it('invalid querystring currency', async () => {
        const errorMessage = cachedResults.invalidCurrency
        assert.strictEqual(errorMessage, 'invalid-currency')
      })
    })

    describe('invalid-iban', () => {
      it('missing querystring iban', async () => {
        const errorMessage = cachedResults.missingIBAN
        assert.strictEqual(errorMessage, 'invalid-external_account.iban')
      })
      it('invalid querystring iban', async () => {
        const errorMessage = cachedResults.invalidIBAN
        assert.strictEqual(errorMessage, 'invalid-external_account.iban')
      })
    })

    describe('invalid-account_number', () => {
      it('missing querystring account_number', async () => {
        const errorMessage = cachedResults.missingAccountNumber
        assert.strictEqual(errorMessage, 'invalid-external_account.account_number')
      })
      it('invalid querystring account_number', async () => {
        const errorMessage = cachedResults.invalidAccountNumber
        assert.strictEqual(errorMessage, 'invalid-external_account.account_number')
      })
    })

    describe('invalid-bsb_number', () => {
      it('missing querystring bsb_number', async () => {
        const errorMessage = cachedResults.missingBSBNumber
        assert.strictEqual(errorMessage, 'invalid-external_account.bsb_number')
      })
      it('invalid querystring bsb_number', async () => {
        const errorMessage = cachedResults.invalidBSBNumber
        assert.strictEqual(errorMessage, 'invalid-external_account.bsb_number')
      })
    })

    describe('invalid-institution_number', () => {
      it('missing querystring institution_number', async () => {
        const errorMessage = cachedResults.missingInstitutionNumber
        assert.strictEqual(errorMessage, 'invalid-external_account.institution_number')
      })
      it('invalid querystring institution_number', async () => {
        const errorMessage = cachedResults.invalidInstitutionNumber
        assert.strictEqual(errorMessage, 'invalid-external_account.institution_number')
      })
    })

    describe('invalid-transit_number', () => {
      it('missing querystring transit_number', async () => {
        const errorMessage = cachedResults.missingTransitNumber
        assert.strictEqual(errorMessage, 'invalid-external_account.transit_number')
      })
      it('invalid querystring transit_number', async () => {
        const errorMessage = cachedResults.invalidTransitNumber
        assert.strictEqual(errorMessage, 'invalid-external_account.transit_number')
      })
    })

    describe('invalid-sort_code', () => {
      it('missing querystring sort_code', async () => {
        const errorMessage = cachedResults.missingSortCode
        assert.strictEqual(errorMessage, 'invalid-external_account.sort_code')
      })
      it('invalid querystring sort_code', async () => {
        const errorMessage = cachedResults.invalidSortCode
        assert.strictEqual(errorMessage, 'invalid-external_account.sort_code')
      })
    })

    describe('invalid-clearing_code', () => {
      it('missing querystring clearing_code', async () => {
        const errorMessage = cachedResults.missingClearingCode
        assert.strictEqual(errorMessage, 'invalid-external_account.clearing_code')
      })
      it('invalid querystring clearing_code', async () => {
        const errorMessage = cachedResults.invalidClearingCode
        assert.strictEqual(errorMessage, 'invalid-external_account.clearing_code')
      })
    })

    describe('invalid-bank_code', () => {
      it('missing querystring bank_code', async () => {
        const errorMessage = cachedResults.missingBankCode
        assert.strictEqual(errorMessage, 'invalid-external_account.bank_code')
      })
      it('invalid querystring bank_code', async () => {
        const errorMessage = cachedResults.invalidBankCode
        assert.strictEqual(errorMessage, 'invalid-external_account.bank_code')
      })
    })

    describe('invalid-routing_number', () => {
      it('missing querystring routing_number', async () => {
        const errorMessage = cachedResults.missingRoutingNumber
        assert.strictEqual(errorMessage, 'invalid-external_account.routing_number')
      })
      it('invalid querystring routing_number', async () => {
        const errorMessage = cachedResults.invalidRoutingNumber
        assert.strictEqual(errorMessage, 'invalid-external_account.routing_number')
      })
    })
  })

  describe('receives', () => {
    const cachedResults = {}
    before(async () => {
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
      cachedResults.accountHolderType = cachedResults.currency = cachedResults.iban = await req.patch()
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
      cachedResults.accountNumber = cachedResults.BSBNUmber = await req.patch()
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
      cachedResults.institutionNumber = cachedResults.transitNumber = await req.patch()
      // sort code
      await TestHelper.createStripeAccount(user, {
        country: 'GB',
        business_type: 'company'
      })
      req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      req.body = TestStripeAccounts.createBankingData('individual', TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country)
      cachedResults.sortCode = await req.patch()
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
      cachedResults.branchCode = cachedResults.clearingCode = await req.patch()
      // bank code
      await TestHelper.createStripeAccount(user, {
        country: 'JP',
        business_type: 'company'
      })
      req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      req.body = TestStripeAccounts.createBankingData('individual', TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country)
      cachedResults.bankCode = await req.patch()
      // routing number
      await TestHelper.createStripeAccount(user, {
        country: 'MY',
        business_type: 'company'
      })
      req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      req.body = TestStripeAccounts.createBankingData('individual', TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country)
      cachedResults.routingNumber = await req.patch()
    })

    it('required posted account_holder_type', () => {
      const stripeAccountNow = cachedResults.routingNumber
      assert.strictEqual(stripeAccountNow.stripeObject.external_accounts.total_count, 1)
    })

    it('required posted currency', () => {
      const stripeAccountNow = cachedResults.routingNumber
      assert.strictEqual(stripeAccountNow.stripeObject.external_accounts.total_count, 1)
    })

    it('optionally-required posted iban', () => {
      const stripeAccountNow = cachedResults.routingNumber
      assert.strictEqual(stripeAccountNow.stripeObject.external_accounts.total_count, 1)
    })

    it('optionally-required posted account_number', () => {
      const stripeAccountNow = cachedResults.routingNumber
      assert.strictEqual(stripeAccountNow.stripeObject.external_accounts.total_count, 1)
    })

    it('optionally-required posted bsb_number', () => {
      const stripeAccountNow = cachedResults.routingNumber
      assert.strictEqual(stripeAccountNow.stripeObject.external_accounts.total_count, 1)
    })

    it('optionally-required posted institution_number', () => {
      const stripeAccountNow = cachedResults.routingNumber
      assert.strictEqual(stripeAccountNow.stripeObject.external_accounts.total_count, 1)
    })

    it('optionally-required posted transit_number', () => {
      const stripeAccountNow = cachedResults.routingNumber
      assert.strictEqual(stripeAccountNow.stripeObject.external_accounts.total_count, 1)
    })

    it('optionally-required posted sort_code', () => {
      const stripeAccountNow = cachedResults.routingNumber
      assert.strictEqual(stripeAccountNow.stripeObject.external_accounts.total_count, 1)
    })

    it('optionally-required posted branch_code', () => {
      const stripeAccountNow = cachedResults.routingNumber
      assert.strictEqual(stripeAccountNow.stripeObject.external_accounts.total_count, 1)
    })

    it('optionally-required posted clearing_code', () => {
      const stripeAccountNow = cachedResults.routingNumber
      assert.strictEqual(stripeAccountNow.stripeObject.external_accounts.total_count, 1)
    })

    it('optionally-required posted bank_code', () => {
      const stripeAccountNow = cachedResults.routingNumber
      assert.strictEqual(stripeAccountNow.stripeObject.external_accounts.total_count, 1)
    })

    it('optionally-required posted routing_number', () => {
      const stripeAccountNow = cachedResults.routingNumber
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
