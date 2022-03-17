/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')

describe('/account/connect/create-person', () => {
  describe('exceptions', () => {
    it('should reject invalid stripeid', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest('/account/connect/create-person?stripeid=invalid')
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

    it('should reject individual registration', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'US',
        business_type: 'individual'
      })
      const req = TestHelper.createRequest(`/account/connect/create-person?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      let errorMessage
      try {
        await req.route.api.before(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-stripe-account')
    })
  })

  describe('view', () => {
    it('should present the form', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'GB',
        business_type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/create-person?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      const result = await req.get()
      const doc = TestHelper.extractDoc(result.html)
      assert.strictEqual(doc.getElementById('submit-form').tag, 'form')
      assert.strictEqual(doc.getElementById('submit-button').tag, 'button')
    })

    // TODO: needs test for removing executive
    it('should remove director option', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'US',
        business_type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/create-person?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      const result = await req.get()
      const doc = TestHelper.extractDoc(result.html)
      const option = doc.getElementById('relationship_director')
      assert.strictEqual(option, undefined)
    })

    // TODO: needs country that doesn't require owner information
    // it('should remove owner option', async () => {
    //   const user = await TestHelper.createUser()
    //   await TestHelper.createStripeAccount(user, {
    //     country: 'HK',
    //     business_type: 'company'
    //   })
    //   const req = TestHelper.createRequest(`/account/connect/create-person?stripeid=${user.stripeAccount.stripeid}`)
    //   req.account = user.account
    //   req.session = user.session
    //   const result = await req.get()
    //   const doc = TestHelper.extractDoc(result.html)
    //   const option = doc.getElementById('.relationship_owner')
    //   assert.strictEqual(option, undefined)
    // })
  })

  describe('submit', () => {
    it('should create representative (screenshots)', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'AT',
        business_type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/create-person?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        relationship_representative: 'true',
        relationship_title: 'SVP Testing',
        relationship_percent_ownership: '10'
      }
      req.filename = __filename
      req.screenshots = [
        { hover: '#account-menu-container' },
        { click: '/account/connect' },
        { click: `/account/connect/stripe-account?stripeid=${user.stripeAccount.stripeid}` },
        { click: `/account/connect/persons?stripeid=${user.stripeAccount.stripeid}` },
        { click: `/account/connect/create-person?stripeid=${user.stripeAccount.stripeid}` },
        { fill: '#submit-form' }
      ]
      const result = await req.post()
      assert.strictEqual(result.redirect.startsWith('/account/connect/person?personid='), true)
    })

    it('should create director', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'BR',
        business_type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/create-person?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        relationship_director: 'true',
        relationship_title: 'Chairperson',
        relationship_percent_ownership: '0'
      }
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const personsTable = doc.getElementById('persons-table')
      assert.notStrictEqual(personsTable, undefined)
      assert.notStrictEqual(personsTable, null)
    })

    it('should create executive', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'BR',
        business_type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/create-person?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        relationship_executive: 'true',
        relationship_title: 'Chairperson',
        relationship_percent_ownership: '0'
      }
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const personsTable = doc.getElementById('persons-table')
      assert.notStrictEqual(personsTable, undefined)
      assert.notStrictEqual(personsTable, null)
    })

    it('should create owner', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'US',
        business_type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/create-person?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        relationship_owner: 'true',
        relationship_title: 'Shareholder',
        relationship_percent_ownership: '7'
      }
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const personsTable = doc.getElementById('persons-table')
      assert.notStrictEqual(personsTable, undefined)
      assert.notStrictEqual(personsTable, null)
    })
  })
})
