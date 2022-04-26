/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')
const TestStripeAccounts = require('../../../../../test-stripe-accounts.js')
const DashboardTestHelper = require('@layeredapps/dashboard/test-helper.js')

describe('/api/user/connect/update-person', function () {
  before(TestHelper.disableMetrics)
  after(TestHelper.enableMetrics)
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
      cachedResponses['invalid-dob_day'] = error.message
    }
    req.body = { dob_day: '', dob_month: '-1', dob_year: 2000 }
    try {
      await req.patch()
    } catch (error) {
      cachedResponses['missing-dob_day'] = error.message
    }
    req.body = { dob_day: '1', dob_month: '-1', dob_year: 2000 }
    try {
      await req.patch()
    } catch (error) {
      cachedResponses['invalid-dob_month'] = error.message
    }
    req.body = { dob_day: '1', dob_month: '', dob_year: 2000 }
    try {
      await req.patch()
    } catch (error) {
      cachedResponses['missing-dob_month'] = error.message
    }
    req.body = { dob_day: '1', dob_month: '1', dob_year: 'invalid' }
    try {
      await req.patch()
    } catch (error) {
      cachedResponses['invalid-dob_year'] = error.message
    }
    req.body = { dob_day: '1', dob_month: '1', dob_year: '' }
    try {
      await req.patch()
    } catch (error) {
      cachedResponses['missing-dob_year'] = error.message
    }
    // invalid percent ownership
    req.body = { relationship_percent_ownership: '-1' }
    try {
      await req.patch()
    } catch (error) {
      cachedResponses['invalid-relationship_percent_ownership'] = error.message
    }
    // invalid country
    req.body = { address_country: '-1' }
    try {
      await req.patch()
    } catch (error) {
      cachedResponses['invalid-address_country'] = error.message
    }
    // invalid state
    req.body = { address_state: '-1' }
    try {
      await req.patch()
    } catch (error) {
      cachedResponses['invalid-address_state'] = error.message
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
      cachedResponses['invalid-id_number'] = error.message
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
      cachedResponses['invalid-phone'] = error.message
    }
    // invalid ssn last 4
    req.body = { ssn_last_4: '-1' }
    try {
      await req.patch()
    } catch (error) {
      cachedResponses['invalid-ssn_last_4'] = error.message
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
      cachedResponses['invalid-email'] = error.message
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
      cachedResponses.invalidAccount = error.message
    }
    // invalid person
    const user3 = await TestStripeAccounts.createCompanyReadyForSubmission('DE')
    req = TestHelper.createRequest(`/api/user/connect/update-person?personid=${user3.representative.personid}`)
    req.account = user3.account
    req.session = user3.session
    req.body = {}
    try {
      await req.patch(req)
    } catch (error) {
      cachedResponses.invalidPerson = error.message
    }
    // receives
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
    await TestStripeAccounts.waitForPersonField(user, 'representative', 'first_name')
    req = TestHelper.createRequest(`/api/user/connect/update-person?personid=${user.representative.personid}`)
    req.account = user.account
    req.session = user.session
    req.body = TestStripeAccounts.createPersonData(TestHelper.nextIdentity(), 'AT', user.representative.stripeObject)
    req.body.email = 'email@address.com'
    let result = await req.patch()
    for (const field in req.body) {
      cachedResponses[field] = result.stripeObject
    }
    await TestStripeAccounts.waitForPersonField(user, 'representative', 'verification.document')
    await TestStripeAccounts.waitForPersonField(user, 'representative', 'verification.additional_document')
    req = TestHelper.createRequest(`/api/user/connect/update-person?personid=${user.representative.personid}`)
    req.account = user.account
    req.session = user.session
    req.body = {}
    req.uploads = TestStripeAccounts.createPersonUploadData(user.representative.stripeObject)
    result = await req.patch()
    for (const field in req.uploads) {
      cachedResponses[field] = cachedResponses[field] || result.stripeObject
    }
    await TestStripeAccounts.waitForPersonField(user, 'representative', 'verification.document')
    // // some fields only by BR
    // await TestHelper.createStripeAccount(user, {
    //   country: 'BR',
    //   business_type: 'company'
    // })
    // await TestHelper.createPerson(user, {
    //   relationship_representative: 'true',
    //   relationship_title: 'SVP Testing',
    //   relationship_percent_ownership: '0'
    // })
    // req = TestHelper.createRequest(`/api/user/connect/update-person?personid=${user.representative.personid}`)
    // req.account = user.account
    // req.session = user.session
    // req.body = TestStripeAccounts.createPersonData(TestHelper.nextIdentity(), 'BR', user.representative.stripeObject)
    // result = await req.patch()
    // for (const field in req.body) {
    //   cachedResponses[field] = cachedResponses[field] || result.stripeObject
    // }
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
    // returns
    await TestHelper.createStripeAccount(user3, {
      country: 'AT',
      business_type: 'company'
    })
    await TestHelper.createPerson(user3, {
      relationship_owner: 'true',
      relationship_executive: 'true',
      relationship_title: 'SVP Testing',
      relationship_percent_ownership: '10'
    })
    // await TestStripeAccounts.waitForPersonField(user3, 'owner', 'first_name')
    // await TestStripeAccounts.waitForPersonField(user3, 'owner', 'address.state')
    req = TestHelper.createRequest(`/api/user/connect/update-person?personid=${user3.owner.personid}`)
    req.account = user3.account
    req.session = user3.session
    req.body = TestStripeAccounts.createPersonData(TestHelper.nextIdentity(), 'AT', user3.owner.stripeObject)
    req.filename = __filename
    req.saveResponse = true
    cachedResponses.returns = await req.patch()
    await TestStripeAccounts.waitForPersonFieldToLeave(user3, 'owner', 'first_name')
    await TestStripeAccounts.waitForPersonFieldToLeave(user3, 'owner', 'address.state')
    // returns with stripe.js
    global.stripeJS = 3
    await TestStripeAccounts.waitForPersonField(user3, 'owner', 'verification.document')
    await TestStripeAccounts.waitForPersonField(user3, 'owner', 'verification.additional_document')
    req = TestHelper.createRequest(`/account/connect/edit-person?personid=${user3.owner.personid}`)
    req.account = user3.account
    req.session = user3.session
    req.body = {}
    req.uploads = TestStripeAccounts.createPersonUploadData(user3.owner.stripeObject)
    req.waitBefore = async (page) => {
      while (true) {
        try {
          const input = await page.$('#verification_additional_document_front')
          if (input) {
            break
          }
        } catch (error) {
        }
        await TestHelper.wait(100)
      }
    }
    req.waitAfter = async (page) => {
      while (true) {
        const url = await page.url()
        if (url.indexOf('/person') > -1) {
          break
        }
        await TestHelper.wait(100)
      }
    }
    await req.post()
    cachedResponses.returnsWithStripeJS = await global.api.administrator.connect.Person.get({
      query: {
        personid: user3.owner.personid
      }
    })
    cachedResponses.finished = true
  }

  describe('exceptions', () => {
    describe('invalid-personid', () => {
      it('missing querystring personid', async function () {
        await bundledData(this.test.currentRetry())
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

      it('invalid querystring personid', async function () {
        await bundledData(this.test.currentRetry())
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
      it('ineligible accessing account', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.invalidAccount
        assert.strictEqual(errorMessage, 'invalid-account')
      })
    })

    describe('invalid-person', () => {
      it('ineligible querystring person has no required information', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.invalidPerson
        assert.strictEqual(errorMessage, 'invalid-person')
      })
    })

    describe('invalid-dob_day', () => {
      it('missing posted dob.day', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses['invalid-dob_day']
        assert.strictEqual(errorMessage, 'invalid-dob_day')
      })
      it('invalid posted dob.day', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses['invalid-dob_day']
        assert.strictEqual(errorMessage, 'invalid-dob_day')
      })
    })
    describe('invalid-dob_month', () => {
      it('missing posted dob.month', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses['invalid-dob_month']
        assert.strictEqual(errorMessage, 'invalid-dob_month')
      })
      it('invalid posted dob.month', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses['invalid-dob_month']
        assert.strictEqual(errorMessage, 'invalid-dob_month')
      })
    })
    describe('invalid-dob_year', () => {
      it('missing posted dob.month', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses['invalid-dob_month']
        assert.strictEqual(errorMessage, 'invalid-dob_month')
      })
      it('invalid posted dob.month', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses['invalid-dob_month']
        assert.strictEqual(errorMessage, 'invalid-dob_month')
      })
    })

    describe('invalid-relationship_percent_ownership', () => {
      it('invalid posted relationship.percent_ownership', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses['invalid-relationship_percent_ownership']
        assert.strictEqual(errorMessage, 'invalid-relationship_percent_ownership')
      })
    })

    describe('invalid-address_country', () => {
      it('invalid posted address.country', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses['invalid-address_country']
        assert.strictEqual(errorMessage, 'invalid-address_country')
      })
    })

    describe('invalid-address_state', () => {
      it('invalid posted address.state', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses['invalid-address_state']
        assert.strictEqual(errorMessage, 'invalid-address_state')
      })
    })

    describe('invalid-id_number', () => {
      it('invalid posted id_number', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses['invalid-id_number']
        assert.strictEqual(errorMessage, 'invalid-id_number')
      })
    })

    describe('invalid-ssn_last_4', () => {
      it('invalid posted ssn_last_4', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses['invalid-ssn_last_4']
        assert.strictEqual(errorMessage, 'invalid-ssn_last_4')
      })
    })

    describe('invalid-phone', () => {
      it('invalid posted phone', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses['invalid-phone']
        assert.strictEqual(errorMessage, 'invalid-phone')
      })
    })

    describe('invalid-account', () => {
      it('ineligible accessing account', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.invalidAccount
        assert.strictEqual(errorMessage, 'invalid-account')
      })
    })
  })

  describe('receives', () => {
    it('optionally-required posted dob_day', async function () {
      await bundledData(this.test.currentRetry())
      const personNow = cachedResponses.dob_day
      assert.strictEqual(personNow.dob.day, 1)
    })
    it('optionally-required posted dob_month', async function () {
      await bundledData(this.test.currentRetry())
      const personNow = cachedResponses.dob_month
      assert.strictEqual(personNow.dob.month, 1)
    })
    it('optionally-required posted dob_year', async function () {
      await bundledData(this.test.currentRetry())
      const personNow = cachedResponses.dob_year
      assert.strictEqual(personNow.dob.year, 1970)
    })
    it('optionally-required posted address_line1', async function () {
      await bundledData(this.test.currentRetry())
      const personNow = cachedResponses.address_line1
      assert.strictEqual(personNow.address.line1, '123 Park Lane')
    })
    it('optionally-required posted address_city', async function () {
      await bundledData(this.test.currentRetry())
      const personNow = cachedResponses.address_city
      assert.strictEqual(personNow.address.city, 'Vienna')
    })
    it('optionally-required posted address_state', async function () {
      await bundledData(this.test.currentRetry())
      const personNow = cachedResponses.address_state
      assert.strictEqual(personNow.address.state, 'NY')
    })
    it('optionally-required posted address_postal_code', async function () {
      await bundledData(this.test.currentRetry())
      const personNow = cachedResponses.address_postal_code
      assert.strictEqual(personNow.address.postal_code, '1020')
    })
    it('optionally-required posted email', async function () {
      await bundledData(this.test.currentRetry())
      const personNow = cachedResponses.email
      assert.strictEqual(personNow.email, 'email@address.com')
    })
    it('optionally-required posted phone', async function () {
      await bundledData(this.test.currentRetry())
      const personNow = cachedResponses.phone
      assert.strictEqual(personNow.phone, '+14567890123')
    })
    // it('optionally-required posted political_exposure', async function () {
    //   await bundledData(this.test.currentRetry())
    //   const personNow = cachedResponses.political_exposure
    //   assert.strictEqual(personNow.political_exposure, 'existing')
    // })
    // it('optionally-required posted id_number', async function () {
    //   await bundledData(this.test.currentRetry())
    //   const personNow = cachedResponses.id_number
    //   assert.strictEqual(personNow.id_number_provided, true)
    // })
    it('optionally-required posted ssn_last_4', async function () {
      await bundledData(this.test.currentRetry())
      const personNow = cachedResponses.ssn_last_4
      assert.strictEqual(personNow.ssn_last_4_provided, true)
    })
    it('optionally-required posted verification_document_front', async function () {
      await bundledData(this.test.currentRetry())
      const personNow = cachedResponses.verification_document_front
      assert.strictEqual(personNow.verification.status, 'unverified')
    })
    it('optionally-required posted verification_document_back', async function () {
      await bundledData(this.test.currentRetry())
      const personNow = cachedResponses.verification_document_back
      assert.strictEqual(personNow.verification.status, 'unverified')
    })
    it('optionally-required posted verification_additional_document_front', async function () {
      await bundledData(this.test.currentRetry())
      const personNow = cachedResponses.verification_additional_document_front
      assert.strictEqual(personNow.verification.status, 'unverified')
    })
    it('optionally-required posted verification_additional_document_back', async function () {
      await bundledData(this.test.currentRetry())
      const personNow = cachedResponses.verification_additional_document_back
      assert.strictEqual(personNow.verification.status, 'unverified')
    })
  })

  describe('returns', () => {
    it('object', async function () {
      await bundledData(this.test.currentRetry())
      const personNow = cachedResponses.returns
      assert.strictEqual(personNow.object, 'person')
    })
  })

  describe('configuration', () => {
    it('environment STRIPE_JS', async function () {
      await bundledData(this.test.currentRetry())
      const personNow = cachedResponses.returnsWithStripeJS
      assert.notStrictEqual(personNow.tokenUpdate, null)
      assert.notStrictEqual(personNow.tokenUpdate, undefined)
    })
  })
})
