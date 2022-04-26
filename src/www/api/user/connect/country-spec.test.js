/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')

describe('/api/user/connect/country-spec', function () {
  before(TestHelper.disableMetrics)
  after(TestHelper.enableMetrics)
  describe('exceptions', () => {
    it('missing querystring countryid', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest('/api/user/connect/country-spec')
      req.account = user.account
      req.session = user.session
      let errorMessage
      try {
        await req.get()
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-countryid')
    })

    it('invalid querystring countryid', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest('/api/user/connect/country-spec?countryid=invalid')
      req.account = user.account
      req.session = user.session
      let errorMessage
      try {
        await req.get()
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-countryid')
    })
  })

  describe('returns', () => {
    it('object', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest('/api/user/connect/country-spec?countryid=US')
      req.account = user.account
      req.session = user.session
      req.filename = __filename
      req.saveResponse = true
      const countrySpec = await req.get()
      assert.strictEqual(countrySpec.countryid, 'US')
    })
  })
})
