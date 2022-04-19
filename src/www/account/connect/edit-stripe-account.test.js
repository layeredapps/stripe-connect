/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')
const TestStripeAccounts = require('../../../../test-stripe-accounts.js')
const DashboardTestHelper = require('@layeredapps/dashboard/test-helper.js')

describe('/account/connect/edit-stripe-account', function () {
  describe('exceptions', () => {
    it('should reject invalid Stripe account', async function () {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest('/account/connect/edit-stripe-account?stripeid=invalid')
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
      // individual
      await TestHelper.createStripeAccount(user, {
        country: 'AU',
        business_type: 'individual'
      })
      let req = TestHelper.createRequest(`/account/connect/edit-stripe-account?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      cachedResponses.individual_dob = cachedResponses.business_profile = cachedResponses.individual_address = await req.get()
      // id number
      await TestHelper.createStripeAccount(user, {
        country: 'HK',
        business_type: 'individual'
      })
      req = TestHelper.createRequest(`/account/connect/edit-stripe-account?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      cachedResponses.individual_id_number = await req.get()
      // kata and kana fields
      await TestHelper.createStripeAccount(user, {
        country: 'JP',
        business_type: 'individual'
      })
      req = TestHelper.createRequest(`/account/connect/edit-stripe-account?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      cachedResponses.individual_kana_kanji = await req.get()
      // phone and ssn
      await TestHelper.createStripeAccount(user, {
        country: 'US',
        business_type: 'individual'
      })
      req = TestHelper.createRequest(`/account/connect/edit-stripe-account?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      cachedResponses.individual_phone = await req.get()
      cachedResponses.individual_ssn_last_4 = await req.get()
      //  name email and uploads
      await TestHelper.createStripeAccount(user, {
        country: 'AT',
        business_type: 'individual'
      })
      req = TestHelper.createRequest(`/account/connect/edit-stripe-account?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      cachedResponses.individual_email = cachedResponses.individual_uploads = cachedResponses.individual_name = await req.get()
      // company
      await TestHelper.createStripeAccount(user, {
        country: 'AU',
        business_type: 'company'
      })
      req = TestHelper.createRequest(`/account/connect/edit-stripe-account?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      cachedResponses.company_name = cachedResponses.company_phone = cachedResponses.company_registration_number = cachedResponses.company_address = await req.get()
      // tax id
      await TestHelper.createStripeAccount(user, {
        country: 'AT',
        business_type: 'company'
      })
      req = TestHelper.createRequest(`/account/connect/edit-stripe-account?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      cachedResponses.company_tax_id = await req.get()
      // kata and kana fields
      await TestHelper.createStripeAccount(user, {
        country: 'JP',
        business_type: 'company'
      })
      req = TestHelper.createRequest(`/account/connect/edit-stripe-account?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      cachedResponses.company_kana_kanji = await req.get()
      // // uploads
      // await TestHelper.createStripeAccount(user, {
      //   country: 'BR',
      //   business_type: 'company'
      // })
      // req = TestHelper.createRequest(`/account/connect/edit-stripe-account?stripeid=${user.stripeAccount.stripeid}`)
      // req.account = user.account
      // req.session = user.session
      // cachedResponses.company_uploads = await req.get()
      cachedResponses.finished = true
    }
    it('should present the form', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.individual_dob
      const doc = TestHelper.extractDoc(result.html)
      assert.strictEqual(doc.getElementById('submit-form').tag, 'form')
      assert.strictEqual(doc.getElementById('submit-button').tag, 'button')
    })
    it('should have element for field business_profile_mcc', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.business_profile
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('business_profile_mcc')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field business_profile_url', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.business_profile
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('business_profile_url')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field business_profile_product_description', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.business_profile
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('business_profile_product_description')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field individual_dob_day', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.individual_dob
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('individual_dob_day')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field individual_dob_month', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.individual_dob
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('individual_dob_month')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field individual_dob_year', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.individual_dob
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('individual_dob_year')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field individual_id_number', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.individual_id_number
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('individual_id_number')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field individual_phone', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.individual_phone
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('individual_phone')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field individual_ssn_last_4', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.individual_ssn_last_4
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('individual_ssn_last_4')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field individual_email', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.individual_email
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('individual_email')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field individual_first_name', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.individual_name
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('individual_first_name')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field individual_last_name', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.individual_name
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('individual_last_name')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field individual_first_name_kana', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.individual_kana_kanji
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('individual_first_name_kana')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field individual_last_name_kana', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.individual_kana_kanji
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('individual_last_name_kana')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field individual_first_name_kanji', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.individual_kana_kanji
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('individual_first_name_kana')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field individual_last_name_kanji', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.individual_kana_kanji
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('individual_last_name_kana')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field individual_address_line1', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.individual_address
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('individual_address_line1')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field individual_address_line2', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.individual_address
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('individual_address_line2')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field individual_address_city', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.individual_address
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('individual_address_city')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field individual_address_state', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.individual_address
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('individual_address_state')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field individual_address_postal_code', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.individual_address
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('individual_address_postal_code')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field individual_address_kana_line1', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.individual_kana_kanji
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('individual_address_kana_line1')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field individual_address_kana_town', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.individual_kana_kanji
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('individual_address_kana_town')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field individual_address_kana_city', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.individual_kana_kanji
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('individual_address_kana_city')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field individual_address_kana_state', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.individual_kana_kanji
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('individual_address_kana_state')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field individual_address_kanji_line1', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.individual_kana_kanji
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('individual_address_kanji_line1')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field individual_address_kanji_town', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.individual_kana_kanji
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('individual_address_kanji_town')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field individual_address_kanji_city', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.individual_kana_kanji
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('individual_address_kanji_city')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field individual_address_kanji_state', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.individual_kana_kanji
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('individual_address_kanji_state')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field individual_verification_document_front', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.individual_uploads
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('individual_verification_document_front')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field individual_verification_document_back', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.individual_uploads
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('individual_verification_document_back')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field individual_verification_additional_document_front', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.individual_uploads
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('individual_verification_additional_document_front')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field individual_verification_additional_document_back', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.individual_uploads
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('individual_verification_additional_document_back')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field company_name', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.company_name
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('company_name')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field company_tax_id', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.company_tax_id
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('company_tax_id')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field company_registration_number', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.company_registration_number
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('company_registration_number')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field company_phone', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.company_phone
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('company_name')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field company_address_line1', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.company_address
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('company_address_line1')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field company_address_line2', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.company_address
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('company_address_line2')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field company_address_city', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.company_address
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('company_address_city')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field company_address_state', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.company_address
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('company_address_state')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field company_address_postal_code', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.company_address
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('company_address_postal_code')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field company_address_kana_line1', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.company_kana_kanji
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('company_address_kana_line1')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field company_address_kana_town', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.company_kana_kanji
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('company_address_kana_town')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field company_address_kana_city', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.company_kana_kanji
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('company_address_kana_city')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field company_address_kana_state', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.company_kana_kanji
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('company_address_kana_state')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field company_address_kanji_line1', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.company_kana_kanji
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('company_address_kanji_line1')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field company_address_kanji_town', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.company_kana_kanji
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('company_address_kanji_town')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field company_address_kanji_city', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.company_kana_kanji
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('company_address_kanji_city')
      assert.notStrictEqual(field, undefined)
    })
    it('should have element for field company_address_kanji_state', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.company_kana_kanji
      const doc = TestHelper.extractDoc(result.html)
      const field = doc.getElementById('company_address_kanji_state')
      assert.notStrictEqual(field, undefined)
    })
    // it('should have element for field company_verification_document_front', async function () {
    //   await bundledData(this.test.currentRetry())
    //   const result = cachedResponses.company_uploads
    //   const doc = TestHelper.extractDoc(result.html)
    //   const field = doc.getElementById('company_verification_document_front')
    //   assert.notStrictEqual(field, undefined)
    // })
    // it('should have element for field company_verification_document_back', async function () {
    //   await bundledData(this.test.currentRetry())
    //   const result = cachedResponses.company_uploads
    //   const doc = TestHelper.extractDoc(result.html)
    //   const field = doc.getElementById('company_verification_document_back')
    //   assert.notStrictEqual(field, undefined)
    // })
  })

  describe('submit', () => {
    it('should update registration no stripe.js (individual)', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'AT',
        business_type: 'individual'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-stripe-account?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      req.body = TestStripeAccounts.createAccountData(TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country, user.stripeAccount.stripeObject)
      req.uploads = TestStripeAccounts.createAccountUploadData(user.stripeAccount.stripeObject)
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })

    it('should update registration stripe.js v3 (individual) (screenshots)', async () => {
      global.stripeJS = 3
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'FR',
        business_type: 'individual'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-stripe-account?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      req.body = TestStripeAccounts.createAccountData(TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country, user.stripeAccount.stripeObject)
      req.uploads = {
        individual_verification_document_front: TestStripeAccounts['success_id_scan_front.png'],
        individual_verification_document_back: TestStripeAccounts['success_id_scan_back.png'],
        individual_verification_additional_document_front: TestStripeAccounts['success_id_scan_front.png'],
        individual_verification_additional_document_back: TestStripeAccounts['success_id_scan_back.png']
      }
      // req.uploads = TestStripeAccounts.createAccountUploadData(user.stripeAccount.stripeObject)
      // req.body = Object.assign(req.body, req.uploads)
      req.filename = __filename
      req.screenshots = [
        { hover: '#account-menu-container' },
        { click: '/account/connect' },
        { click: '/account/connect/stripe-accounts' },
        { click: `/account/connect/stripe-account?stripeid=${user.stripeAccount.stripeid}` },
        { click: `/account/connect/edit-stripe-account?stripeid=${user.stripeAccount.stripeid}` },
        {
          fill: '#submit-form',
          waitAfter: async (page) => {
            while (true) {
              try {
                const table = await page.$('#stripe-accounts-table')
                if (table) {
                  return
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
      const doc = TestHelper.extractDoc(result.html)
      const accountTable = doc.getElementById(user.stripeAccount.stripeid)
      assert.strictEqual(accountTable.tag, 'tbody')
    })

    it('should update registration no stripe.js (company)', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'NZ',
        business_type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-stripe-account?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      req.body = TestStripeAccounts.createAccountData(TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country, user.stripeAccount.stripeObject)
      req.uploads = TestStripeAccounts.createAccountUploadData(user.stripeAccount.stripeObject)
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })

    it('should update registration stripe.js v3 (company)', async () => {
      global.stripeJS = 3
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'AU',
        business_type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-stripe-account?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      req.waitAfter = async (page) => {
        while (true) {
          try {
            const loaded = await page.evaluate(() => {
              return document.getElementById('message-container').children.length
            })
            if (loaded) {
              break
            }
          } catch (error) {
          }
          await page.waitForTimeout(100)
        }
      }
      req.body = TestStripeAccounts.createAccountData(TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country, user.stripeAccount.stripeObject)
      req.uploads = TestStripeAccounts.createAccountUploadData(user.stripeAccount.stripeObject)
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })
  })

  describe('errors', () => {
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
      // individual
      await TestHelper.createStripeAccount(user, {
        country: 'AU',
        business_type: 'individual'
      })
      let req = TestHelper.createRequest(`/account/connect/edit-stripe-account?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      req.body = TestStripeAccounts.createAccountData(TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country, user.stripeAccount.stripeObject)
      delete (req.body.business_profile_mcc)
      cachedResponses.invalid_business_profile_mcc = await req.post()
      req.body = TestStripeAccounts.createAccountData(TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country, user.stripeAccount.stripeObject)
      delete (req.body.business_profile_url)
      cachedResponses.invalid_business_profile_url = await req.post()
      req.body = TestStripeAccounts.createAccountData(TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country, user.stripeAccount.stripeObject)
      delete (req.body.individual_first_name)
      cachedResponses.invalid_individual_first_name = await req.post()
      req.body = TestStripeAccounts.createAccountData(TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country, user.stripeAccount.stripeObject)
      delete (req.body.individual_last_name)
      cachedResponses.invalid_individual_last_name = await req.post()
      req.body = TestStripeAccounts.createAccountData(TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country, user.stripeAccount.stripeObject)
      delete (req.body.individual_dob_day)
      cachedResponses.invalid_individual_dob_day = await req.post()
      req.body = TestStripeAccounts.createAccountData(TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country, user.stripeAccount.stripeObject)
      delete (req.body.individual_dob_month)
      cachedResponses.invalid_individual_dob_month = await req.post()
      req.body = TestStripeAccounts.createAccountData(TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country, user.stripeAccount.stripeObject)
      delete (req.body.individual_dob_year)
      cachedResponses.invalid_individual_dob_year = await req.post()
      req.body = TestStripeAccounts.createAccountData(TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country, user.stripeAccount.stripeObject)
      delete (req.body.individual_address_line1)
      cachedResponses.invalid_individual_address_line1 = await req.post()
      req.body = TestStripeAccounts.createAccountData(TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country, user.stripeAccount.stripeObject)
      delete (req.body.individual_address_city)
      cachedResponses.invalid_individual_address_city = await req.post()
      req.body = TestStripeAccounts.createAccountData(TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country, user.stripeAccount.stripeObject)
      delete (req.body.individual_address_state)
      cachedResponses.invalid_individual_address_state = await req.post()
      req.body = TestStripeAccounts.createAccountData(TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country, user.stripeAccount.stripeObject)
      delete (req.body.individual_address_postal_code)
      cachedResponses.invalid_individual_address_postal_code = await req.post()
      // id number
      await TestHelper.createStripeAccount(user, {
        country: 'HK',
        business_type: 'individual'
      })
      req = TestHelper.createRequest(`/account/connect/edit-stripe-account?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      req.body = TestStripeAccounts.createAccountData(TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country, user.stripeAccount.stripeObject)
      delete (req.body.individual_id_number)
      cachedResponses.invalid_individual_id_number = await req.post()
      // kata and kana fields
      await TestHelper.createStripeAccount(user, {
        country: 'JP',
        business_type: 'individual'
      })
      req = TestHelper.createRequest(`/account/connect/edit-stripe-account?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      req.body = TestStripeAccounts.createAccountData(TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country, user.stripeAccount.stripeObject)
      delete (req.body.individual_first_name_kana)
      cachedResponses.invalid_individual_first_name_kana = await req.post()
      req.body = TestStripeAccounts.createAccountData(TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country, user.stripeAccount.stripeObject)
      delete (req.body.individual_last_name_kana)
      cachedResponses.invalid_individual_last_name_kana = await req.post()
      req.body = TestStripeAccounts.createAccountData(TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country, user.stripeAccount.stripeObject)
      delete (req.body.individual_first_name_kanji)
      cachedResponses.invalid_individual_first_name_kanji = await req.post()
      req.body = TestStripeAccounts.createAccountData(TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country, user.stripeAccount.stripeObject)
      delete (req.body.individual_last_name_kanji)
      cachedResponses.invalid_individual_last_name_kanji = await req.post()
      req.body = TestStripeAccounts.createAccountData(TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country, user.stripeAccount.stripeObject)
      delete (req.body.individual_address_kana_line1)
      cachedResponses.invalid_individual_address_kana_line1 = await req.post()
      req.body = TestStripeAccounts.createAccountData(TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country, user.stripeAccount.stripeObject)
      delete (req.body.individual_address_kana_city)
      cachedResponses.invalid_individual_address_kana_city = await req.post()
      req.body = TestStripeAccounts.createAccountData(TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country, user.stripeAccount.stripeObject)
      delete (req.body.individual_address_kana_state)
      cachedResponses.invalid_individual_address_kana_state = await req.post()
      req.body = TestStripeAccounts.createAccountData(TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country, user.stripeAccount.stripeObject)
      delete (req.body.individual_address_kana_town)
      cachedResponses.invalid_individual_address_kana_town = await req.post()
      req.body = TestStripeAccounts.createAccountData(TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country, user.stripeAccount.stripeObject)
      delete (req.body.individual_address_kanji_line1)
      cachedResponses.invalid_individual_address_kanji_line1 = await req.post()
      req.body = TestStripeAccounts.createAccountData(TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country, user.stripeAccount.stripeObject)
      delete (req.body.individual_address_kanji_city)
      cachedResponses.invalid_individual_address_kanji_city = await req.post()
      req.body = TestStripeAccounts.createAccountData(TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country, user.stripeAccount.stripeObject)
      delete (req.body.individual_address_kanji_state)
      cachedResponses.invalid_individual_address_kanji_state = await req.post()
      req.body = TestStripeAccounts.createAccountData(TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country, user.stripeAccount.stripeObject)
      delete (req.body.individual_address_kanji_town)
      cachedResponses.invalid_individual_address_kanji_town = await req.post()
      // phone and ssn
      await TestHelper.createStripeAccount(user, {
        country: 'US',
        business_type: 'individual'
      })
      req = TestHelper.createRequest(`/account/connect/edit-stripe-account?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      req.body = TestStripeAccounts.createAccountData(TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country, user.stripeAccount.stripeObject)
      delete (req.body.individual_phone)
      cachedResponses.invalid_individual_phone = await req.post()
      req.body = TestStripeAccounts.createAccountData(TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country, user.stripeAccount.stripeObject)
      delete (req.body.individual_ssn_last_4)
      cachedResponses.invalid_individual_ssn_last_4 = await req.post()
      //  name email and uploads
      await TestHelper.createStripeAccount(user, {
        country: 'AT',
        business_type: 'individual'
      })
      req = TestHelper.createRequest(`/account/connect/edit-stripe-account?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      req.body = TestStripeAccounts.createAccountData(TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country, user.stripeAccount.stripeObject)
      delete (req.body.individual_email)
      cachedResponses.invalid_individual_email = await req.post()
      req.body = TestStripeAccounts.createAccountData(TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country, user.stripeAccount.stripeObject)
      delete (req.body.individual_name)
      cachedResponses.invalid_individual_name = await req.post()
      // req.body = TestStripeAccounts.createAccountData(TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country, user.stripeAccount.stripeObject)
      // await req.post()
      // await TestHelper.waitForCurrentlyDueFields(user, 'individual.verification.document')
      // req.uploads = {
      //   individual_verification_document_front: TestStripeAccounts['success_id_scan_front.png']
      // }
      // cachedResponses.invalid_individual_verification_document_back = await req.post()
      // req.uploads = {
      //   individual_verification_document_back: TestStripeAccounts['success_id_scan_front.png']
      // }
      // cachedResponses.invalid_individual_verification_document_front = await req.post()
      // company
      await TestHelper.createStripeAccount(user, {
        country: 'AU',
        business_type: 'company'
      })
      req = TestHelper.createRequest(`/account/connect/edit-stripe-account?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      req.body = TestStripeAccounts.createAccountData(TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country, user.stripeAccount.stripeObject)
      delete (req.body.company_name)
      cachedResponses.invalid_company_name = await req.post()
      req.body = TestStripeAccounts.createAccountData(TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country, user.stripeAccount.stripeObject)
      delete (req.body.company_phone)
      cachedResponses.invalid_company_phone = await req.post()
      req.body = TestStripeAccounts.createAccountData(TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country, user.stripeAccount.stripeObject)
      delete (req.body.company_registration_number)
      cachedResponses.invalid_company_registration_number = await req.post()
      // tax id
      await TestHelper.createStripeAccount(user, {
        country: 'AT',
        business_type: 'company'
      })
      req = TestHelper.createRequest(`/account/connect/edit-stripe-account?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      req.body = TestStripeAccounts.createAccountData(TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country, user.stripeAccount.stripeObject)
      delete (req.body.company_tax_id)
      cachedResponses.invalid_company_tax_id = await req.post()
      // kata and kana fields
      await TestHelper.createStripeAccount(user, {
        country: 'JP',
        business_type: 'company'
      })
      req = TestHelper.createRequest(`/account/connect/edit-stripe-account?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      req.body = TestStripeAccounts.createAccountData(TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country, user.stripeAccount.stripeObject)
      delete (req.body.company_name_kana)
      cachedResponses.invalid_company_name_kana = await req.post()
      req.body = TestStripeAccounts.createAccountData(TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country, user.stripeAccount.stripeObject)
      delete (req.body.company_name_kanji)
      cachedResponses.invalid_company_name_kanji = await req.post()
      req.body = TestStripeAccounts.createAccountData(TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country, user.stripeAccount.stripeObject)
      delete (req.body.company_address_kana_line1)
      cachedResponses.invalid_company_address_kana_line1 = await req.post()
      req.body = TestStripeAccounts.createAccountData(TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country, user.stripeAccount.stripeObject)
      delete (req.body.company_address_kana_city)
      cachedResponses.invalid_company_address_kana_city = await req.post()
      req.body = TestStripeAccounts.createAccountData(TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country, user.stripeAccount.stripeObject)
      delete (req.body.company_address_kana_state)
      cachedResponses.invalid_company_address_kana_state = await req.post()
      req.body = TestStripeAccounts.createAccountData(TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country, user.stripeAccount.stripeObject)
      delete (req.body.company_address_kana_town)
      cachedResponses.invalid_company_address_kana_town = await req.post()
      req.body = TestStripeAccounts.createAccountData(TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country, user.stripeAccount.stripeObject)
      delete (req.body.company_address_kanji_line1)
      cachedResponses.invalid_company_address_kanji_line1 = await req.post()
      req.body = TestStripeAccounts.createAccountData(TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country, user.stripeAccount.stripeObject)
      delete (req.body.company_address_kanji_city)
      cachedResponses.invalid_company_address_kanji_city = await req.post()
      req.body = TestStripeAccounts.createAccountData(TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country, user.stripeAccount.stripeObject)
      delete (req.body.company_address_kanji_state)
      cachedResponses.invalid_company_address_kanji_state = await req.post()
      req.body = TestStripeAccounts.createAccountData(TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country, user.stripeAccount.stripeObject)
      delete (req.body.company_address_kanji_town)
      cachedResponses.invalid_company_address_kanji_town = await req.post()
      // address
      await TestHelper.createStripeAccount(user, {
        country: 'US',
        business_type: 'company'
      })
      req = TestHelper.createRequest(`/account/connect/edit-stripe-account?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      req.body = TestStripeAccounts.createAccountData(TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country, user.stripeAccount.stripeObject)
      delete (req.body.company_address_line1)
      cachedResponses.invalid_company_address_line1 = await req.post()
      req.body = TestStripeAccounts.createAccountData(TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country, user.stripeAccount.stripeObject)
      delete (req.body.company_address_city)
      cachedResponses.invalid_company_address_city = await req.post()
      req.body = TestStripeAccounts.createAccountData(TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country, user.stripeAccount.stripeObject)
      delete (req.body.company_address_state)
      cachedResponses.invalid_company_address_state = await req.post()
      req.body = TestStripeAccounts.createAccountData(TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country, user.stripeAccount.stripeObject)
      delete (req.body.company_address_postal_code)
      cachedResponses.invalid_company_address_postal_code = await req.post()
      // // uploads
      // await TestHelper.createStripeAccount(user, {
      //   country: 'BR',
      //   business_type: 'company'
      // })
      // req = TestHelper.createRequest(`/account/connect/edit-stripe-account?stripeid=${user.stripeAccount.stripeid}`)
      // req.account = user.account
      // req.session = user.session
      // req.body = TestStripeAccounts.createAccountData(TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country, user.stripeAccount.stripeObject)
      // await req.post()
      // delete (req.body)
      // await TestHelper.waitForCurrentlyDueFields(user, 'company.verification.document')
      // req.uploads = {
      //   company_verification_document_back: TestStripeAccounts['success_id_scan_back.png'],
      // }
      // cachedResponses.invalid_company_verification_document_front = await req.post()
      // req.uploads = {
      //   company_verification_document_front: TestStripeAccounts['success_id_scan_back.png'],
      // }
      // cachedResponses.invalid_company_verification_document_back = await req.post()
      cachedResponses.finished = true
    }
    it('reject invalid field business_profile_mcc', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.invalid_business_profile_mcc
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-business_profile_mcc')
    })
    it('reject invalid field business_profile_url', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.invalid_business_profile_url
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-business_profile_url')
    })
    it('reject invalid field individual_dob_day', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.invalid_individual_dob_day
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-individual_dob_day')
    })
    it('reject invalid field individual_dob_month', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.invalid_individual_dob_month
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-individual_dob_month')
    })
    it('reject invalid field individual_dob_year', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.invalid_individual_dob_year
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-individual_dob_year')
    })
    it('reject invalid field individual_id_number', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.invalid_individual_id_number
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-individual_id_number')
    })
    it('reject invalid field individual_phone', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.invalid_individual_phone
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-individual_phone')
    })
    it('reject invalid field individual_ssn_last_4', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.invalid_individual_ssn_last_4
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-individual_ssn_last_4')
    })
    it('reject invalid field individual_email', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.invalid_individual_email
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-individual_email')
    })
    it('reject invalid field individual_first_name', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.invalid_individual_first_name
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-individual_first_name')
    })
    it('reject invalid field individual_last_name', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.invalid_individual_last_name
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-individual_last_name')
    })
    it('reject invalid field individual_first_name_kana', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.invalid_individual_first_name_kana
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-individual_first_name_kana')
    })
    it('reject invalid field individual_last_name_kana', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.invalid_individual_last_name_kana
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-individual_last_name_kana')
    })
    it('reject invalid field individual_first_name_kanji', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.invalid_individual_first_name_kanji
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-individual_first_name_kanji')
    })
    it('reject invalid field individual_last_name_kanji', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.invalid_individual_last_name_kanji
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-individual_last_name_kanji')
    })
    it('reject invalid field individual_address_line1', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.invalid_individual_address_line1
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-individual_address_line1')
    })
    it('reject invalid field individual_address_city', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.invalid_individual_address_city
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-individual_address_city')
    })
    it('reject invalid field individual_address_state', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.invalid_individual_address_state
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-individual_address_state')
    })
    it('reject invalid field individual_address_postal_code', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.invalid_individual_address_postal_code
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-individual_address_postal_code')
    })
    it('reject invalid field individual_address_kana_line1', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.invalid_individual_address_kana_line1
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-individual_address_kana_line1')
    })
    it('reject invalid field individual_address_kana_town', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.invalid_individual_address_kana_town
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-individual_address_kana_town')
    })
    it('reject invalid field individual_address_kana_city', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.invalid_individual_address_kana_city
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-individual_address_kana_city')
    })
    it('reject invalid field individual_address_kana_state', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.invalid_individual_address_kana_state
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-individual_address_kana_state')
    })
    it('reject invalid field individual_address_kanji_line1', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.invalid_individual_address_kanji_line1
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-individual_address_kanji_line1')
    })
    it('reject invalid field individual_address_kanji_town', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.invalid_individual_address_kanji_town
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-individual_address_kanji_town')
    })
    it('reject invalid field individual_address_kanji_city', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.invalid_individual_address_kanji_city
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-individual_address_kanji_city')
    })
    it('reject invalid field individual_address_kanji_state', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.invalid_individual_address_kanji_state
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-individual_address_kanji_state')
    })
    // it('reject invalid field individual_verification_document_front', async () => {
    //   const result = cachedResponses.invalid_individual_verification_document_front
    //   const doc = TestHelper.extractDoc(result.html)
    //   const messageContainer = doc.getElementById('message-container')
    //   const message = messageContainer.child[0]
    //   assert.strictEqual(message.attr.template, 'invalid-individual_verification_document_front')
    // })
    // it('reject invalid field individual_verification_document_back', async () => {
    //   const result = cachedResponses.invalid_individual_verification_document_back
    //   const doc = TestHelper.extractDoc(result.html)
    //   const messageContainer = doc.getElementById('message-container')
    //   const message = messageContainer.child[0]
    //   assert.strictEqual(message.attr.template, 'invalid-individual_verification_document_back')
    // })
    it('reject invalid field company_name', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.invalid_company_name
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-company_name')
    })
    it('reject invalid field company_tax_id', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.invalid_company_tax_id
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-company_tax_id')
    })
    it('reject invalid field company_registration_number', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.invalid_company_registration_number
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-company_registration_number')
    })
    it('reject invalid field company_phone', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.invalid_company_phone
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-company_phone')
    })
    it('reject invalid field company_address_line1', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.invalid_company_address_line1
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-company_address_line1')
    })
    it('reject invalid field company_address_city', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.invalid_company_address_city
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-company_address_city')
    })
    it('reject invalid field company_address_state', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.invalid_company_address_state
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-company_address_state')
    })
    it('reject invalid field company_address_postal_code', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.invalid_company_address_postal_code
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-company_address_postal_code')
    })
    it('reject invalid field company_address_kana_line1', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.invalid_company_address_kana_line1
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-company_address_kana_line1')
    })
    it('reject invalid field company_address_kana_town', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.invalid_company_address_kana_town
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-company_address_kana_town')
    })
    it('reject invalid field company_address_kana_city', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.invalid_company_address_kana_city
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-company_address_kana_city')
    })
    it('reject invalid field company_address_kana_state', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.invalid_company_address_kana_state
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-company_address_kana_state')
    })
    it('reject invalid field company_address_kanji_line1', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.invalid_company_address_kanji_line1
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-company_address_kanji_line1')
    })
    it('reject invalid field company_address_kanji_town', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.invalid_company_address_kanji_town
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-company_address_kanji_town')
    })
    it('reject invalid field company_address_kanji_city', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.invalid_company_address_kanji_city
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-company_address_kanji_city')
    })
    it('reject invalid field company_address_kanji_state', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.invalid_company_address_kanji_state
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-company_address_kanji_state')
    })
    // it('reject invalid field company_verification_document_front', async () => {
    //   const result = cachedResponses.invalid_company_verification_document_front
    //   const doc = TestHelper.extractDoc(result.html)
    //   const messageContainer = doc.getElementById('message-container')
    //   const message = messageContainer.child[0]
    //   assert.strictEqual(message.attr.template, 'invalid-company_verification_document_front')
    // })
    // it('reject invalid field company_verification_document_back', async () => {
    //   const result = cachedResponses.invalid_company_verification_document_back
    //   const doc = TestHelper.extractDoc(result.html)
    //   const messageContainer = doc.getElementById('message-container')
    //   const message = messageContainer.child[0]
    //   assert.strictEqual(message.attr.template, 'invalid-company_verification_document_back')
    // })
  })
})
