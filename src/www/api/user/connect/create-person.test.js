/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')

describe('/api/user/connect/create-person', () => {
  describe('exceptions', () => {
    describe('invalid-stripeid', () => {
      it('missing querystring stripeid', async () => {
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
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'US',
          business_type: 'individual'
        })
        const req = TestHelper.createRequest(`/api/user/connect/create-person?stripeid=${user.stripeAccount.stripeid}`)
        req.account = user.account
        req.session = user.session
        let errorMessage
        try {
          await req.post(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-stripe-account')
      })

      it('ineligible stripe account does not require directors', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'US',
          business_type: 'company'
        })
        const req = TestHelper.createRequest(`/api/user/connect/create-person?stripeid=${user.stripeAccount.stripeid}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          relationship_director: 'true',
          relationship_title: 'Chairperson',
          relationship_percent_ownership: '0.1'
        }
        let errorMessage
        try {
          await req.post(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-stripe-account')
      })

      it('ineligible stripe account does not require owners', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'CA',
          business_type: 'company'
        })
        const req = TestHelper.createRequest(`/api/user/connect/create-person?stripeid=${user.stripeAccount.stripeid}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          relationship_owner: 'true',
          relationship_title: 'Chairperson',
          relationship_percent_ownership: '0.1'
        }
        let errorMessage
        try {
          await req.post(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-stripe-account')
      })

      it('ineligible stripe account does not require executives', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'CA',
          business_type: 'company'
        })
        const req = TestHelper.createRequest(`/api/user/connect/create-person?stripeid=${user.stripeAccount.stripeid}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          relationship_executive: 'true',
          relationship_title: 'Chairperson',
          relationship_percent_ownership: '0.1'
        }
        let errorMessage
        try {
          await req.post(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-stripe-account')
      })
    })

    describe('invalid-account', () => {
      it('ineligible accessing account', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'US',
          business_type: 'company'
        })
        const user2 = await TestHelper.createUser()
        const req = TestHelper.createRequest(`/api/user/connect/create-person?stripeid=${user.stripeAccount.stripeid}`)
        req.account = user2.account
        req.session = user2.session
        let errorMessage
        try {
          await req.post(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-account')
      })
    })

    describe('invalid-relationship_percent_ownership', () => {
      it('missing posted relationship.percent_ownership', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'US',
          business_type: 'company'
        })
        const req = TestHelper.createRequest(`/api/user/connect/create-person?stripeid=${user.stripeAccount.stripeid}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          relationship_representative: 'true',
          relationship_executive: 'true',
          relationship_title: 'Chairperson',
          relationship_percent_ownership: ''
        }
        let errorMessage
        try {
          await req.post(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-relationship_percent_ownership')
      })

      it('invalid posted relationship.percent_ownership', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'US',
          business_type: 'company'
        })
        const req = TestHelper.createRequest(`/api/user/connect/create-person?stripeid=${user.stripeAccount.stripeid}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          relationship_representative: 'true',
          relationship_executive: 'true',
          relationship_title: 'Chairperson',
          relationship_percent_ownership: 'invalid'
        }
        let errorMessage
        try {
          await req.post(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-relationship_percent_ownership')
      })
    })

    describe('invalid-relationship_title', () => {
      it('missing posted relationship.title', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'US',
          business_type: 'company'
        })
        const req = TestHelper.createRequest(`/api/user/connect/create-person?stripeid=${user.stripeAccount.stripeid}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          relationship_representative: 'true',
          relationship_executive: 'true',
          relationship_title: '',
          relationship_percent_ownership: '0.1'
        }
        let errorMessage
        try {
          await req.post(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-relationship_title')
      })

      it('invalid posted relationship.title', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'US',
          business_type: 'company'
        })
        const req = TestHelper.createRequest(`/api/user/connect/create-person?stripeid=${user.stripeAccount.stripeid}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          relationship_representative: 'true',
          relationship_executive: 'true',
          relationship_title: '',
          relationship_percent_ownership: '0.1'
        }
        // TODO: the 5000 character limit is from Stripe
        // they'll probably change it so monitor this
        while (req.body.relationship_title.length < 5001) {
          req.body.relationship_title += '-'
        }
        let errorMessage
        try {
          await req.post(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-relationship_title')
      })
    })
  })

  describe('receives', () => {
    it('optional posted relationship.representative', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'US',
        business_type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/create-person?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        relationship_representative: 'true',
        relationship_title: 'Chairperson',
        relationship_percent_ownership: '0.1'
      }
      const person = await req.post()
      assert.strictEqual(person.stripeObject.relationship.representative, true)
    })

    it('optionally-required posted relationship.executive', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'FR',
        business_type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/create-person?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        relationship_executive: 'true',
        relationship_title: 'Chairperson',
        relationship_percent_ownership: '0.1'
      }
      const person = await req.post()
      assert.strictEqual(person.stripeObject.relationship.executive, true)
    })

    it('optional posted relationship.director', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'GB',
        business_type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/create-person?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        relationship_director: 'true',
        relationship_title: 'Chairperson',
        relationship_percent_ownership: '0.1'
      }
      const person = await req.post()
      assert.strictEqual(person.stripeObject.relationship.director, true)
    })

    it('optional posted relationship.owner', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'GB',
        business_type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/create-person?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        relationship_owner: 'true',
        relationship_title: 'Chairperson',
        relationship_percent_ownership: '0.1'
      }
      const person = await req.post()
      assert.strictEqual(person.stripeObject.relationship.owner, true)
    })

    it('required posted relationship.percent_ownership', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'GB',
        business_type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/create-person?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        relationship_director: 'true',
        relationship_title: 'Chairperson',
        relationship_percent_ownership: '0.1'
      }
      const person = await req.post()
      assert.strictEqual(person.stripeObject.relationship.percent_ownership, 0.1)
    })

    it('required posted relationship.title', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'GB',
        business_type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/create-person?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        relationship_director: 'true',
        relationship_title: 'Chairperson',
        relationship_percent_ownership: '0.1'
      }
      const person = await req.post()
      assert.strictEqual(person.stripeObject.relationship.title, 'Chairperson')
    })
  })

  describe('returns', () => {
    it('object', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: 'FR',
        business_type: 'company'
      })
      const req = TestHelper.createRequest(`/api/user/connect/create-person?stripeid=${user.stripeAccount.stripeid}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        relationship_representative: 'true',
        relationship_executive: 'true',
        relationship_title: 'Chairperson',
        relationship_percent_ownership: '0.1'
      }
      req.filename = __filename
      req.saveResponse = true
      const person = await req.post()
      assert.strictEqual(person.object, 'person')
    })
  })
})
