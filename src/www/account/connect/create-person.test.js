/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')
const DashboardTestHelper = require('@layeredapps/dashboard/test-helper.js')

describe('/account/connect/create-person', function () {
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
    // no director
    await TestHelper.createStripeAccount(user, {
      country: 'US',
      business_type: 'company'
    })
    let req = TestHelper.createRequest(`/account/connect/create-person?stripeid=${user.stripeAccount.stripeid}`)
    req.account = user.account
    req.session = user.session
    cachedResponses.viewNoDirector = await req.get()
    // view
    await TestHelper.createStripeAccount(user, {
      country: 'GB',
      business_type: 'company'
    })
    req = TestHelper.createRequest(`/account/connect/create-person?stripeid=${user.stripeAccount.stripeid}`)
    req.account = user.account
    req.session = user.session
    cachedResponses.view = await req.get()
    // submit
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
    global.pageSize = 50
    cachedResponses.submit = cachedResponses.createRepresentative = await req.post()
    // create director
    delete (req.screenshots)
    req.body = {
      relationship_director: 'true',
      relationship_title: 'SVP Testing',
      relationship_percent_ownership: '10'
    }
    cachedResponses.createDirector = await req.post()
    // create executive
    req.body = {
      relationship_executive: 'true',
      relationship_title: 'SVP Testing',
      relationship_percent_ownership: '10'
    }
    cachedResponses.createExecutive = await req.post()
    // create owner
    req.body = {
      relationship_owner: 'true',
      relationship_title: 'SVP Testing',
      relationship_percent_ownership: '10'
    }
    cachedResponses.createOwner = await req.post()
    // xss
    req.body = {
      relationship_owner: 'true',
      relationship_title: '<script>',
      relationship_percent_ownership: '10'
    }
    cachedResponses.xss = await req.post()
    // csrf
    req.puppeteer = false
    req.body = {
      relationship_owner: 'true',
      relationship_title: 'SVP Testing',
      relationship_percent_ownership: '10',
      'csrf-token': ''
    }
    cachedResponses.csrf = await req.post()
    cachedResponses.finished = true
  }

  describe('view', () => {
    it('should present the form', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.view
      const doc = TestHelper.extractDoc(result.html)
      assert.strictEqual(doc.getElementById('submit-form').tag, 'form')
      assert.strictEqual(doc.getElementById('submit-button').tag, 'button')
    })

    // TODO: needs test for removing executive
    it('should remove director option', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.viewNoDirector
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
    it('should create representative (screenshots)', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.submit
      assert.strictEqual(result.redirect.startsWith('/account/connect/person?personid='), true)
    })

    it('should create director', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.createDirector
      const doc = TestHelper.extractDoc(result.html)
      const personsTable = doc.getElementById('persons-table')
      assert.notStrictEqual(personsTable, undefined)
      assert.notStrictEqual(personsTable, null)
    })

    it('should create representative', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.createRepresentative
      const doc = TestHelper.extractDoc(result.html)
      const personsTable = doc.getElementById('persons-table')
      assert.notStrictEqual(personsTable, undefined)
      assert.notStrictEqual(personsTable, null)
    })

    it('should create executive', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.createExecutive
      const doc = TestHelper.extractDoc(result.html)
      const personsTable = doc.getElementById('persons-table')
      assert.notStrictEqual(personsTable, undefined)
      assert.notStrictEqual(personsTable, null)
    })

    it('should create owner', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.createOwner
      const doc = TestHelper.extractDoc(result.html)
      const personsTable = doc.getElementById('persons-table')
      assert.notStrictEqual(personsTable, undefined)
      assert.notStrictEqual(personsTable, null)
    })
  })

  describe('errors', () => {
    it('invalid-stripeid', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest('/account/connect/create-person?stripeid=invalid')
      req.account = user.account
      req.session = user.session
      await req.route.api.before(req)
      assert.strictEqual(req.error, 'invalid-stripeid')
    })

    it('invalid-stripe-account', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'US',
        business_type: 'individual'
      })
      const req = TestHelper.createRequest(`/account/connect/create-person?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      await req.route.api.before(req)
      assert.strictEqual(req.error, 'invalid-stripe-account')
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
