/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')
const TestStripeAccounts = require('../../../../test-stripe-accounts.js')
const DashboardTestHelper = require('@layeredapps/dashboard/test-helper.js')

describe('/account/connect/edit-person', function () {
  let cachedResponses
  async function bundledData () {
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
    await TestStripeAccounts.waitForPersonField(user, 'representative', 'first_name')
    let req = TestHelper.createRequest(`/account/connect/edit-person?personid=${user.representative.personid}`)
    req.account = user.account
    req.session = user.session
    cachedResponses.dob = cachedResponses.address = cachedResponses.relationship_percent_ownership = await req.get()
    req.body = TestStripeAccounts.createPersonData(TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country, user.representative.stripeObject)
    req.body.dob_day = '-1'
    cachedResponses['invalid-dob_day'] = await req.post()
    req.body = TestStripeAccounts.createPersonData(TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country, user.representative.stripeObject)
    req.body.dob_month = '-1'
    cachedResponses['invalid-dob_month'] = await req.post()
    req.body = TestStripeAccounts.createPersonData(TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country, user.representative.stripeObject)
    req.body.dob_year = 'invalid'
    cachedResponses['invalid-dob_year'] = await req.post()
    req.body = TestStripeAccounts.createPersonData(TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country, user.representative.stripeObject)
    req.body.relationship_percent_ownership = '-1'
    cachedResponses['invalid-relationship_percent_ownership'] = await req.post()
    req.body = TestStripeAccounts.createPersonData(TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country, user.representative.stripeObject)
    req.body.address_country = '-1'
    cachedResponses['invalid-address_country'] = await req.post()
    req.body = TestStripeAccounts.createPersonData(TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country, user.representative.stripeObject)
    req.body.address_state = '-1'
    cachedResponses['invalid-address_state'] = await req.post()
    // id number
    await TestHelper.createStripeAccount(user, {
      country: 'HK',
      business_type: 'company'
    })
    await TestHelper.createPerson(user, {
      relationship_representative: 'true',
      relationship_title: 'SVP Testing',
      relationship_percent_ownership: '0'
    })
    await TestStripeAccounts.waitForPersonField(user, 'representative', 'address.city')
    req = TestHelper.createRequest(`/account/connect/edit-person?personid=${user.representative.personid}`)
    req.account = user.account
    req.session = user.session
    cachedResponses.id_number = await req.get()
    req.body = TestStripeAccounts.createPersonData(TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country, user.representative.stripeObject)
    req.body.id_number = '-1'
    cachedResponses['invalid-id_number'] = await req.post()
    // invalid phone
    // kata and kana fields
    await TestHelper.createStripeAccount(user, {
      country: 'JP',
      business_type: 'company'
    })
    await TestHelper.createPerson(user, {
      relationship_representative: 'true',
      relationship_title: 'SVP Testing',
      relationship_percent_ownership: '0'
    })
    await TestStripeAccounts.waitForPersonField(user, 'representative', 'address_kana.city')
    req = TestHelper.createRequest(`/account/connect/edit-person?personid=${user.representative.personid}`)
    req.account = user.account
    req.session = user.session
    cachedResponses.kana_kanji = await req.get()
    // phone and ssn
    await TestHelper.createStripeAccount(user, {
      country: 'US',
      business_type: 'company'
    })
    await TestHelper.createPerson(user, {
      relationship_representative: 'true',
      relationship_executive: 'true',
      relationship_title: 'SVP Testing',
      relationship_percent_ownership: '0'
    })
    await TestStripeAccounts.waitForPersonField(user, 'representative', 'address.city')
    req = TestHelper.createRequest(`/account/connect/edit-person?personid=${user.representative.personid}`)
    req.account = user.account
    req.session = user.session
    cachedResponses.phone = cachedResponses.ssn_last_4 = await req.get()
    req.body = TestStripeAccounts.createPersonData(TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country, user.representative.stripeObject)
    req.body.phone = '-1'
    cachedResponses['invalid-phone'] = await req.post()
    req.body = TestStripeAccounts.createPersonData(TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country, user.representative.stripeObject)
    req.body.ssn_last_4 = '-1'
    cachedResponses['invalid-ssn_last_4'] = await req.post()
    // email
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
    await TestStripeAccounts.waitForPersonField(user, 'representative', 'address.city')
    req = TestHelper.createRequest(`/account/connect/edit-person?personid=${user.representative.personid}`)
    req.account = user.account
    req.session = user.session
    cachedResponses.email = await req.get()
    req.body = TestStripeAccounts.createPersonData(TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country, user.representative.stripeObject)
    req.body.email = '-1'
    cachedResponses['invalid-email'] = await req.post()
    req.body = TestStripeAccounts.createPersonData(TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country, user.representative.stripeObject)
    await req.post()
    await TestStripeAccounts.waitForPersonField(user, 'representative', 'verification.document')
    await TestStripeAccounts.waitForPersonField(user, 'representative', 'verification.additional_document')
    req = TestHelper.createRequest(`/account/connect/edit-person?personid=${user.representative.personid}`)
    req.account = user.account
    req.session = user.session
    cachedResponses.uploads = await req.get()
    cachedResponses.finished = true
  }

  describe('exceptions', () => {
    it('should reject invalid person', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest('/account/connect/edit-person?personid=invalid')
      req.account = user.account
      req.session = user.session
      let errorMessage
      try {
        await req.route.api.before(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-personid')
    })
  })

  describe('view', async () => {
    it('should present the form', async () => {
      await bundledData()
      const result = cachedResponses.dob
      const doc = TestHelper.extractDoc(result.html)
      assert.strictEqual(doc.getElementById('submit-form').tag, 'form')
      assert.strictEqual(doc.getElementById('submit-button').tag, 'button')
    })
    it('should have element for field dob_day', async () => {
      await bundledData()
      const result = cachedResponses.dob
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('dob_day')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field dob_month', async () => {
      await bundledData()
      const result = cachedResponses.dob
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('dob_month')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field dob_year', async () => {
      await bundledData()
      const result = cachedResponses.dob
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('dob_year')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field relationship_percent_ownership', async () => {
      await bundledData()
      const result = cachedResponses.relationship_percent_ownership
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('relationship_percent_ownership')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field address_line1', async () => {
      await bundledData()
      const result = cachedResponses.address
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('address_line1')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field address_line2', async () => {
      await bundledData()
      const result = cachedResponses.address
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('address_line2')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field address_city', async () => {
      await bundledData()
      const result = cachedResponses.address
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('address_city')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field address_state', async () => {
      await bundledData()
      const result = cachedResponses.address
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('address_state')
      assert.notStrictEqual(field, undefined)
    })
    // it('should have element for field address_country', async () => {
    //   const result = cachedResponses.address
    //   const doc = TestHelper.extractDoc(result.html)
    //   const field = doc.getElementById('address_country')
    //   assert.notStrictEqual(field, undefined)
    // })
    it('should have element for field address_postal_code', async () => {
      await bundledData()
      const result = cachedResponses.address
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('address_postal_code')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field id_number', async () => {
      await bundledData()
      const result = cachedResponses.id_number
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('id_number')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field phone', async () => {
      await bundledData()
      const result = cachedResponses.phone
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('phone')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field ssn_last_4', async () => {
      await bundledData()
      const result = cachedResponses.ssn_last_4
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('ssn_last_4')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field email', async () => {
      await bundledData()
      const result = cachedResponses.email
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('email')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field first_name_kana', async () => {
      await bundledData()
      const result = cachedResponses.kana_kanji
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('first_name_kana')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field last_name_kana', async () => {
      await bundledData()
      const result = cachedResponses.kana_kanji
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('last_name_kana')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field address_kana_line1', async () => {
      await bundledData()
      const result = cachedResponses.kana_kanji
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('address_kana_line1')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field address_kana_town', async () => {
      await bundledData()
      const result = cachedResponses.kana_kanji
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('address_kana_town')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field address_kana_city', async () => {
      await bundledData()
      const result = cachedResponses.kana_kanji
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('address_kana_city')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field address_kana_state', async () => {
      await bundledData()
      const result = cachedResponses.kana_kanji
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('address_kana_state')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field first_name_kanji', async () => {
      await bundledData()
      const result = cachedResponses.kana_kanji
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('first_name_kana')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field last_name_kanji', async () => {
      await bundledData()
      const result = cachedResponses.kana_kanji
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('last_name_kana')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field address_kanji_line1', async () => {
      await bundledData()
      const result = cachedResponses.kana_kanji
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('address_kanji_line1')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field address_kanji_town', async () => {
      await bundledData()
      const result = cachedResponses.kana_kanji
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('address_kanji_town')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field address_kanji_city', async () => {
      await bundledData()
      const result = cachedResponses.kana_kanji
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('address_kanji_city')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field address_kanji_state', async () => {
      await bundledData()
      const result = cachedResponses.kana_kanji
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('address_kanji_state')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field verification_document_front', async () => {
      await bundledData()
      const result = cachedResponses.uploads
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('verification_document_front')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field verification_document_back', async () => {
      await bundledData()
      const result = cachedResponses.uploads
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('verification_document_back')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field verification_additional_document_front', async () => {
      await bundledData()
      const result = cachedResponses.uploads
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('verification_additional_document_front')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field verification_additional_document_back', async () => {
      await bundledData()
      const result = cachedResponses.uploads
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('verification_additional_document_back')
      assert.notStrictEqual(field, undefined)
    })
  })

  describe('submit', async () => {
    it('should update person no stripe.js', async () => {
      const user = await TestStripeAccounts.createCompanyWithOwners('DE', 1)
      const req = TestHelper.createRequest(`/account/connect/edit-person?personid=${user.owner.personid}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        verification_document_back: TestStripeAccounts['success_id_scan_back.png'],
        verification_document_front: TestStripeAccounts['success_id_scan_front.png']
      }
      req.body = TestStripeAccounts.createPersonData(TestHelper.nextIdentity(), 'DE', user.owner.stripeObject)
      const result = await req.post()
      assert.strictEqual(result.redirect, `/account/connect/person?personid=${user.owner.personid}`)
    })

    it('should update person stripe.js v3 (screenshots)', async () => {
      const user = await TestStripeAccounts.createCompanyWithOwners('US', 1)
      const req = TestHelper.createRequest(`/account/connect/edit-person?personid=${user.owner.personid}`)
      req.account = user.account
      req.session = user.session
      req.uploads = {
        verification_document_back: TestStripeAccounts['success_id_scan_back.png'],
        verification_document_front: TestStripeAccounts['success_id_scan_front.png']
      }
      req.body = TestStripeAccounts.createPersonData(TestHelper.nextIdentity(), 'US', user.owner.stripeObject)
      req.filename = __filename
      req.screenshots = [
        { hover: '#account-menu-container' },
        { click: '/account/connect' },
        { click: `/account/connect/stripe-account?stripeid=${user.stripeAccount.stripeid}` },
        { click: `/account/connect/persons?stripeid=${user.stripeAccount.stripeid}` },
        { click: `/account/connect/person?personid=${user.owner.personid}` },
        { click: `/account/connect/edit-person?personid=${user.owner.personid}` },
        {
          fill: '#submit-form',
          waitAfter: async (page) => {
            while (true) {
              try {
                const url = await page.url()
                if (url.indexOf('edit-person') === -1) {
                  break
                }
              } catch (error) {
              }
              await page.waitForTimeout(100)
            }
          }
        }
      ]
      global.stripeJS = 3
      const result = await req.post()
      assert.strictEqual(result.redirect, `/account/connect/person?personid=${user.owner.personid}`)
    })
  })

  describe('errors', () => {
    it('reject invalid field dob_day', async () => {
      await bundledData()
      const result = cachedResponses['invalid-dob_day']
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-dob_day')
    })
    it('reject invalid field dob_month', async () => {
      await bundledData()
      const result = cachedResponses['invalid-dob_month']
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-dob_month')
    })
    it('reject invalid field dob_year', async () => {
      await bundledData()
      const result = cachedResponses['invalid-dob_year']
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-dob_year')
    })
    it('reject invalid field relationship_percent_ownership', async () => {
      await bundledData()
      const result = cachedResponses['invalid-relationship_percent_ownership']
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-relationship_percent_ownership')
    })
    it('reject invalid field id_number', async () => {
      await bundledData()
      const result = cachedResponses['invalid-id_number']
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-id_number')
    })
    it('reject invalid field phone', async () => {
      await bundledData()
      const result = cachedResponses['invalid-phone']
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-phone')
    })
    it('reject invalid field ssn_last_4', async () => {
      await bundledData()
      const result = cachedResponses['invalid-ssn_last_4']
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-ssn_last_4')
    })
    it('reject invalid field email', async () => {
      await bundledData()
      const result = cachedResponses['invalid-email']
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-email')
    })
  })
})
