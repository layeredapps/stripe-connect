/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')
const DashboardTestHelper = require('@layeredapps/dashboard/test-helper.js')
const TestStripeAccounts = require('../../../../../test-stripe-accounts.js')

describe('/api/user/connect/delete-person', function () {
  before(TestHelper.disableMetrics)
  after(TestHelper.enableMetrics)
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
    const user = await TestStripeAccounts.createCompanyWithDirectors('DE', 1)
    const user2 = await TestHelper.createUser()
    // invalid account
    let req = TestHelper.createRequest(`/api/user/connect/delete-person?personid=${user.director.personid}`)
    req.account = user2.account
    req.session = user2.session
    try {
      await req.delete()
    } catch (error) {
      cachedResponses.invalidAccount = error.message
    }
    // cannot delete representative
    const representative = await TestHelper.createPerson(user, {
      relationship_representative: 'true',
      relationship_title: 'SVP Testing',
      relationship_percent_ownership: '10'
    })
    req = TestHelper.createRequest(`/api/user/connect/delete-person?personid=${representative.personid}`)
    req.account = user.account
    req.session = user.session
    try {
      await req.delete()
    } catch (error) {
      cachedResponses.invalidPerson = error.message
    }
    // deleted
    req = TestHelper.createRequest(`/api/user/connect/delete-person?personid=${user.director.personid}`)
    req.account = user.account
    req.session = user.session
    req.filename = __filename
    req.saveResponse = true
    cachedResponses.result = await req.delete()
    cachedResponses.finished = true
  }

  describe('exceptions', () => {
    describe('invalid-personid', () => {
      it('missing querystring personid', async function () {
        await bundledData(this.test.currentRetry())
        const user = await TestHelper.createUser()
        const req = TestHelper.createRequest('/api/user/connect/delete-person')
        req.account = user.account
        req.session = user.session
        let errorMessage
        try {
          await req.delete()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-personid')
      })

      it('invalid querystring personid', async function () {
        await bundledData(this.test.currentRetry())
        const user = await TestHelper.createUser()
        const req = TestHelper.createRequest('/api/user/connect/delete-person?personid=invalid')
        req.account = user.account
        req.session = user.session
        let errorMessage
        try {
          await req.delete()
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
      it('ineligible querystring person is representative', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.invalidPerson
        assert.strictEqual(errorMessage, 'invalid-person')
      })
    })
  })

  describe('returns', () => {
    it('boolean', async function () {
      await bundledData(this.test.currentRetry())
      const deleted = cachedResponses.result
      assert.strictEqual(deleted, true)
    })
  })
})
