/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')
const TestStripeAccounts = require('../../../../../test-stripe-accounts.js')
const DashboardTestHelper = require('@layeredapps/dashboard/test-helper.js')

describe('/api/user/connect/update-person', function () {
  describe('exceptions', () => {
    const cachedResults = {}
    before(async () => {
      await DashboardTestHelper.setupBeforeEach()
      await TestHelper.setupBeforeEach()
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'AU',
        business_type: 'company'
      })
      await TestHelper.createPerson(user, {
        relationship_representative: 'true',
        relationship_title: 'SVP Testing',
        relationship_percent_ownership: '0'
      })
      // invalid date of birth
      let req = TestHelper.createRequest(`/api/user/connect/update-person?personid=${user.representative.personid}`)
      req.account = user.account
      req.session = user.session
      req.body = { dob_day: '-1', dob_month: '1', dob_year: 2000 }
      try {
        await req.patch()
      } catch (error) {
        cachedResults['invalid-dob_day'] = error.message
      }
      req.body = { dob_day: '', dob_month: '-1', dob_year: 2000 }
      try {
        await req.patch()
      } catch (error) {
        cachedResults['missing-dob_day'] = error.message
      }
      req.body = { dob_day: '1', dob_month: '-1', dob_year: 2000 }
      try {
        await req.patch()
      } catch (error) {
        cachedResults['invalid-dob_month'] = error.message
      }
      req.body = { dob_day: '1', dob_month: '', dob_year: 2000 }
      try {
        await req.patch()
      } catch (error) {
        cachedResults['missing-dob_month'] = error.message
      }
      req.body = { dob_day: '1', dob_month: '1', dob_year: 'invalid' }
      try {
        await req.patch()
      } catch (error) {
        cachedResults['invalid-dob_year'] = error.message
      }
      req.body = { dob_day: '1', dob_month: '1', dob_year: '' }
      try {
        await req.patch()
      } catch (error) {
        cachedResults['missing-dob_year'] = error.message
      }
      // invalid percent ownership
      req.body = { relationship_percent_ownership: '-1' }
      try {
        await req.patch()
      } catch (error) {
        cachedResults['invalid-relationship_percent_ownership'] = error.message
      }
      // invalid country
      req.body = { address_country: '-1' }
      try {
        await req.patch()
      } catch (error) {
        cachedResults['invalid-address_country'] = error.message
      }
      // invalid state
      req.body = { address_state: '-1' }
      try {
        await req.patch()
      } catch (error) {
        cachedResults['invalid-address_state'] = error.message
      }
      // invalid id number
      await TestHelper.createStripeAccount(user, {
        country: 'HK',
        business_type: 'company'
      })
      await TestHelper.createPerson(user, {
        relationship_representative: 'true',
        relationship_title: 'SVP Testing',
        relationship_percent_ownership: '0'
      })
      req = TestHelper.createRequest(`/api/user/connect/update-person?personid=${user.representative.personid}`)
      req.account = user.account
      req.session = user.session
      req.body = { id_number: '-1' }
      try {
        await req.patch()
      } catch (error) {
        cachedResults['invalid-id_number'] = error.message
      }
      // invalid phone
      await TestHelper.createStripeAccount(user, {
        country: 'US',
        business_type: 'company'
      })
      await TestHelper.createPerson(user, {
        relationship_representative: 'true',
        relationship_title: 'SVP Testing',
        relationship_percent_ownership: '0'
      })
      req = TestHelper.createRequest(`/api/user/connect/update-person?personid=${user.representative.personid}`)
      req.account = user.account
      req.session = user.session
      req.body = { phone: '-1' }
      try {
        await req.patch()
      } catch (error) {
        cachedResults['invalid-phone'] = error.message
      }
      // invalid ssn last 4
      req.body = { ssn_last_4: '-1' }
      try {
        await req.patch()
      } catch (error) {
        cachedResults['invalid-ssn_last_4'] = error.message
      }
      // invalid email
      await TestHelper.createStripeAccount(user, {
        country: 'AT',
        business_type: 'company'
      })
      await TestHelper.createPerson(user, {
        relationship_representative: 'true',
        relationship_executive: 'true',
        relationship_title: 'SVP Testing',
        relationship_percent_ownership: '0'
      })
      req = TestHelper.createRequest(`/api/user/connect/update-person?personid=${user.representative.personid}`)
      req.account = user.account
      req.session = user.session
      req.body = { email: '-1' }
      try {
        await req.patch()
      } catch (error) {
        cachedResults['invalid-email'] = error.message
      }
      // invalid account
      const user2 = await TestHelper.createUser()
      req = TestHelper.createRequest(`/api/user/connect/update-person?personid=${user.representative.personid}`)
      req.account = user2.account
      req.session = user2.session
      req.body = { email: 'email@address.com' }
      try {
        await req.patch(req)
      } catch (error) {
        cachedResults.invalidAccount = error.message
      }
      // invalid person
      req = TestHelper.createRequest(`/api/user/connect/update-person?personid=${user.representative.personid}`)
      req.account = user.account
      req.session = user.session
      req.body = TestStripeAccounts.createPersonData(TestHelper.nextIdentity(), 'US', user.representative.stripeObject)
      await req.patch(req)
      req = TestHelper.createRequest(`/api/user/connect/update-person?personid=${user.representative.personid}`)
      req.account = user.account
      req.session = user.session
      req.body = {}
      try {
        await req.patch(req)
      } catch (error) {
        cachedResults.invalidPerson = error.message
      }
    })
    describe('invalid-personid', () => {
      it('missing querystring personid', async () => {
        const user = await TestHelper.createUser()
        const req = TestHelper.createRequest('/api/user/connect/update-person')
        req.account = user.account
        req.session = user.session
        req.body = {}
        let errorMessage
        try {
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-personid')
      })

      it('invalid querystring personid', async () => {
        const user = await TestHelper.createUser()
        const req = TestHelper.createRequest('/api/user/connect/update-person?personid=invalid')
        req.account = user.account
        req.session = user.session
        req.body = {}
        let errorMessage
        try {
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-personid')
      })
    })

    describe('invalid-account', () => {
      it('ineligible accessing account', async () => {
        const errorMessage = cachedResults.invalidAccount
        assert.strictEqual(errorMessage, 'invalid-account')
      })
    })

    describe('invalid-person', () => {
      it('ineligible querystring person has no required information', async () => {
        const errorMessage = cachedResults.invalidPerson
        assert.strictEqual(errorMessage, 'invalid-person')
      })
    })

    describe('invalid-dob_day', () => {
      it('missing posted dob.day', async () => {
        const errorMessage = cachedResults['invalid-dob_day']
        assert.strictEqual(errorMessage, 'invalid-dob_day')
      })
      it('invalid posted dob.day', async () => {
        const errorMessage = cachedResults['invalid-dob_day']
        assert.strictEqual(errorMessage, 'invalid-dob_day')
      })
    })
    describe('invalid-dob_month', () => {
      it('missing posted dob.month', async () => {
        const errorMessage = cachedResults['invalid-dob_month']
        assert.strictEqual(errorMessage, 'invalid-dob_month')
      })
      it('invalid posted dob.month', async () => {
        const errorMessage = cachedResults['invalid-dob_month']
        assert.strictEqual(errorMessage, 'invalid-dob_month')
      })
    })
    describe('invalid-dob_year', () => {
      it('missing posted dob.month', async () => {
        const errorMessage = cachedResults['invalid-dob_month']
        assert.strictEqual(errorMessage, 'invalid-dob_month')
      })
      it('invalid posted dob.month', async () => {
        const errorMessage = cachedResults['invalid-dob_month']
        assert.strictEqual(errorMessage, 'invalid-dob_month')
      })
    })

    describe('invalid-relationship_percent_ownership', () => {
      it('invalid posted relationship.percent_ownership', async () => {
        const errorMessage = cachedResults['invalid-relationship_percent_ownership']
        assert.strictEqual(errorMessage, 'invalid-relationship_percent_ownership')
      })
    })

    describe('invalid-address_country', () => {
      it('invalid posted address.country', async () => {
        const errorMessage = cachedResults['invalid-address_country']
        assert.strictEqual(errorMessage, 'invalid-address_country')
      })
    })

    describe('invalid-address_state', () => {
      it('invalid posted address.state', async () => {
        const errorMessage = cachedResults['invalid-address_state']
        assert.strictEqual(errorMessage, 'invalid-address_state')
      })
    })

    describe('invalid-id_number', () => {
      it('invalid posted id_number', async () => {
        const errorMessage = cachedResults['invalid-id_number']
        assert.strictEqual(errorMessage, 'invalid-id_number')
      })
    })

    describe('invalid-ssn_last_4', () => {
      it('invalid posted ssn_last_4', async () => {
        const errorMessage = cachedResults['invalid-ssn_last_4']
        assert.strictEqual(errorMessage, 'invalid-ssn_last_4')
      })
    })

    describe('invalid-phone', () => {
      it('invalid posted phone', async () => {
        const errorMessage = cachedResults['invalid-phone']
        assert.strictEqual(errorMessage, 'invalid-phone')
      })
    })

    describe('invalid-account', () => {
      it('ineligible accessing account', async () => {
        const errorMessage = cachedResults.invalidAccount
        assert.strictEqual(errorMessage, 'invalid-account')
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
      await TestHelper.createPerson(user, {
        relationship_representative: 'true',
        relationship_executive: 'true',
        relationship_title: 'SVP Testing',
        relationship_percent_ownership: '0'
      })
      let req = TestHelper.createRequest(`/api/user/connect/update-person?personid=${user.representative.personid}`)
      req.account = user.account
      req.session = user.session
      req.body = TestStripeAccounts.createPersonData(TestHelper.nextIdentity(), 'AT', user.representative.stripeObject)
      req.body.email = 'email@address.com'
      let result = await req.patch()
      for (const field in req.body) {
        cachedResponses[field] = result.stripeObject
      }
      await TestHelper.waitForPersonCurrentlyDueFields(user, 'representative', 'verification.document')
      await TestHelper.waitForPersonCurrentlyDueFields(user, 'representative', 'verification.additional_document')
      req = TestHelper.createRequest(`/api/user/connect/update-person?personid=${user.representative.personid}`)
      req.account = user.account
      req.session = user.session
      req.body = {}
      req.uploads = TestStripeAccounts.createUploadData(user.representative.stripeObject)
      result = await req.patch()
      await TestHelper.waitForWebhook('person.updated', (stripeEvent) => {
        if (stripeEvent.data.object.id === user.representative.personid &&
            stripeEvent.data.object.verification.status === 'pending') {
          for (const field in req.uploads) {
            cachedResponses[field] = stripeEvent.data.object
          }
          return true
        }
      })

      // some fields only by BR
      await TestHelper.createStripeAccount(user, {
        country: 'BR',
        business_type: 'company'
      })
      await TestHelper.createPerson(user, {
        relationship_representative: 'true',
        relationship_title: 'SVP Testing',
        relationship_percent_ownership: '0'
      })
      req = TestHelper.createRequest(`/api/user/connect/update-person?personid=${user.representative.personid}`)
      req.account = user.account
      req.session = user.session
      req.body = TestStripeAccounts.createPersonData(TestHelper.nextIdentity(), 'BR', user.representative.stripeObject)
      result = await req.patch()
      for (const field in req.body) {
        cachedResponses[field] = cachedResponses[field] || result.stripeObject
      }
      // some fields only by US
      await TestHelper.createStripeAccount(user, {
        country: 'US',
        business_type: 'company'
      })
      await TestHelper.createPerson(user, {
        relationship_representative: 'true',
        relationship_title: 'SVP Testing',
        relationship_percent_ownership: '0'
      })
      req = TestHelper.createRequest(`/api/user/connect/update-person?personid=${user.representative.personid}`)
      req.account = user.account
      req.session = user.session
      req.body = TestStripeAccounts.createPersonData(TestHelper.nextIdentity(), 'US', user.representative.stripeObject)
      result = await req.patch()
      for (const field in req.body) {
        cachedResponses[field] = cachedResponses[field] || result.stripeObject
      }
    })
    it('optionally-required posted dob.day', async () => {
      const personNow = cachedResponses.dob_day
      assert.strictEqual(personNow.dob.day, 1)
    })
    it('optionally-required posted dob.month', async () => {
      const personNow = cachedResponses.dob_month
      assert.strictEqual(personNow.dob.month, 1)
    })
    it('optionally-required posted dob.year', async () => {
      const personNow = cachedResponses.dob_year
      assert.strictEqual(personNow.dob.year, 1970)
    })
    it('optionally-required posted address.line1', async () => {
      const personNow = cachedResponses.address_line1
      assert.strictEqual(personNow.address.line1, '123 Park Lane')
    })
    it('optionally-required posted address.city', async () => {
      const personNow = cachedResponses.address_city
      assert.strictEqual(personNow.address.city, 'Vienna')
    })
    it('optionally-required posted address.state', async () => {
      const personNow = cachedResponses.address_state
      assert.strictEqual(personNow.address.state, 'SP')
    })
    it('optionally-required posted address.postal_code', async () => {
      const personNow = cachedResponses.address_postal_code
      assert.strictEqual(personNow.address.postal_code, '1020')
    })
    it('optionally-required posted email', async () => {
      const personNow = cachedResponses.email
      assert.strictEqual(personNow.email, 'email@address.com')
    })
    it('optionally-required posted phone', async () => {
      const personNow = cachedResponses.phone
      assert.strictEqual(personNow.phone, '+14567890123')
    })
    it('optionally-required posted political_exposure', async () => {
      const personNow = cachedResponses.political_exposure
      assert.strictEqual(personNow.political_exposure, 'existing')
    })
    it('optionally-required posted id_number', async () => {
      const personNow = cachedResponses.id_number
      assert.strictEqual(personNow.id_number_provided, true)
    })
    it('optionally-required posted ssn_last_4', async () => {
      const personNow = cachedResponses.ssn_last_4
      assert.strictEqual(personNow.ssn_last_4_provided, true)
    })
    it('optionally-required posted verification_document.front', async () => {
      const personNow = cachedResponses.verification_document_front
      assert.strictEqual(personNow.verification.status, 'pending')
    })
    it('optionally-required posted verification_document.back', async () => {
      const personNow = cachedResponses.verification_document_back
      assert.strictEqual(personNow.verification.status, 'pending')
    })
    it('optionally-required posted verification_additional_document_front', async () => {
      const personNow = cachedResponses.verification_additional_document_front
      assert.strictEqual(personNow.verification.status, 'pending')
    })
    it('optionally-required posted verification_additional_document_back', async () => {
      const personNow = cachedResponses.verification_additional_document_back
      assert.strictEqual(personNow.verification.status, 'pending')
    })
  })

  describe('returns', () => {
    it('object', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'GB',
        business_type: 'company'
      })
      await TestHelper.createPerson(user, {
        relationship_representative: 'true',
        relationship_executive: 'true',
        relationship_title: 'SVP Testing',
        relationship_percent_ownership: '0'
      })
      await TestHelper.waitForAccountRequirement(user, `${user.representative.personid}.first_name`)
      await TestHelper.waitForPersonRequirement(user, user.representative.personid, 'first_name')
      const req = TestHelper.createRequest(`/api/user/connect/update-person?personid=${user.representative.personid}`)
      req.account = user.account
      req.session = user.session
      req.body = TestStripeAccounts.createPersonData(TestHelper.nextIdentity(), 'GB', user.representative.stripeObject)
      req.filename = __filename
      req.saveResponse = true
      const personNow = await req.patch()
      assert.strictEqual(personNow.object, 'person')
    })
  })

  describe('configuration', () => {
    it('environment STRIPE_JS', async () => {
      global.stripeJS = 3
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'GB',
        business_type: 'company'
      })
      await TestHelper.createPerson(user, {
        relationship_representative: 'true',
        relationship_executcive: 'true',
        relationship_title: 'SVP Testing',
        relationship_percent_ownership: '0'
      })
      await TestHelper.waitForAccountRequirement(user, `${user.representative.personid}.first_name`)
      await TestHelper.waitForPersonRequirement(user, user.representative.personid, 'first_name')
      const req = TestHelper.createRequest(`/account/connect/edit-person?personid=${user.representative.personid}`)
      req.account = user.account
      req.session = user.session
      req.body = TestStripeAccounts.createPersonData(TestHelper.nextIdentity(), 'GB', user.representative.stripeObject)
      req.uploads = {
        verification_document_back: TestHelper['success_id_scan_back.png'],
        verification_document_front: TestHelper['success_id_scan_front.png']
      }
      req.waitAfter = async () => {
        // TODO: verifying information was submitted by token is not possible
        // because the fields don't leave the 'currently_due' etc arrays in
        // test mode so for now a metadata.tokenUpdate flag gets set
        await TestHelper.waitForWebhook('person.updated', (stripeEvent) => {
          return stripeEvent.data.object.id === user.representative.personid &&
                stripeEvent.data.object.metadata.tokenUpdate !== undefined
        })
      }
      for (const field in req.body) {
        if (field.indexOf('.') > -1) {
          req.body[field.split('.').join('_')] = req.body[field]
          delete (req.body[field])
        }
      }
      for (const field in req.uploads) {
        req.uploads[field.split('.').join('_')] = req.uploads[field]
        delete (req.uploads[field])
      }
      await req.post()
      const personNow = await global.api.administrator.connect.Person.get({
        query: {
          personid: user.representative.personid
        }
      })
      assert.strictEqual(user.representative.stripeObject.metadata.tokenUpdate, undefined)
      assert.notStrictEqual(personNow.stripeObject.metadata.tokenUpdate, undefined)
    })
  })
})
