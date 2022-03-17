/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')
const TestStripeAccounts = require('../../../../../test-stripe-accounts.js')
const DashboardTestHelper = require('@layeredapps/dashboard/test-helper.js')
const testData = require('../../../../../test-data.json')

describe('/api/user/connect/update-stripe-account', function () {
  describe('exceptions', async () => {
    const cachedResults = {}
    before(async () => {
      await DashboardTestHelper.setupBeforeEach()
      await TestHelper.setupBeforeEach()
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'AT',
        business_type: 'individual'
      })
      // invalid business profile mcc
      let req = TestHelper.createRequest(`/api/user/connect/update-stripe-account?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      req.body = { business_profile_mcc: '-1' }
      try {
        await req.patch()
      } catch (error) {
        cachedResults['invalid-business_profile_mcc'] = error.message
      }
      // invalid business profile url
      req.body = { business_profile_url: 'asdf' }
      try {
        await req.patch()
      } catch (error) {
        cachedResults['invalid-business_profile_url'] = error.message
      }
      // TODO: unclear what limits are
      // invalid business profile product description
      // req.body = { business_profile_url: 'asdf' }
      // try {
      //   await req.patch()
      // } catch (error) {
      //   cachedResults['invalid-business_profile_product_description'] = ''
      // }
      //
      // invalid individual date of birth
      req = TestHelper.createRequest(`/api/user/connect/update-stripe-account?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      req.body = { individual_dob_day: '-1', individual_dob_month: '1', individual_dob_year: 2000 }
      try {
        await req.patch()
      } catch (error) {
        cachedResults['invalid-individual_dob_day'] = error.message
      }
      req.body = { individual_dob_day: '', individual_dob_month: '-1', individual_dob_year: 2000 }
      try {
        await req.patch()
      } catch (error) {
        cachedResults['missing-individual_dob_day'] = error.message
      }
      req.body = { individual_dob_day: '1', individual_dob_month: '-1', individual_dob_year: 2000 }
      try {
        await req.patch()
      } catch (error) {
        cachedResults['invalid-individual_dob_month'] = error.message
      }
      req.body = { individual_dob_day: '1', individual_dob_month: '', individual_dob_year: 2000 }
      try {
        await req.patch()
      } catch (error) {
        cachedResults['missing-individual_dob_month'] = error.message
      }
      req.body = { individual_dob_day: '1', individual_dob_month: '1', individual_dob_year: 'invalid' }
      try {
        await req.patch()
      } catch (error) {
        cachedResults['invalid-individual_dob_year'] = error.message
      }
      req.body = { individual_dob_day: '1', individual_dob_month: '1', individual_dob_year: '' }
      try {
        await req.patch()
      } catch (error) {
        cachedResults['missing-individual_dob_year'] = error.message
      }
      // invalid individual email
      req.body = { individual_email: '-1' }
      try {
        await req.patch()
      } catch (error) {
        cachedResults['invalid-individual_email'] = error.message
      }
      // invalid individual phone
      req.body = { individual_phone: '-1' }
      try {
        await req.patch()
      } catch (error) {
        cachedResults['invalid-individual_phone'] = error.message
      }
      // invalid individual country
      req.body = { individual_address_country: '-1' }
      try {
        await req.patch()
      } catch (error) {
        cachedResults['invalid-individual_address_country'] = error.message
      }
      // invalid individual state
      await TestHelper.createStripeAccount(user, {
        country: 'AU',
        business_type: 'individual'
      })
      req = TestHelper.createRequest(`/api/user/connect/update-stripe-account?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      req.body = { individual_address_state: '-1' }
      try {
        await req.patch()
      } catch (error) {
        cachedResults['invalid-individual_address_state'] = error.message
      }
      // individual id number
      await TestHelper.createStripeAccount(user, {
        country: 'BR',
        business_type: 'individual'
      })
      req = TestHelper.createRequest(`/api/user/connect/update-stripe-account?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      req.body = { individual_id_number: '-1' }
      try {
        await req.patch()
      } catch (error) {
        cachedResults['invalid-individual_id_number'] = error.message
      }
      // political exposure
      req.body = { individual_political_exposure: '-1' }
      try {
        await req.patch()
      } catch (error) {
        cachedResults['invalid-individual_political_exposure'] = error.message
      }
      // invalid individual nationality
      await TestHelper.createStripeAccount(user, {
        country: 'SG',
        business_type: 'individual'
      })
      req = TestHelper.createRequest(`/api/user/connect/update-stripe-account?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      req.body = { individual_nationalite: '-1' }
      try {
        await req.patch()
      } catch (error) {
        cachedResults['invalid-individual_nationality'] = error.message
      }
      // invalid individual ssn_last_4
      await TestHelper.createStripeAccount(user, {
        country: 'US',
        business_type: 'individual'
      })
      req = TestHelper.createRequest(`/api/user/connect/update-stripe-account?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      req.body = { individual_ssn_last_4: '-1' }
      try {
        await req.patch()
      } catch (error) {
        cachedResults['invalid-individual_ssn_last_4'] = error.message
      }
      // invalid company state
      await TestHelper.createStripeAccount(user, {
        country: 'AU',
        business_type: 'company'
      })
      req = TestHelper.createRequest(`/api/user/connect/update-stripe-account?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      req.body = { company_address_state: '-1' }
      try {
        await req.patch()
      } catch (error) {
        cachedResults['invalid-company_address_state'] = error.message
      }
      // invalid company country
      await TestHelper.createStripeAccount(user, {
        country: 'AU',
        business_type: 'company'
      })
      req = TestHelper.createRequest(`/api/user/connect/update-stripe-account?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      req.body = { company_address_country: '-1' }
      try {
        await req.patch()
      } catch (error) {
        cachedResults['invalid-company_address_country'] = error.message
      }
      // invalid company registration number
      req.body = { individual_registration_number: '-1' }
      try {
        await req.patch()
      } catch (error) {
        cachedResults['invalid-individual_registration_number'] = error.message
      }
      // invalid details in kana
      // TODO: kana line1, town and postal code do not throw invalid exceptions
      await TestHelper.createStripeAccount(user, {
        country: 'JP',
        business_type: 'company'
      })
      req = TestHelper.createRequest(`/api/user/connect/update-stripe-account?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      req.body = { company_address_kana_city: 'invalid', company_address_kana_postal_code: testData.addresses.JP.kana_postal_code }
      try {
        await req.patch()
      } catch (error) {
        cachedResults['invalid-company_address_kana_city'] = error.message
      }
      req.body = { company_address_kana_line1: 'invalid', company_address_kana_postal_code: testData.addresses.JP.kana_postal_code }
      try {
        await req.patch()
      } catch (error) {
        cachedResults['invalid-company_address_kana_line1'] = error.message
      }
      req.body = { company_address_kana_postal_code: 'invalid' }
      try {
        await req.patch()
      } catch (error) {
        cachedResults['invalid-company_address_kana_postal_code'] = error.message
      }
      req.body = { company_address_kana_state: 'x', company_address_kana_postal_code: testData.addresses.JP.kana_postal_code }
      try {
        await req.patch()
      } catch (error) {
        cachedResults['invalid-company_address_kana_state'] = error.message
      }
      req.body = { company_address_kana_town: 'invalid', company_address_kana_postal_code: testData.addresses.JP.kana_postal_code }
      try {
        await req.patch()
      } catch (error) {
        cachedResults['invalid-company_address_kana_town'] = error.message
      }
      req.body = { company_name_kana: 'invalid', company_address_kana_postal_code: testData.addresses.JP.kana_postal_code }
      try {
        await req.patch()
      } catch (error) {
        cachedResults['invalid-company_name_kana'] = error.message
      }
      // invalid details in kanji
      // TODO: kanji line1, town, city, state and postal code do not throw invalid exceptions
      req = TestHelper.createRequest(`/api/user/connect/update-stripe-account?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      req.body = { company_address_kanji_city: 'invalid', company_address_kanji_postal_code: testData.addresses.JP.kanji_postal_code }
      try {
        await req.patch()
      } catch (error) {
        cachedResults['invalid-company_address_kanji_city'] = error.message
      }
      req.body = { company_address_kanji_line1: 'invalid', company_address_kanji_postal_code: testData.addresses.JP.kanji_postal_code }
      try {
        await req.patch()
      } catch (error) {
        cachedResults['invalid-company_address_kanji_line1'] = error.message
      }
      req.body = { company_address_kanji_postal_code: 'invalid' }
      try {
        await req.patch()
      } catch (error) {
        cachedResults['invalid-company_address_kanji_postal_code'] = error.message
      }
      req.body = { company_address_kanji_state: 'invalid', company_address_kanji_postal_code: testData.addresses.JP.kanji_postal_code }
      try {
        await req.patch()
      } catch (error) {
        cachedResults['invalid-company_address_kanji_state'] = error.message
      }
      req.body = { company_address_kanji_town: 'invalid', company_address_kanji_postal_code: testData.addresses.JP.kanji_postal_code }
      try {
        await req.patch()
      } catch (error) {
        cachedResults['invalid-company_address_kanji_town'] = error.message
      }
      req.body = { company_name_kanji: 'invalid' }
      try {
        await req.patch()
      } catch (error) {
        cachedResults['invalid-company_name_kanji'] = error.message
      }
      // invalid account
      const user2 = await TestHelper.createUser()
      req = TestHelper.createRequest(`/api/user/connect/update-stripe-account?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user2.account
      req.session = user2.session
      req.body = { email: 'email@address.com' }
      try {
        await req.patch(req)
      } catch (error) {
        cachedResults.invalidAccount = error.message
      }
      // invalid stripe account
      const user3 = await TestStripeAccounts.createIndividualReadyForSubmission('US')
      req = TestHelper.createRequest(`/api/user/connect/update-stripe-account?stripeid=${user3.stripeAccount.stripeid}`)
      req.account = user3.account
      req.session = user3.session
      req.body = TestStripeAccounts.createAccountData(TestHelper.nextIdentity(), 'US', user3.stripeAccount.stripeObject)
      try {
        await req.patch(req)
      } catch (error) {
        cachedResults.invalidStripeAccount = error.message
      }
      // missing and invalid token
      global.stripeJS = 3
      await TestHelper.createStripeAccount(user, {
        country: 'GB',
        business_type: 'company'
      })
      req.account = user.account
      req.session = user.session
      req.body = {}
      try {
        await req.patch()
      } catch (error) {
        cachedResults.missingToken = error.message
      }
      req.body = {
        token: 'xxxx'
      }
      try {
        await req.patch()
      } catch (error) {
        cachedResults.invalidToken = error.message
      }
    })
    describe('invalid-stripeid', () => {
      it('missing querystring stripeid', async () => {
        const user = await TestHelper.createUser()
        const req = TestHelper.createRequest('/api/user/connect/update-stripe-account')
        req.account = user.account
        req.session = user.session
        req.body = {}
        let errorMessage
        try {
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-stripeid')
      })

      it('invalid querystring stripeid', async () => {
        const user = await TestHelper.createUser()
        const req = TestHelper.createRequest('/api/user/connect/update-stripe-account?stripeid=invalid')
        req.account = user.account
        req.session = user.session
        req.body = {}
        let errorMessage
        try {
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-stripeid')
      })
    })

    describe('invalid-account', () => {
      it('ineligible accessing account', async () => {
        const errorMessage = cachedResults.invalidAccount
        assert.strictEqual(errorMessage, 'invalid-account')
      })
    })

    describe('invalid-stripe-account', () => {
      it('ineligible stripe account', async () => {
        const errorMessage = cachedResults.invalidStripeAccount
        assert.strictEqual(errorMessage, 'invalid-stripe-account')
      })
    })

    describe('invalid-individual_dob_day', () => {
      it('missing posted individual_dob_day', async () => {
        const errorMessage = cachedResults['invalid-individual_dob_day']
        assert.strictEqual(errorMessage, 'invalid-individual_dob_day')
      })
      it('invalid posted individual_dob_day', async () => {
        const errorMessage = cachedResults['invalid-individual_dob_day']
        assert.strictEqual(errorMessage, 'invalid-individual_dob_day')
      })
    })
    describe('invalid-individual_dob_month', () => {
      it('missing posted individual_dob_month', async () => {
        const errorMessage = cachedResults['invalid-individual_dob_month']
        assert.strictEqual(errorMessage, 'invalid-individual_dob_month')
      })
      it('invalid posted individual_dob_month', async () => {
        const errorMessage = cachedResults['invalid-individual_dob_month']
        assert.strictEqual(errorMessage, 'invalid-individual_dob_month')
      })
    })
    describe('invalid-individual_dob_year', () => {
      it('missing posted individual_dob_month', async () => {
        const errorMessage = cachedResults['invalid-individual_dob_month']
        assert.strictEqual(errorMessage, 'invalid-individual_dob_month')
      })
      it('invalid posted individual_dob_month', async () => {
        const errorMessage = cachedResults['invalid-individual_dob_month']
        assert.strictEqual(errorMessage, 'invalid-individual_dob_month')
      })
    })

    describe('invalid-individual_address_country', () => {
      it('invalid posted individual_address_country', async () => {
        const errorMessage = cachedResults['invalid-individual_address_country']
        assert.strictEqual(errorMessage, 'invalid-individual_address_country')
      })
    })

    describe('invalid-individual_address_state', () => {
      it('invalid posted individual_address_state', async () => {
        const errorMessage = cachedResults['invalid-individual_address_state']
        assert.strictEqual(errorMessage, 'invalid-individual_address_state')
      })
    })

    describe('invalid-individual_id_number', () => {
      it('invalid posted individual_id_number', async () => {
        const errorMessage = cachedResults['invalid-individual_id_number']
        assert.strictEqual(errorMessage, 'invalid-individual_id_number')
      })
    })

    describe('invalid-individual_ssn_last_4', () => {
      it('invalid posted individual_ssn_last_4', async () => {
        const errorMessage = cachedResults['invalid-individual_ssn_last_4']
        assert.strictEqual(errorMessage, 'invalid-individual_ssn_last_4')
      })
    })

    describe('invalid-individual_phone', () => {
      it('invalid posted individual_phone', async () => {
        const errorMessage = cachedResults['invalid-individual_phone']
        assert.strictEqual(errorMessage, 'invalid-individual_phone')
      })
    })

    describe('invalid-company_address_country', () => {
      it('invalid posted company_address.country', async () => {
        const errorMessage = cachedResults['invalid-company_address_country']
        assert.strictEqual(errorMessage, 'invalid-company_address_country')
      })
    })

    describe('invalid-company_address_state', () => {
      it('invalid posted company_address.state', async () => {
        const errorMessage = cachedResults['invalid-company_address_state']
        assert.strictEqual(errorMessage, 'invalid-company_address_state')
      })
    })

    // describe('invalid-company_address_kana_line1', () => {
    //   it(`invalid posted company_address_kana_line1`, async () => {
    //     const errorMessage = cachedResults['invalid-company_address_kana_line1']
    //     assert.strictEqual(errorMessage, 'invalid-company_address_kana_line1')
    //   })
    // })

    describe('invalid-company_address_kana_city', () => {
      it('invalid posted company_address_kana_city', async () => {
        const errorMessage = cachedResults['invalid-company_address_kana_city']
        assert.strictEqual(errorMessage, 'invalid-company_address_kana_city')
      })
    })

    describe('invalid-company_address_kana_town', () => {
      it('invalid posted company_address_kana_town', async () => {
        const errorMessage = cachedResults['invalid-company_address_kana_town']
        assert.strictEqual(errorMessage, 'invalid-company_address_kana_town')
      })
    })

    // describe('invalid-company_address_kana_state', () => {
    //   it(`invalid posted company_address_kana_state`, async () => {
    //     const errorMessage = cachedResults['invalid-company_address_kana_state']
    //     assert.strictEqual(errorMessage, 'invalid-company_address_kana_state')
    //   })
    // })

    // describe('invalid-company_address_kana_postal_code', () => {
    //   it(`invalid posted company_address_kana_postal_code`, async () => {
    //     const errorMessage = cachedResults['invalid-company_address_kana_postal_code']
    //     assert.strictEqual(errorMessage, 'invalid-company_address_kana_postal_code')
    //   })
    // })

    // describe('invalid-company_address_kanji_line1', () => {
    //   it(`invalid posted company_address_kanji_line1`, async () => {
    //     const errorMessage = cachedResults['invalid-company_address_kanji_line1']
    //     assert.strictEqual(errorMessage, 'invalid-company_address_kanji_line1')
    //   })
    // })

    // describe('invalid-company_address_kanji_city', () => {
    //   it(`invalid posted company_address_kanji_city`, async () => {
    //     const errorMessage = cachedResults['invalid-company_address_kanji_city']
    //     assert.strictEqual(errorMessage, 'invalid-company_address_kanji_city')
    //   })
    // })

    // describe('invalid-company_address_kanji_town', () => {
    //   it(`invalid posted company_address_kanji_town`, async () => {
    //     const errorMessage = cachedResults['invalid-company_address_kanji_town']
    //     assert.strictEqual(errorMessage, 'invalid-company_address_kanji_town')
    //   })
    // })

    // describe('invalid-company_address_kanji_state', () => {
    //   it(`invalid posted company_address_kanji_state`, async () => {
    //     const errorMessage = cachedResults['invalid-company_address_kanji_state']
    //     assert.strictEqual(errorMessage, 'invalid-company_address_kanji_state')
    //   })
    // })

    // describe('invalid-company_address_kanji_postal_code', () => {
    //   it(`invalid posted company_address_kanji_postal_code`, async () => {
    //     const errorMessage = cachedResults['invalid-company_address_kanji_postal_code']
    //     assert.strictEqual(errorMessage, 'invalid-company_address_kanji_postal_code')
    //   })
    // })

    describe('invalid-token', () => {
      it('missing posted token', async () => {
        const errorMessage = cachedResults.missingToken
        assert.strictEqual(errorMessage, 'invalid-token')
      })

      it('invalid posted token', async () => {
        const errorMessage = cachedResults.invalidToken
        assert.strictEqual(errorMessage, 'invalid-token')
      })
    })
  })

  describe('receives', () => {
    const cachedResponses = {}
    before(async () => {
      await DashboardTestHelper.setupBeforeEach()
      await TestHelper.setupBeforeEach()
      const user = await TestHelper.createUser()
      // most fields are shared by all countries
      await TestHelper.createStripeAccount(user, {
        country: 'AT',
        business_type: 'company'
      })
      let req = TestHelper.createRequest(`/api/user/connect/update-stripe-account?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      req.body = TestStripeAccounts.createAccountData(TestHelper.nextIdentity(), 'AT', user.stripeAccount.stripeObject)
      let result = await req.patch()
      for (const field in req.body) {
        cachedResponses[field] = result.stripeObject
      }
      // some fields only by AU
      await TestHelper.createStripeAccount(user, {
        country: 'AU',
        business_type: 'company'
      })
      req = TestHelper.createRequest(`/api/user/connect/update-stripe-account?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      req.body = TestStripeAccounts.createAccountData(TestHelper.nextIdentity(), 'AU', user.stripeAccount.stripeObject)
      result = await req.patch()
      for (const field in req.body) {
        cachedResponses[field] = cachedResponses[field] || result.stripeObject
      }
      // some fields only by BR
      await TestHelper.createStripeAccount(user, {
        country: 'BR',
        business_type: 'company'
      })
      req = TestHelper.createRequest(`/api/user/connect/update-stripe-account?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      req.body = TestStripeAccounts.createAccountData(TestHelper.nextIdentity(), 'BR', user.stripeAccount.stripeObject)
      result = await req.patch()
      for (const field in req.body) {
        cachedResponses[field] = cachedResponses[field] || result.stripeObject
      }
      // some fields only by JP
      await TestHelper.createStripeAccount(user, {
        country: 'JP',
        business_type: 'company'
      })
      req = TestHelper.createRequest(`/api/user/connect/update-stripe-account?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      req.body = TestStripeAccounts.createAccountData(TestHelper.nextIdentity(), 'JP', user.stripeAccount.stripeObject)
      result = await req.patch()
      for (const field in req.body) {
        cachedResponses[field] = cachedResponses[field] || result.stripeObject
      }
      await TestHelper.createStripeAccount(user, {
        country: 'AT',
        business_type: 'individual'
      })
      req = TestHelper.createRequest(`/api/user/connect/update-stripe-account?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      req.body = TestStripeAccounts.createAccountData(TestHelper.nextIdentity(), 'AT', user.stripeAccount.stripeObject)
      req.body.individual_email = 'email@address.com'
      result = await req.patch()
      for (const field in req.body) {
        cachedResponses[field] = result.stripeObject
      }
      // some individual fields only by AU
      await TestHelper.createStripeAccount(user, {
        country: 'AU',
        business_type: 'individual'
      })
      req = TestHelper.createRequest(`/api/user/connect/update-stripe-account?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      req.body = TestStripeAccounts.createAccountData(TestHelper.nextIdentity(), 'AU', user.stripeAccount.stripeObject)
      result = await req.patch()
      for (const field in req.body) {
        cachedResponses[field] = cachedResponses[field] || result.stripeObject
      }
      // some individual fields only by BR
      await TestHelper.createStripeAccount(user, {
        country: 'BR',
        business_type: 'individual'
      })
      req = TestHelper.createRequest(`/api/user/connect/update-stripe-account?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      req.body = TestStripeAccounts.createAccountData(TestHelper.nextIdentity(), 'BR', user.stripeAccount.stripeObject)
      result = await req.patch()
      for (const field in req.body) {
        cachedResponses[field] = cachedResponses[field] || result.stripeObject
      }
      // await TestHelper.waitForCurrentlyDueFields(user, 'individual.verification.document')
      // req = TestHelper.createRequest(`/api/user/connect/update-stripe-account?stripeid=${user.stripeAccount.stripeid}`)
      // req.account = user.account
      // req.session = user.session
      // req.body = {}
      // some individual fields only by JP
      await TestHelper.createStripeAccount(user, {
        country: 'JP',
        business_type: 'individual'
      })
      req = TestHelper.createRequest(`/api/user/connect/update-stripe-account?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      req.body = TestStripeAccounts.createAccountData(TestHelper.nextIdentity(), 'JP', user.stripeAccount.stripeObject)
      result = await req.patch()
      for (const field in req.body) {
        cachedResponses[field] = cachedResponses[field] || result.stripeObject
      }
      // some individual fields only by SG
      await TestHelper.createStripeAccount(user, {
        country: 'SG',
        business_type: 'individual'
      })
      req = TestHelper.createRequest(`/api/user/connect/update-stripe-account?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      req.body = TestStripeAccounts.createAccountData(TestHelper.nextIdentity(), 'SG', user.stripeAccount.stripeObject)
      result = await req.patch()
      for (const field in req.body) {
        cachedResponses[field] = cachedResponses[field] || result.stripeObject
      }
      // some individual fields only by US
      await TestHelper.createStripeAccount(user, {
        country: 'US',
        business_type: 'individual'
      })
      req = TestHelper.createRequest(`/api/user/connect/update-stripe-account?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      req.body = TestStripeAccounts.createAccountData(TestHelper.nextIdentity(), 'US', user.stripeAccount.stripeObject)
      result = await req.patch()
      for (const field in req.body) {
        cachedResponses[field] = cachedResponses[field] || result.stripeObject
      }
    })
    it('optionally-required posted individual_dob_day', async () => {
      const stripeAccountNow = cachedResponses.individual_dob_day
      assert.strictEqual(stripeAccountNow.individual.dob.day, 1)
    })
    it('optionally-required posted individual_dob_month', async () => {
      const stripeAccountNow = cachedResponses.individual_dob_month
      assert.strictEqual(stripeAccountNow.individual.dob.month, 1)
    })
    it('optionally-required posted individual_dob_year', async () => {
      const stripeAccountNow = cachedResponses.individual_dob_year
      assert.strictEqual(stripeAccountNow.individual.dob.year, 1970)
    })
    it('optionally-required posted individual_email', async () => {
      const stripeAccountNow = cachedResponses.individual_email
      assert.strictEqual(stripeAccountNow.individual.email, 'email@address.com')
    })
    it('optionally-required posted individual_phone', async () => {
      const stripeAccountNow = cachedResponses.individual_phone
      assert.strictEqual(stripeAccountNow.individual.phone, '+14567890123')
    })
    it('optionally-required posted individual_political_exposure', async () => {
      const stripeAccountNow = cachedResponses.individual_political_exposure
      assert.strictEqual(stripeAccountNow.individual.political_exposure, 'existing')
    })
    it('optionally-required posted individual_nationality', async () => {
      const stripeAccountNow = cachedResponses.individual_nationality
      assert.strictEqual(stripeAccountNow.individual.nationality, 'BR')
    })
    it('optionally-required posted individual_id_number', async () => {
      const stripeAccountNow = cachedResponses.individual_id_number
      assert.strictEqual(stripeAccountNow.individual.id_number_provided, true)
    })
    it('optionally-required posted individual_ssn_last_4', async () => {
      const stripeAccountNow = cachedResponses.individual_ssn_last_4
      assert.strictEqual(stripeAccountNow.individual.ssn_last_4_provided, true)
    })
    it('optionally-required posted individual_address_line1', async () => {
      const stripeAccountNow = cachedResponses.individual_address_line1
      assert.strictEqual(stripeAccountNow.individual.address.line1, '123 Park Lane')
    })
    it('optionally-required posted individual_address_city', async () => {
      const stripeAccountNow = cachedResponses.individual_address_city
      assert.strictEqual(stripeAccountNow.individual.address.city, 'Vienna')
    })
    it('optionally-required posted individual_address_state', async () => {
      const stripeAccountNow = cachedResponses.individual_address_state
      assert.strictEqual(stripeAccountNow.individual.address.state, 'QLD')
    })
    it('optionally-required posted individual_address_postal_code', async () => {
      const stripeAccountNow = cachedResponses.individual_address_postal_code
      assert.strictEqual(stripeAccountNow.individual.address.postal_code, '1020')
    })
    it('optionally-required posted individual_address_kana_line1', async () => {
      const stripeAccountNow = cachedResponses.individual_address_kana_line1
      assert.strictEqual(stripeAccountNow.individual.address_kana.line1, testData.addresses.JP.kana_line1)
    })
    it('optionally-required posted individual_address_kana_city', async () => {
      const stripeAccountNow = cachedResponses.individual_address_kana_city
      assert.strictEqual(stripeAccountNow.individual.address_kana.city, testData.addresses.JP.kana_city)
    })
    it('optionally-required posted individual_address_kana_town', async () => {
      const stripeAccountNow = cachedResponses.individual_address_kana_town
      assert.strictEqual(stripeAccountNow.individual.address_kana.town, testData.addresses.JP.kana_town)
    })
    it('optionally-required posted individual_address_kana_state', async () => {
      const stripeAccountNow = cachedResponses.individual_address_kana_state
      assert.strictEqual(stripeAccountNow.individual.address_kana.state, testData.addresses.JP.kana_state)
    })
    it('optionally-required posted individual_address_kana_postal_code', async () => {
      const stripeAccountNow = cachedResponses.individual_address_kana_postal_code
      assert.notStrictEqual(stripeAccountNow.individual.address_kana.postal_code, undefined)
      assert.notStrictEqual(stripeAccountNow.individual.address_kana.postal_code, null)
    })
    it('optionally-required posted individual_address_kanji_line1', async () => {
      const stripeAccountNow = cachedResponses.individual_address_kanji_line1
      assert.strictEqual(stripeAccountNow.individual.address_kanji.line1, testData.addresses.JP.kanji_line1)
    })
    it('optionally-required posted individual_address_kanji_city', async () => {
      const stripeAccountNow = cachedResponses.individual_address_kanji_city
      assert.strictEqual(stripeAccountNow.individual.address_kanji.city, testData.addresses.JP.kanji_city)
    })
    it('optionally-required posted individual_address_kanji_town', async () => {
      const stripeAccountNow = cachedResponses.individual_address_kanji_town
      assert.strictEqual(stripeAccountNow.individual.address_kanji.town, testData.addresses.JP.kanji_town)
    })
    it('optionally-required posted individual_address_kanji_state', async () => {
      const stripeAccountNow = cachedResponses.individual_address_kanji_state
      assert.strictEqual(stripeAccountNow.individual.address_kanji.state, testData.addresses.JP.kanji_state)
    })
    it('optionally-required posted individual_address_kanji_postal_code', async () => {
      const stripeAccountNow = cachedResponses.individual_address_kanji_postal_code
      assert.notStrictEqual(stripeAccountNow.individual.address_kanji.postal_code, undefined)
      assert.notStrictEqual(stripeAccountNow.individual.address_kanji.postal_code, null)
    })
    it('optionally-required posted company_name', async () => {
      const stripeAccountNow = cachedResponses.company_name
      assert.strictEqual(stripeAccountNow.company.name, 'Test Company Name')
    })
    it('optionally-required posted company_phone', async () => {
      const stripeAccountNow = cachedResponses.company_phone
      assert.strictEqual(stripeAccountNow.company.phone, '4567890123')
    })
    it('optionally-required posted company_tax_id', async () => {
      const stripeAccountNow = cachedResponses.company_tax_id
      assert.strictEqual(stripeAccountNow.company.tax_id_provided, true)
    })
    it('optionally-required posted company_registration_number', async () => {
      const stripeAccountNow = cachedResponses.company_registration_number
      assert.strictEqual(stripeAccountNow.company.registration_number, '00000000000')
    })
    it('optionally-required posted company_address.line1', async () => {
      const stripeAccountNow = cachedResponses.company_address_line1
      assert.strictEqual(stripeAccountNow.company.address.line1, '123 Park Lane')
    })
    it('optionally-required posted company_address.city', async () => {
      const stripeAccountNow = cachedResponses.company_address_city
      assert.strictEqual(stripeAccountNow.company.address.city, 'Vienna')
    })
    it('optionally-required posted company_address.state', async () => {
      const stripeAccountNow = cachedResponses.company_address_state
      assert.strictEqual(stripeAccountNow.company.address.state, 'QLD')
    })
    it('optionally-required posted company_address.postal_code', async () => {
      const stripeAccountNow = cachedResponses.company_address_postal_code
      assert.strictEqual(stripeAccountNow.company.address.postal_code, '1020')
    })
    it('optionally-required posted company_address_kana_line1', async () => {
      const stripeAccountNow = cachedResponses.company_address_kana_line1
      assert.strictEqual(stripeAccountNow.company.address_kana.line1, testData.addresses.JP.kana_line1)
    })
    it('optionally-required posted company_address_kana_city', async () => {
      const stripeAccountNow = cachedResponses.company_address_kana_city
      assert.strictEqual(stripeAccountNow.company.address_kana.city, testData.addresses.JP.kana_city)
    })
    it('optionally-required posted company_address_kana_town', async () => {
      const stripeAccountNow = cachedResponses.company_address_kana_town
      assert.strictEqual(stripeAccountNow.company.address_kana.town, testData.addresses.JP.kana_town)
    })
    it('optionally-required posted company_address_kana_state', async () => {
      const stripeAccountNow = cachedResponses.company_address_kana_state
      assert.strictEqual(stripeAccountNow.company.address_kana.state, testData.addresses.JP.kana_state)
    })
    it('optionally-required posted company_address_kana_postal_code', async () => {
      const stripeAccountNow = cachedResponses.company_address_kana_postal_code
      assert.notStrictEqual(stripeAccountNow.company.address_kana.postal_code, undefined)
      assert.notStrictEqual(stripeAccountNow.company.address_kana.postal_code, null)
    })
    it('optionally-required posted company_address_kanji_line1', async () => {
      const stripeAccountNow = cachedResponses.company_address_kanji_line1
      assert.strictEqual(stripeAccountNow.company.address_kanji.line1, testData.addresses.JP.kanji_line1)
    })
    it('optionally-required posted company_address_kanji_city', async () => {
      const stripeAccountNow = cachedResponses.company_address_kanji_city
      assert.strictEqual(stripeAccountNow.company.address_kanji.city, testData.addresses.JP.kanji_city)
    })
    it('optionally-required posted company_address_kanji_town', async () => {
      const stripeAccountNow = cachedResponses.company_address_kanji_town
      assert.strictEqual(stripeAccountNow.company.address_kanji.town, testData.addresses.JP.kanji_town)
    })
    it('optionally-required posted company_address_kanji_state', async () => {
      const stripeAccountNow = cachedResponses.company_address_kanji_state
      assert.strictEqual(stripeAccountNow.company.address_kanji.state, testData.addresses.JP.kanji_state)
    })
    it('optionally-required posted company_address_kanji_postal_code', async () => {
      const stripeAccountNow = cachedResponses.company_address_kanji_postal_code
      assert.notStrictEqual(stripeAccountNow.company.address_kanji.postal_code, undefined)
      assert.notStrictEqual(stripeAccountNow.company.address_kanji.postal_code, null)
    })
    // TODO: verification document goes from unsubmitted to approved without uploading
    // but the check could be completed with a BR account, but payment details aren't working
    // it(`optionally-required posted company_verification.document.front`, async () => {
    //   const stripeAccountNow = cachedResponses['company_verification_document.front']
    //   assert.strictEqual(stripeAccountNow.company.verification.status, 'pending')
    // })
    // it(`optionally-required posted company_verification.document.back`, async () => {
    //   const stripeAccountNow = cachedResponses['company_verification_document.back']
    //   assert.strictEqual(stripeAccountNow.company.verification.status, 'pending')
    // })
    // it(`optionally-required posted individual_verification.document.front`, async () => {
    //   const stripeAccountNow = cachedResponses['individual_verification_document.front']
    //   assert.strictEqual(stripeAccountNow.individual.verification.status, 'pending')
    // })
    // it(`optionally-required posted individual_verification.document.back`, async () => {
    //   const stripeAccountNow = cachedResponses['individual_verification_document.back']
    //   assert.strictEqual(stripeAccountNow.individual.verification.status, 'pending')
    // })
  })

  describe('returns', () => {
    it('object', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'US',
        business_type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/update-stripe-account?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      req.body = TestStripeAccounts.createAccountData(TestHelper.nextIdentity(), 'US', user.stripeAccount.stripeObject)
      const stripeAccountNow = await req.patch()
      assert.strictEqual(stripeAccountNow.object, 'stripeAccount')
    })
  })

  describe('configuration', () => {
    it('environment STRIPE_JS', async () => {
      global.stripeJS = 3
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'US',
        business_type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-stripe-account?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      req.body = TestStripeAccounts.createAccountData(user.profile, 'US', user.stripeAccount.stripeObject)
      await req.post()
      const stripeAccountNow = await global.api.administrator.connect.StripeAccount.get({
        query: {
          stripeid: user.stripeAccount.stripeid
        }
      })
      assert.strictEqual(user.stripeAccount.stripeObject.metadata.tokenUpdate, undefined)
      assert.notStrictEqual(stripeAccountNow.stripeObject.metadata.tokenUpdate, undefined)
    })
  })
})
