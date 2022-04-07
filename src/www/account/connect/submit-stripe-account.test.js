/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')
const DashboardTestHelper = require('@layeredapps/dashboard/test-helper.js')
const TestStripeAccounts = require('../../../../test-stripe-accounts')

describe('/account/connect/submit-stripe-account', function () {
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
    // individual account
    const user = await TestHelper.createUser()
    await TestHelper.createStripeAccount(user, {
      country: 'NZ',
      business_type: 'individual'
    })
    let req = TestHelper.createRequest(`/account/connect/submit-stripe-account?stripeid=${user.stripeAccount.stripeid}`)
    req.account = user.account
    req.session = user.session
    // 1) missing payment information
    cachedResponses.missingIndividualPayment = await req.get()
    const individualBankingData = TestStripeAccounts.createBankingData(user.stripeAccount.stripeObject.business_type, user.profile, user.stripeAccount.stripeObject.country)
    await TestHelper.createExternalAccount(user, individualBankingData)
    await TestStripeAccounts.waitForAccountFieldToLeave(user, 'external_account')
    // 2) missing information
    cachedResponses.missingIndividualInformation = await req.get()
    const individualAccountData = TestStripeAccounts.createAccountData(user.profile, user.stripeAccount.stripeObject.country, user.stripeAccount.stripeObject)
    await TestHelper.updateStripeAccount(user, individualAccountData)
    // 3) ready to submit
    cachedResponses.individualForm = await req.get()
    // 4) submitted
    cachedResponses.individualSubmit = await req.post()
    // company account
    await TestHelper.createStripeAccount(user, {
      country: 'DE',
      business_type: 'company'
    })
    // 1) missing representative
    req = TestHelper.createRequest(`/account/connect/submit-stripe-account?stripeid=${user.stripeAccount.stripeid}`)
    req.account = user.account
    req.session = user.session
    cachedResponses.missingRepresentative = await req.get()
    await TestHelper.createPerson(user, {
      relationship_representative: 'true',
      relationship_executive: user.stripeAccount.requiresExecutives ? 'true' : undefined,
      relationship_title: 'SVP Testing',
      relationship_percent_ownership: 0
    })
    await TestStripeAccounts.waitForWebhook('person.created', (stripeEvent) => {
      return stripeEvent.data.object.id === user.representative.personid
    })
    await TestStripeAccounts.waitForPersonField(user, 'representative', 'first_name')
    const representativeData = TestStripeAccounts.createPersonData(TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country, user.representative.stripeObject)
    await TestHelper.updatePerson(user, user.representative, representativeData)
    await TestStripeAccounts.waitForPersonField(user, 'representative', 'verification.document')
    const representativeUploadData = TestStripeAccounts.createPersonUploadData(user.representative.stripeObject)
    if (representativeUploadData && Object.keys(representativeUploadData).length) {
      await TestHelper.updatePerson(user, user.representative, {}, representativeUploadData)
      await TestStripeAccounts.waitForPersonFieldToLeave(user, 'representative', 'verification.document')
    }
    // 2) missing owner submission
    cachedResponses.missingOwners = await req.get()
    // 3) missing owner information
    await TestHelper.createPerson(user, {
      relationship_owner: 'true',
      relationship_executive: user.stripeAccount.requiresExecutives ? 'true' : undefined,
      relationship_title: 'SVP Testing',
      relationship_percent_ownership: '9'
    })
    cachedResponses.missingOwnerInformation = await req.get()
    const ownerData = TestStripeAccounts.createPersonData(TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country, user.owner.stripeObject)
    await TestHelper.updatePerson(user, user.owner, ownerData)
    await TestStripeAccounts.waitForPersonField(user, 'owner', 'verification.document')
    const ownerUploadData = TestStripeAccounts.createPersonUploadData(user.owner.stripeObject)
    if (ownerUploadData && Object.keys(ownerUploadData).length) {
      await TestHelper.updatePerson(user, user.owner, {}, ownerUploadData)
      await TestStripeAccounts.waitForPersonFieldToLeave(user, 'owner', 'verification.document')
    }
    await TestHelper.submitCompanyOwners(user)
    // 4) missing director submission
    cachedResponses.missingDirectors = await req.get()
    // 5) missing director information
    await TestStripeAccounts.waitForAccountField(user, 'company.directors_provided')
    await TestHelper.createPerson(user, {
      relationship_director: 'true',
      relationship_executive: user.stripeAccount.requiresExecutives ? 'true' : undefined,
      relationship_title: 'SVP Testing',
      relationship_percent_ownership: 0
    })
    cachedResponses.missingDirectorInformation = await req.get()
    const directorData = TestStripeAccounts.createPersonData(TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country, user.director.stripeObject)
    await TestHelper.updatePerson(user, user.director, directorData)
    await TestStripeAccounts.waitForPersonField(user, 'director', 'verification.document')
    const directorUploadData = TestStripeAccounts.createPersonUploadData(user.director.stripeObject)
    if (directorUploadData && Object.keys(directorUploadData).length) {
      await TestHelper.updatePerson(user, user.director, {}, directorUploadData)
      await TestStripeAccounts.waitForPersonFieldToLeave(user, 'director', 'verification.document')
    }
    await TestStripeAccounts.waitForAccountField(user, 'company.directors_provided')
    await TestHelper.submitCompanyDirectors(user)
    await TestStripeAccounts.waitForAccountFieldToLeave(user, 'company.directors_provided')
    // 6) missing executive submission
    cachedResponses.missingExecutives = await req.get()
    // 7) missing executive information
    await TestStripeAccounts.waitForAccountField(user, 'company.directors_provided')
    await TestHelper.createPerson(user, {
      relationship_executive: user.stripeAccount.requiresExecutives ? 'true' : undefined,
      relationship_title: 'SVP Testing',
      relationship_percent_ownership: 0
    })
    cachedResponses.missingExecutiveInformation = await req.get()
    const executiveData = TestStripeAccounts.createPersonData(TestHelper.nextIdentity(), user.stripeAccount.stripeObject.country, user.executive.stripeObject)
    await TestHelper.updatePerson(user, user.executive, executiveData)
    await TestStripeAccounts.waitForPersonField(user, 'executive', 'verification.document')
    const executiveUploadData = TestStripeAccounts.createPersonUploadData(user.executive.stripeObject)
    if (executiveUploadData && Object.keys(executiveUploadData).length) {
      await TestHelper.updatePerson(user, user.executive, {}, executiveUploadData)
      await TestStripeAccounts.waitForPersonFieldToLeave(user, 'executive', 'verification.document')
    }
    await TestStripeAccounts.waitForAccountField(user, 'company.executives_provided')
    await TestHelper.submitCompanyExecutives(user)
    await TestStripeAccounts.waitForAccountFieldToLeave(user, 'company.executives_provided')
    // 5) missing payment information
    cachedResponses.missingCompanyPayment = await req.get()
    const companyBankingData = TestStripeAccounts.createBankingData(user.stripeAccount.stripeObject.business_type, user.profile, user.stripeAccount.stripeObject.country)
    await TestHelper.createExternalAccount(user, companyBankingData)
    await TestStripeAccounts.waitForAccountFieldToLeave(user, 'external_account')
    // 6) missing information
    cachedResponses.missingCompanyInformation = await req.get()
    const companyAccountData = TestStripeAccounts.createAccountData(user.profile, user.stripeAccount.stripeObject.country, user.stripeAccount.stripeObject)
    await TestHelper.updateStripeAccount(user, companyAccountData)
    // 7) ready to submit
    await req.route.api.before(req)
    cachedResponses.before = req.data
    cachedResponses.companyForm = await req.get()
    // 8) submitted
    req.filename = __filename
    req.screenshots = [
      { hover: '#account-menu-container' },
      { click: '/account/connect' },
      { click: `/account/connect/stripe-account?stripeid=${user.stripeAccount.stripeid}` },
      { click: `/account/connect/submit-stripe-account?stripeid=${user.stripeAccount.stripeid}` },
      { fill: '#submit-form' }
    ]
    cachedResponses.companySubmit = await req.post()
    cachedResponses.finished = true
  }

  describe('exceptions', () => {
    it('should reject invalid stripeid', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest('/account/connect/submit-stripe-account?stripeid=invalid')
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

  describe('before', () => {
    it('should bind data to req', async function () {
      await bundledData(this.test.currentRetry())
      const data = cachedResponses.before
      assert.strictEqual(data.stripeAccount.object, 'account')
    })
  })

  describe('view', () => {
    it('should reject individual that hasn\'t submitted payment details', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.missingIndividualPayment
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-payment-details')
    })

    it('should reject company that hasn\'t submitted payment details', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.missingCompanyPayment
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-payment-details')
    })

    it('should reject company that has missing owner information', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.missingOwnerInformation
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-company-owners')
    })

    it('should reject company that hasn\'t submitted owners', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.missingOwners
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-company-owners')
    })

    it('should reject company that has missing director information', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.missingDirectorInformation
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-company-directors')
    })

    it('should reject company that hasn\'t submitted directors', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.missingDirectors
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-company-directors')
    })

    it('should reject company that has missing executive information', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.missingExecutiveInformation
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-company-executives')
    })

    it('should reject company that hasn\'t submitted executives', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.missingExecutives
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-company-executives')
    })

    it('should reject company that hasn\'t submitted information', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.missingCompanyInformation
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-registration')
    })

    it('should reject individual that hasn\'t submitted information', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.missingIndividualInformation
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-registration')
    })

    it('should present the form (individual)', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.individualForm
      const doc = TestHelper.extractDoc(result.html)
      assert.strictEqual(doc.getElementById('submit-form').tag, 'form')
      assert.strictEqual(doc.getElementById('submit-button').tag, 'button')
    })

    it('should present the form (company)', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.companyForm
      const doc = TestHelper.extractDoc(result.html)
      assert.strictEqual(doc.getElementById('submit-form').tag, 'form')
      assert.strictEqual(doc.getElementById('submit-button').tag, 'button')
    })
  })

  describe('submit', () => {
    it('should submit registration (company) (screenshots)', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.companySubmit
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })

    it('should submit registration (individual)', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.individualSubmit
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })
  })
})
