/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')
const DashboardTestHelper = require('@layeredapps/dashboard/test-helper.js')
const TestStripeAccounts = require('../../../../../test-stripe-accounts.js')

describe('/api/user/connect/set-stripe-account-submitted', function () {
  before(TestHelper.disableMetrics)
  after(TestHelper.enableMetrics)
  let cachedResponses
  async function bundledData (retryNumber) {
    if (retryNumber > 0) {
      cachedResponses = {}
    }
    if (cachedResponses && cachedResponses.finished) {
      return
    }
    cachedResponses = {}
    await DashboardTestHelper.setupBeforeEach()
    await TestHelper.setupBeforeEach()
    const user = await TestHelper.createUser()
    // company issues
    await TestHelper.createStripeAccount(user, {
      country: 'DE',
      business_type: 'company'
    })
    const user2 = await TestHelper.createUser()
    let req = TestHelper.createRequest(`/api/user/connect/set-stripe-account-submitted?stripeid=${user.stripeAccount.stripeid}`)
    req.account = user2.account
    req.session = user2.session
    try {
      await req.patch()
    } catch (error) {
      cachedResponses.invalidAccount = error.message
    }
    // 1) missing payment details
    req = TestHelper.createRequest(`/api/user/connect/set-stripe-account-submitted?stripeid=${user.stripeAccount.stripeid}`)
    req.account = user.account
    req.session = user.session
    try {
      await req.patch()
    } catch (error) {
      cachedResponses.companyMissingPaymentDetails = error.message
    }
    const companyBankingData = TestStripeAccounts.createBankingData(user.stripeAccount.stripeObject.business_type, user.profile, user.stripeAccount.stripeObject.country)
    await TestHelper.createExternalAccount(user, companyBankingData)
    await TestStripeAccounts.waitForAccountFieldToLeave(user, 'external_account')
    // 2) missing submitted owners
    try {
      await req.patch()
    } catch (error) {
      cachedResponses.companyMissingOwners = error.message
    }
    await TestHelper.submitCompanyOwners(user)
    // 3) missing submitted directors
    try {
      await req.patch()
    } catch (error) {
      cachedResponses.companyMissingDirectors = error.message
    }
    await TestHelper.submitCompanyDirectors(user)
    // 4) missing submitted executives
    try {
      await req.patch()
    } catch (error) {
      cachedResponses.companyMissingExecutives = error.message
    }
    await TestHelper.submitCompanyExecutives(user)
    // 5) missing person details
    await TestHelper.createPerson(user, {
      relationship_representative: 'true',
      relationship_executive: user.stripeAccount.requiresExecutives ? 'true' : undefined,
      relationship_title: 'SVP Testing',
      relationship_percent_ownership: 0
    })
    req = TestHelper.createRequest(`/api/user/connect/set-stripe-account-submitted?stripeid=${user.stripeAccount.stripeid}`)
    req.account = user.account
    req.session = user.session
    try {
      await req.patch()
    } catch (error) {
      cachedResponses.invalidPerson = error.message
    }
    await TestStripeAccounts.waitForWebhook('person.created', (stripeEvent) => {
      return stripeEvent.data.object.id === user.representative.personid
    })
    await TestStripeAccounts.waitForPersonField(user, 'representative', 'first_name')
    const representativeData = TestStripeAccounts.createPersonData(TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country, user.representative.stripeObject)
    await TestHelper.updatePerson(user, user.representative, representativeData)
    await TestStripeAccounts.waitForPersonField(user, 'representative', 'verification.document')
    const representativeUploadData = TestStripeAccounts.createPersonUploadData(user.representative.stripeObject)
    if (representativeUploadData && Object.keys(representativeUploadData).length) {
      await TestHelper.updatePerson(user, user.representative, {}, representativeUploadData)
      await TestStripeAccounts.waitForPersonFieldToLeave(user, 'representative', 'verification.document')
    }
    // 6) missing registration details
    try {
      await req.patch()
    } catch (error) {
      cachedResponses.companyMissingRegistrationDetails = error.message
    }
    await TestStripeAccounts.waitForAccountField(user, 'company.name')
    const companyAccountData = TestStripeAccounts.createAccountData(user.profile, user.stripeAccount.stripeObject.country, user.stripeAccount.stripeObject)
    await TestHelper.updateStripeAccount(user, companyAccountData)
    // 7) submitted company
    cachedResponses.submittedCompany = await req.patch()
    // 8) company is already submitted
    try {
      await req.patch()
    } catch (error) {
      cachedResponses.companyAlreadySubmitted = error.message
    }
    // individual
    await TestHelper.createStripeAccount(user, {
      country: 'DE',
      business_type: 'individual'
    })
    req = TestHelper.createRequest(`/api/user/connect/set-stripe-account-submitted?stripeid=${user.stripeAccount.stripeid}`)
    req.account = user.account
    req.session = user.session
    // 1) missing banking details
    try {
      await req.patch()
    } catch (error) {
      cachedResponses.individualMissingPaymentDetails = error.message
    }
    const individualBankingData = TestStripeAccounts.createBankingData(user.stripeAccount.stripeObject.business_type, user.profile, user.stripeAccount.stripeObject.country)
    await TestHelper.createExternalAccount(user, individualBankingData)
    await TestStripeAccounts.waitForAccountFieldToLeave(user, 'external_account')
    // 2) missing registration details
    try {
      await req.patch()
    } catch (error) {
      cachedResponses.individualMissingRegistrationDetails = error.message
    }
    const individualAccountData = TestStripeAccounts.createAccountData(user.profile, user.stripeAccount.stripeObject.country, user.stripeAccount.stripeObject)
    await TestHelper.updateStripeAccount(user, individualAccountData)
    // 3) submitted individual
    req.filename = __filename
    req.saveResponse = true
    cachedResponses.submittedIndividual = await req.patch()
    // 4) already submitted
    try {
      await req.patch()
    } catch (error) {
      cachedResponses.individualAlreadySubmitted = error.message
    }
    cachedResponses.finished = true
  }

  describe('exceptions', () => {
    describe('invalid-stripeid', () => {
      it('missing querystring stripeid', async function () {
        await bundledData(this.test.currentRetry())
        const user = await TestHelper.createUser()
        const req = TestHelper.createRequest('/api/user/connect/set-stripe-account-submitted')
        req.account = user.account
        req.session = user.session
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-stripeid')
      })

      it('invalid querystring stripeid', async function () {
        await bundledData(this.test.currentRetry())
        const user = await TestHelper.createUser()
        const req = TestHelper.createRequest('/api/user/connect/set-stripe-account-submitted?stripeid=invalid')
        req.account = user.account
        req.session = user.session
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-stripeid')
      })
    })

    describe('invalid-stripe-account', () => {
      it('ineligible Stripe company account is submitted', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.companyAlreadySubmitted
        assert.strictEqual(errorMessage, 'invalid-stripe-account')
      })
      it('ineligible Stripe individual account is submitted', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.individualAlreadySubmitted
        assert.strictEqual(errorMessage, 'invalid-stripe-account')
      })
    })

    describe('invalid-account', () => {
      it('ineligible accessing account', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.invalidAccount
        assert.strictEqual(errorMessage, 'invalid-account')
      })
    })

    describe('invalid-payment-details', () => {
      it('ineligible Stripe company account missing payment details', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.companyMissingPaymentDetails
        assert.strictEqual(errorMessage, 'invalid-payment-details')
      })

      it('ineligible Stripe individual account missing payment details', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.individualMissingPaymentDetails
        assert.strictEqual(errorMessage, 'invalid-payment-details')
      })
    })

    describe('invalid-registration', () => {
      it('ineligible Stripe company account missing information', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.companyMissingRegistrationDetails
        assert.strictEqual(errorMessage, 'invalid-registration')
      })

      it('ineligible Stripe individual account missing information', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.individualMissingRegistrationDetails
        assert.strictEqual(errorMessage, 'invalid-registration')
      })
    })

    describe('invalid-person', () => {
      it('ineligible company person missing information', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.invalidPerson
        assert.strictEqual(errorMessage, 'invalid-person')
      })
    })

    describe('invalid-company-owner', () => {
      it('ineligible company owners not submitted', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.companyMissingOwners
        assert.strictEqual(errorMessage, 'invalid-company-owner')
      })
    })

    describe('invalid-director', () => {
      it('ineligible company directors not submitted', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.companyMissingDirectors
        assert.strictEqual(errorMessage, 'invalid-company-director')
      })
    })

    describe('invalid-executive', () => {
      it('ineligible company executives not submitted', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.companyMissingExecutives
        assert.strictEqual(errorMessage, 'invalid-company-executive')
      })
    })
  })

  describe('returns', () => {
    it('object (individual)', async () => {
      const stripeAccountNow = cachedResponses.submittedIndividual
      assert.notStrictEqual(stripeAccountNow.submittedAt, undefined)
      assert.notStrictEqual(stripeAccountNow.submittedAt, null)
    })

    it('object (company)', async () => {
      const stripeAccountNow = cachedResponses.submittedCompany
      assert.notStrictEqual(stripeAccountNow.submittedAt, undefined)
      assert.notStrictEqual(stripeAccountNow.submittedAt, null)
    })
  })
})
