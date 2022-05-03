/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')
const TestStripeAccounts = require('../../../../test-stripe-accounts.js')
const DashboardTestHelper = require('@layeredapps/dashboard/test-helper.js')

describe('/account/connect/edit-person', function () {
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
    global.webhooks = [true]
    await TestHelper.rotateWebhook(true)
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
    await TestHelper.rotateWebhook(true)
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
    await TestHelper.rotateWebhook(true)
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
    await TestHelper.rotateWebhook(true)
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
    await TestHelper.rotateWebhook(true)
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
    // xss
    await TestHelper.createPerson(user, {
      relationship_director: 'true',
      relationship_executive: 'true',
      relationship_title: 'SVP Testing',
      relationship_percent_ownership: '0'
    })
    await TestStripeAccounts.waitForPersonField(user, 'director', 'address.city')
    req = TestHelper.createRequest(`/account/connect/edit-person?personid=${user.director.personid}`)
    req.account = user.account
    req.session = user.session
    req.body = TestStripeAccounts.createPersonData(TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country, user.director.stripeObject)
    req.body.address_city = '<script>'
    cachedResponses.xss = await req.post()
    // csrf
    req.puppeteer = false
    req.body = TestStripeAccounts.createPersonData(TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country, user.director.stripeObject)
    req.body['csrf-token'] = 'invalid'
    cachedResponses.csrf = await req.post()
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
    it('should present the form', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.dob
      const doc = TestHelper.extractDoc(result.html)
      assert.strictEqual(doc.getElementById('submit-form').tag, 'form')
      assert.strictEqual(doc.getElementById('submit-button').tag, 'button')
    })
    it('should have element for field dob_day', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.dob
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('dob_day')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field dob_month', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.dob
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('dob_month')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field dob_year', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.dob
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('dob_year')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field relationship_percent_ownership', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.relationship_percent_ownership
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('relationship_percent_ownership')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field address_line1', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.address
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('address_line1')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field address_line2', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.address
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('address_line2')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field address_city', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.address
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('address_city')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field address_state', async function () {
      await bundledData(this.test.currentRetry())
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
    it('should have element for field address_postal_code', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.address
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('address_postal_code')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field id_number', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.id_number
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('id_number')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field phone', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.phone
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('phone')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field ssn_last_4', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.ssn_last_4
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('ssn_last_4')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field email', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.email
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('email')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field first_name_kana', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.kana_kanji
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('first_name_kana')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field last_name_kana', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.kana_kanji
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('last_name_kana')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field address_kana_line1', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.kana_kanji
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('address_kana_line1')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field address_kana_town', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.kana_kanji
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('address_kana_town')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field address_kana_city', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.kana_kanji
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('address_kana_city')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field address_kana_state', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.kana_kanji
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('address_kana_state')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field first_name_kanji', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.kana_kanji
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('first_name_kana')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field last_name_kanji', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.kana_kanji
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('last_name_kana')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field address_kanji_line1', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.kana_kanji
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('address_kanji_line1')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field address_kanji_town', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.kana_kanji
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('address_kanji_town')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field address_kanji_city', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.kana_kanji
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('address_kanji_city')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field address_kanji_state', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.kana_kanji
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('address_kanji_state')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field verification_document_front', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.uploads
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('verification_document_front')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field verification_document_back', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.uploads
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('verification_document_back')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field verification_additional_document_front', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.uploads
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('verification_additional_document_front')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field verification_additional_document_back', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.uploads
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('verification_additional_document_back')
      assert.notStrictEqual(field, undefined)
    })
  })

  describe('submit', async () => {
    it('should update person no stripe.js', async () => {
      global.webhooks = [true]
      await TestHelper.rotateWebhook(true)
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
      global.webhooks = [true]
      await TestHelper.rotateWebhook(true)
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
      global.pageSize = 50
      const result = await req.post()
      assert.strictEqual(result.redirect, `/account/connect/person?personid=${user.owner.personid}`)
    })
  })

  describe('errors', () => {
    it('invalid-dob_day', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses['invalid-dob_day']
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-dob_day')
    })
    it('invalid-dob_month', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses['invalid-dob_month']
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-dob_month')
    })
    it('invalid-dob_year', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses['invalid-dob_year']
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-dob_year')
    })
    it('invalid-relationship_percent_ownership', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses['invalid-relationship_percent_ownership']
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-relationship_percent_ownership')
    })
    it('invalid-id_number', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses['invalid-id_number']
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-id_number')
    })
    it('invalid-phone', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses['invalid-phone']
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-phone')
    })
    it('invalid-ssn_last_4', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses['invalid-ssn_last_4']
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-ssn_last_4')
    })
    it('invalid-email', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses['invalid-email']
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-email')
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
