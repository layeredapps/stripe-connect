/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')
const DashboardTestHelper = require('@layeredapps/dashboard/test-helper.js')

describe('/api/user/connect/create-person', () => {
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
      country: 'US',
      business_type: 'individual'
    })
    // individual account
    let req = TestHelper.createRequest(`/api/user/connect/create-person?stripeid=${user.stripeAccount.stripeid}`)
    req.account = user.account
    req.session = user.session
    try {
      await req.post(req)
    } catch (error) {
      cachedResponses.individualAccount = error.message
    }
    // does not require owner
    await TestHelper.createStripeAccount(user, {
      country: 'CA',
      business_type: 'company'
    })
    req = TestHelper.createRequest(`/api/user/connect/create-person?stripeid=${user.stripeAccount.stripeid}`)
    req.account = user.account
    req.session = user.session
    req.body = {
      relationship_owner: 'true',
      relationship_title: 'Chairperson',
      relationship_percent_ownership: '0.1'
    }
    try {
      await req.post(req)
    } catch (error) {
      cachedResponses.ownersNotRequired = error.message
    }
    // executives not required
    req.body = {
      relationship_executive: 'true',
      relationship_title: 'Chairperson',
      relationship_percent_ownership: '0.1'
    }
    try {
      await req.post(req)
    } catch (error) {
      cachedResponses.executivesNotRequired = error.message
    }
    // invalid account
    const user2 = await TestHelper.createUser()
    req = TestHelper.createRequest(`/api/user/connect/create-person?stripeid=${user.stripeAccount.stripeid}`)
    req.account = user2.account
    req.session = user2.session
    try {
      await req.post(req)
    } catch (error) {
      cachedResponses.invalidAccount = error.message
    }
    // does not require director
    await TestHelper.createStripeAccount(user, {
      country: 'US',
      business_type: 'company'
    })
    req = TestHelper.createRequest(`/api/user/connect/create-person?stripeid=${user.stripeAccount.stripeid}`)
    req.account = user.account
    req.session = user.session
    req.body = {
      relationship_director: 'true',
      relationship_title: 'Chairperson',
      relationship_percent_ownership: '0.1'
    }
    try {
      await req.post(req)
    } catch (error) {
      cachedResponses.directorsNotRequired = error.message
    }
    // missing percent owned
    await TestHelper.createStripeAccount(user, {
      country: 'AT',
      business_type: 'company'
    })
    req = TestHelper.createRequest(`/api/user/connect/create-person?stripeid=${user.stripeAccount.stripeid}`)
    req.account = user.account
    req.session = user.session
    req.body = {
      relationship_representative: 'true',
      relationship_executive: 'true',
      relationship_title: 'Chairperson',
      relationship_percent_ownership: ''
    }
    try {
      await req.post(req)
    } catch (error) {
      cachedResponses.missingPercentOwned = error.message
    }
    // invalid percent owned
    req.body = {
      relationship_representative: 'true',
      relationship_executive: 'true',
      relationship_title: 'Chairperson',
      relationship_percent_ownership: 'invalid'
    }
    try {
      await req.post(req)
    } catch (error) {
      cachedResponses.invalidPercentOwned = error.message
    }
    // missing relationship title
    req.body = {
      relationship_representative: 'true',
      relationship_executive: 'true',
      relationship_title: '',
      relationship_percent_ownership: '0.1'
    }
    try {
      await req.post(req)
    } catch (error) {
      cachedResponses.missingRelationshipTitle = error.message
    }
    // invalid relationship title
    while (req.body.relationship_title.length < 5001) {
      req.body.relationship_title += '-'
    }
    try {
      await req.post(req)
    } catch (error) {
      cachedResponses.invalidRelationshipTitle = error.message
    }
    // posted executive
    req.body = {
      relationship_representative: 'true',
      relationship_title: 'Chairperson',
      relationship_percent_ownership: '0.1'
    }
    cachedResponses.representative = await req.post()
    // posted executive
    req.body = {
      relationship_executive: 'true',
      relationship_title: 'Chairperson',
      relationship_percent_ownership: '0.1'
    }
    cachedResponses.executive = await req.post()
    // posted director
    req.body = {
      relationship_director: 'true',
      relationship_title: 'Chairperson',
      relationship_percent_ownership: '0.1'
    }
    cachedResponses.director = await req.post()
    // posted owner
    await TestHelper.createStripeAccount(user, {
      country: 'GB',
      business_type: 'company'
    })
    req = TestHelper.createRequest(`/api/user/connect/create-person?stripeid=${user.stripeAccount.stripeid}`)
    req.account = user.account
    req.session = user.session
    req.filename = __filename
    req.saveResponse = true
    req.body = {
      relationship_owner: 'true',
      relationship_title: 'Chairperson',
      relationship_percent_ownership: '0.1'
    }
    cachedResponses.owner = await req.post()
    cachedResponses.finished = true
  }

  describe('exceptions', () => {
    describe('invalid-stripeid', () => {
      it('missing querystring stripeid', async () => {
        await bundledData()
        const user = await TestHelper.createUser()
        const req = TestHelper.createRequest('/api/user/connect/create-person')
        req.account = user.account
        req.session = user.session
        let errorMessage
        try {
          await req.post(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-stripeid')
      })

      it('invalid querystring stripeid', async () => {
        await bundledData()
        const user = await TestHelper.createUser()
        const req = TestHelper.createRequest('/api/user/connect/create-person?stripeid=invalid')
        req.account = user.account
        req.session = user.session
        let errorMessage
        try {
          await req.post(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-stripeid')
      })
    })

    describe('invalid-stripe-account', () => {
      it('ineligible stripe account for individuals', async () => {
        await bundledData()
        const errorMessage = cachedResponses.individualAccount
        assert.strictEqual(errorMessage, 'invalid-stripe-account')
      })

      it('ineligible stripe account does not require directors', async () => {
        await bundledData()
        const errorMessage = cachedResponses.directorsNotRequired
        assert.strictEqual(errorMessage, 'invalid-stripe-account')
      })

      it('ineligible stripe account does not require owners', async () => {
        await bundledData()
        const errorMessage = cachedResponses.ownersNotRequired
        assert.strictEqual(errorMessage, 'invalid-stripe-account')
      })

      it('ineligible stripe account does not require executives', async () => {
        await bundledData()
        const errorMessage = cachedResponses.executivesNotRequired
        assert.strictEqual(errorMessage, 'invalid-stripe-account')
      })
    })

    describe('invalid-account', () => {
      it('ineligible accessing account', async () => {
        await bundledData()
        const errorMessage = cachedResponses.invalidAccount
        assert.strictEqual(errorMessage, 'invalid-account')
      })
    })

    describe('invalid-relationship_percent_ownership', () => {
      it('missing posted relationship.percent_ownership', async () => {
        await bundledData()
        const errorMessage = cachedResponses.missingPercentOwned
        assert.strictEqual(errorMessage, 'invalid-relationship_percent_ownership')
      })

      it('invalid posted relationship.percent_ownership', async () => {
        await bundledData()
        const errorMessage = cachedResponses.invalidPercentOwned
        assert.strictEqual(errorMessage, 'invalid-relationship_percent_ownership')
      })
    })

    describe('invalid-relationship_title', () => {
      it('missing posted relationship.title', async () => {
        await bundledData()
        const errorMessage = cachedResponses.missingRelationshipTitle
        assert.strictEqual(errorMessage, 'invalid-relationship_title')
      })

      it('invalid posted relationship_title', async () => {
        await bundledData()
        const errorMessage = cachedResponses.invalidRelationshipTitle
        assert.strictEqual(errorMessage, 'invalid-relationship_title')
      })
    })
  })

  describe('receives', () => {
    it('optional posted relationship_representative', async () => {
      await bundledData()
      const person = cachedResponses.representative
      assert.strictEqual(person.stripeObject.relationship.representative, true)
    })

    it('optionally-required posted relationship_executive', async () => {
      await bundledData()
      const person = cachedResponses.executive
      assert.strictEqual(person.stripeObject.relationship.executive, true)
    })

    it('optional posted relationship_director', async () => {
      await bundledData()
      const person = cachedResponses.director
      assert.strictEqual(person.stripeObject.relationship.director, true)
    })

    it('optional posted relationship_owner', async () => {
      await bundledData()
      const person = cachedResponses.owner
      assert.strictEqual(person.stripeObject.relationship.owner, true)
    })

    it('required posted relationship_percent_ownership', async () => {
      await bundledData()
      const person = cachedResponses.owner
      assert.strictEqual(person.stripeObject.relationship.percent_ownership, 0.1)
    })

    it('required posted relationship_title', async () => {
      const person = cachedResponses.owner
      await bundledData()
      assert.strictEqual(person.stripeObject.relationship.title, 'Chairperson')
    })
  })

  describe('returns', () => {
    it('object', async () => {
      await bundledData()
      const person = cachedResponses.owner
      assert.strictEqual(person.object, 'person')
    })
  })
})
