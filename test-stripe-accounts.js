const Log = require('@layeredapps/dashboard/src/log.js')('stripe-connect')
const path = require('path')
const TestHelper = require('./test-helper.js')
const testData = require('./test-data.json')
const util = require('util')

async function waitForPersonField (user, personType, field) {
  Log.info('wait for person field', field, user[personType].personid)
  const person = user[personType].stripeObject
  const stripeAccount = user.stripeAccount.stripeObject
  const personRequirements = person.requirements.currently_due.concat(person.requirements.eventually_due)
  if (personRequirements.indexOf(field) === -1) {
    await waitForWebhook('person.updated', (stripeEvent) => {
      if (stripeEvent.data.object.id !== person.id) {
        return false
      }
      const personRequirements = stripeEvent.data.object.requirements.currently_due.concat(stripeEvent.data.object.requirements.eventually_due)
      if (field === false) {
        if (!personRequirements.length) {
          return true
        }
        let invalid = false
        for (const field of personRequirements) {
          if (field.startsWith('tos_acceptance')) {
            continue
          }
          invalid = true
          break
        }
        return !invalid
      }
      return personRequirements.indexOf(field) > -1
    })
  }
  Log.info('wait for account to sync field', field, user[personType].personid)
  const accountRequirements = stripeAccount.requirements.currently_due.concat(stripeAccount.requirements.eventually_due)
  if (accountRequirements.indexOf(`${person.id}.${field}`) === -1) {
    await waitForWebhook('account.updated', (stripeEvent) => {
      if (stripeEvent.data.object.id !== stripeAccount.id) {
        return false
      }
      const accountRequirements = stripeEvent.data.object.requirements.currently_due.concat(stripeEvent.data.object.requirements.eventually_due)
      if (field === false) {
        if (!accountRequirements.length) {
          return true
        }
        let invalid = false
        for (const field of accountRequirements) {
          if (field.startsWith('tos_acceptance')) {
            continue
          }
          invalid = true
          break
        }
        return !invalid
      }
      return accountRequirements.indexOf(`${person.id}.${field}`) > -1
    })
  }
  user[personType] = await global.api.administrator.connect.Person.get({
    query: {
      personid: person.id
    }
  })
  user.stripeAccount = await global.api.administrator.connect.StripeAccount.get({
    query: {
      stripeid: stripeAccount.id
    }
  })
}

async function waitForPersonFieldToLeave (user, personType, field) {
  Log.info('wait for person field to leave', field)
  const person = user[personType].stripeObject
  const stripeAccount = user.stripeAccount.stripeObject
  const personRequirements = person.requirements.currently_due.concat(person.requirements.eventually_due)
  if (personRequirements.indexOf(field) > -1) {
    await waitForWebhook('person.updated', (stripeEvent) => {
      if (stripeEvent.data.object.id !== person.id) {
        return false
      }
      const personRequirements = stripeEvent.data.object.requirements.currently_due.concat(stripeEvent.data.object.requirements.eventually_due)
      return personRequirements.indexOf(field) === -1
    })
  }
  const accountRequirements = stripeAccount.requirements.currently_due.concat(stripeAccount.requirements.eventually_due)
  if (accountRequirements.indexOf(`${person.id}.${field}`) > -1) {
    await waitForWebhook('account.updated', (stripeEvent) => {
      if (stripeEvent.data.object.id !== stripeAccount.id) {
        return false
      }
      const accountRequirements = stripeEvent.data.object.requirements.currently_due.concat(stripeEvent.data.object.requirements.eventually_due)
      return accountRequirements.indexOf(`${person.id}.${field}`) === -1
    })
  }
  user[personType] = await global.api.administrator.connect.Person.get({
    query: {
      personid: person.id
    }
  })
  user.stripeAccount = await global.api.administrator.connect.StripeAccount.get({
    query: {
      stripeid: stripeAccount.id
    }
  })
}

async function waitForAccountField (user, field) {
  Log.info('wait for account field', field)
  const stripeAccount = user.stripeAccount.stripeObject
  const accountRequirements = stripeAccount.requirements.currently_due.concat(stripeAccount.requirements.eventually_due)
  if (accountRequirements.indexOf(field) === -1) {
    await waitForWebhook('account.updated', (stripeEvent) => {
      if (stripeEvent.data.object.id !== stripeAccount.id) {
        return false
      }
      const accountRequirements = stripeEvent.data.object.requirements.currently_due.concat(stripeEvent.data.object.requirements.eventually_due)
      if (field === false) {
        if (!accountRequirements.length) {
          return true
        }
        let invalid = false
        for (const field of accountRequirements) {
          if (field.startsWith('tos_acceptance')) {
            continue
          }
          invalid = true
          break
        }
        return !invalid
      }
      return accountRequirements.indexOf(field) > -1
    })
  }
  user.stripeAccount = await global.api.administrator.connect.StripeAccount.get({
    query: {
      stripeid: stripeAccount.id
    }
  })
}

async function waitForAccountFieldToLeave (user, field) {
  Log.info('wait for account field to leave', field)
  const stripeAccount = user.stripeAccount.stripeObject
  const accountRequirements = stripeAccount.requirements.currently_due.concat(stripeAccount.requirements.eventually_due)
  if (accountRequirements.indexOf(field) > -1) {
    await waitForWebhook('account.updated', (stripeEvent) => {
      if (stripeEvent.data.object.id !== stripeAccount.id) {
        return false
      }
      const accountRequirements = stripeEvent.data.object.requirements.currently_due.concat(stripeEvent.data.object.requirements.eventually_due)
      return accountRequirements.indexOf(field) === -1
    })
  }
  user.stripeAccount = await global.api.administrator.connect.StripeAccount.get({
    query: {
      stripeid: stripeAccount.id
    }
  })
}

const waitForWebhook = util.promisify((webhookType, matching, callback) => {
  Log.info('waitForWebhook', webhookType)
  async function wait () {
    if (global.testEnded) {
      return
    }
    if (!global.webhooks || !global.webhooks.length) {
      return setTimeout(wait, 1000)
    }
    for (const received of global.webhooks) {
      if (received.type !== webhookType) {
        continue
      }
      if (matching(received)) {
        return callback()
      }
    }
    return setTimeout(wait, 1000)
  }
  return setTimeout(wait, 1000)
})

const TestStripeAccounts = module.exports = {
  'success_id_scan_front.png': {
    filename: 'id_scan_front.png',
    name: 'id_scan_front.png',
    path: path.join(__dirname, '/test-documentid-success.png')
  },
  'fail_id_scan_front.png': {
    filename: 'id_scan_front.png',
    name: 'id_scan_front.png',
    path: path.join(__dirname, '/test-documentid-failed.png')
  },
  'success_id_scan_back.png': {
    filename: 'id_scan_back.png',
    name: 'id_scan_back.png',
    path: path.join(__dirname, '/test-documentid-success.png')
  },
  'fail_id_scan_back.png': {
    filename: 'id_scan_back.png',
    name: 'id_scan_back.png',
    path: path.join(__dirname, '/test-documentid-failed.png')
  },
  waitForAccountField,
  waitForAccountFieldToLeave,
  waitForPersonField,
  waitForPersonFieldToLeave,
  waitForWebhook,
  createAccountData,
  createAccountUploadData,
  createBankingData,
  createPersonData,
  createPersonUploadData,
  createSubmittedIndividual: async (country, existingUser) => {
    country = country || 'US'
    const user = await TestStripeAccounts.createIndividualReadyForSubmission(country, existingUser)
    await TestHelper.submitStripeAccount(user)
    await waitForWebhook('account.updated', (stripeEvent) => {
      return stripeEvent.data.object.id === user.stripeAccount.stripeid &&
             stripeEvent.data.object.payouts_enabled === true
    })
    await TestHelper.rotateWebhook(true)
    return user
  },
  createSubmittedCompany: async (country, existingUser) => {
    country = country || 'US'
    const user = await TestStripeAccounts.createCompanyReadyForSubmission(country, existingUser)
    await TestHelper.submitStripeAccount(user)
    await waitForWebhook('account.updated', (stripeEvent) => {
      return stripeEvent.data.object.id === user.stripeAccount.stripeid &&
             stripeEvent.data.object.payouts_enabled === true
    })
    await TestHelper.rotateWebhook(true)
    return user
  },
  createIndividualReadyForSubmission: async (country, existingUser) => {
    country = country || 'US'
    const user = existingUser || await TestHelper.createUser()
    await TestHelper.createStripeAccount(user, {
      country,
      business_type: 'individual'
    })
    await waitForAccountField(user, 'individual.dob.day')
    const accountData = createAccountData(user.profile, country, user.stripeAccount.stripeObject)
    await TestHelper.updateStripeAccount(user, accountData)
    await waitForAccountFieldToLeave(user, 'individual.dob.day')
    await waitForAccountField(user, 'external_account')
    const bankingData = createBankingData(user.stripeAccount.stripeObject.business_type, user.profile, user.stripeAccount.stripeObject.country)
    await TestHelper.createExternalAccount(user, bankingData)
    await waitForAccountFieldToLeave(user, 'external_account')
    if (country !== 'US') {
      await waitForAccountField(user, 'individual.verification.document')
      const uploadData = createAccountUploadData(user.stripeAccount.stripeObject)
      await TestHelper.updateStripeAccount(user, {}, uploadData)
      await waitForAccountFieldToLeave(user, 'individual.verification.document')
    }
    await waitForAccountField(user, false)
    await TestHelper.rotateWebhook(true)
    return user
  },
  createCompanyReadyForSubmission: async (country, existingUser) => {
    country = country || 'US'
    const user = existingUser || await TestHelper.createUser()
    await TestHelper.createStripeAccount(user, {
      country,
      business_type: 'company'
    })
    const accountData = createAccountData(user.profile, country, user.stripeAccount.stripeObject)
    if (accountData) {
      await TestHelper.updateStripeAccount(user, accountData)
    }
    await TestHelper.createPerson(user, {
      relationship_representative: 'true',
      relationship_executive: user.stripeAccount.requiresExecutives ? 'true' : undefined,
      relationship_title: 'SVP Testing',
      relationship_percent_ownership: '0'
    })
    await waitForWebhook('person.created', (stripeEvent) => {
      return stripeEvent.data.object.id === user.representative.personid
    })
    await waitForPersonField(user, 'representative', 'first_name')
    const representativeData = createPersonData(TestHelper.nextIdentity(), country, user.representative.stripeObject)
    await TestHelper.updatePerson(user, user.representative, representativeData)
    await waitForPersonField(user, 'representative', 'verification.document')
    const uploadData = createPersonUploadData(user.representative.stripeObject)
    if (uploadData && Object.keys(uploadData).length) {
      await TestHelper.updatePerson(user, user.representative, {}, uploadData)
      await waitForPersonFieldToLeave(user, 'representative', 'verification.document')
    }
    if (user.stripeAccount.requiresOwners) {
      await waitForAccountField(user, 'company.owners_provided')
      await TestHelper.submitCompanyOwners(user)
      await waitForAccountFieldToLeave(user, 'company.owners_provided')
    }
    if (user.stripeAccount.requiresDirectors) {
      await waitForAccountField(user, 'company.directors_provided')
      await TestHelper.submitCompanyDirectors(user)
      await waitForAccountFieldToLeave(user, 'company.directors_provided')
    }
    if (user.stripeAccount.requiresExecutives) {
      await waitForAccountField(user, 'company.executives_provided')
      await TestHelper.submitCompanyExecutives(user)
      await waitForAccountFieldToLeave(user, 'company.executives_provided')
    }
    const bankingData = createBankingData(user.stripeAccount.stripeObject.business_type, user.profile, user.stripeAccount.stripeObject.country)
    if (bankingData) {
      await TestHelper.createExternalAccount(user, bankingData)
      await waitForAccountFieldToLeave(user, 'external_account')
    }
    const companyUploadFiles = createAccountUploadData(user.stripeAccount.stripeObject)
    if (companyUploadFiles && Object.keys(companyUploadFiles).length) {
      await TestHelper.updateStripeAccount(user, {}, companyUploadFiles)
      await waitForAccountFieldToLeave(user, 'company.verification.document')
    }
    await waitForAccountField(user, false)
    await TestHelper.rotateWebhook(true)
    return user
  },
  createCompanyWithOwners: async (country, numOwners, existingUser) => {
    country = country || 'US'
    const user = existingUser || await TestHelper.createUser()
    await TestHelper.createStripeAccount(user, {
      country,
      business_type: 'company'
    })
    if (numOwners && user.stripeAccount.requiresOwners) {
      for (let i = 0, len = numOwners; i < len; i++) {
        await TestHelper.createPerson(user, {
          relationship_owner: true,
          relationship_title: 'Shareholder',
          relationship_percent_ownership: (i + 1)
        })
      }
    }
    return user
  },
  createCompanyWithDirectors: async (country, numDirectors, existingUser) => {
    country = country || 'US'
    const user = existingUser || await TestHelper.createUser()
    await TestHelper.createStripeAccount(user, {
      country,
      business_type: 'company'
    })
    if (numDirectors && user.stripeAccount.requiresDirectors) {
      for (let i = 0, len = numDirectors; i < len; i++) {
        await TestHelper.createPerson(user, {
          relationship_director: true,
          relationship_title: 'Director',
          relationship_percent_ownership: '0'
        })
      }
    }
    return user
  },
  createCompanyWithExecutives: async (country, numExecutives, existingUser) => {
    country = country || 'US'
    const user = existingUser || await TestHelper.createUser()
    await TestHelper.createStripeAccount(user, {
      country,
      business_type: 'company'
    })
    if (numExecutives && user.stripeAccount.requiresExecutives) {
      for (let i = 0, len = numExecutives; i < len; i++) {
        await TestHelper.createPerson(user, {
          relationship_executive: 'true',
          relationship_title: 'VP',
          relationship_percent_ownership: '0'
        })
      }
    }
    return user
  },
  createCompanyWithRepresentative: async (country, existingUser) => {
    country = country || 'US'
    const user = existingUser || await TestHelper.createUser()
    await TestHelper.createStripeAccount(user, {
      country,
      business_type: 'company'
    })
    user.representative = await TestHelper.createPerson(user, {
      relationship_representative: 'true',
      relationship_executive: user.stripeAccount.requiresExecutives ? 'true' : undefined,
      relationship_title: 'SVP Testing',
      relationship_percent_ownership: 0
    })
    const firstNameField = country === 'JP' ? 'first_name_kana' : 'first_name'
    await waitForPersonField(user, 'representative', firstNameField)
    const representativeData = createPersonData(TestHelper.nextIdentity(), country, user.representative.stripeObject)
    await TestHelper.updatePerson(user, user.representative, representativeData)
    await waitForPersonFieldToLeave(user, 'representative', firstNameField)
    await waitForPersonField(user, 'representative', 'verification.document')
    const uploadData = createPersonUploadData(user.representative.stripeObject)
    if (uploadData && Object.keys(uploadData).length) {
      await TestHelper.updatePerson(user, user.representative, {}, uploadData)
      await waitForPersonFieldToLeave(user, 'representative', 'verification.document')
    }
    await TestHelper.rotateWebhook(true)
    return user
  },
  createCompanyMissingRepresentative: async (country, existingUser) => {
    country = country || 'US'
    const user = existingUser || await TestHelper.createUser()
    await TestHelper.createStripeAccount(user, {
      country,
      business_type: 'company'
    })
    if (user.stripeAccount.requiresOwners) {
      await waitForAccountField(user, 'company.owners_provided')
      await TestHelper.submitCompanyOwners(user)
      await waitForAccountFieldToLeave(user, 'company.owners_provided')
    }
    if (user.stripeAccount.requiresDirectors) {
      await waitForAccountField(user, 'company.directors_provided')
      await TestHelper.submitCompanyDirectors(user)
      await waitForAccountFieldToLeave(user, 'company.directors_provided')
    }
    if (user.stripeAccount.requiresExecutives) {
      await waitForAccountField(user, 'company.executives_provided')
      await TestHelper.submitCompanyExecutives(user)
      await waitForAccountFieldToLeave(user, 'company.executives_provided')
    }
    const bankingData = createBankingData(user.stripeAccount.stripeObject.business_type, user.profile, user.stripeAccount.stripeObject.country)
    if (bankingData) {
      await TestHelper.createExternalAccount(user, bankingData)
      await waitForAccountFieldToLeave(user, 'external_account')
    }
    const companyUploadFiles = createAccountUploadData(user.stripeAccount.stripeObject)
    if (companyUploadFiles && Object.keys(companyUploadFiles).length) {
      await TestHelper.updateStripeAccount(user, {}, companyUploadFiles)
      await waitForAccountFieldToLeave(user, 'company.verification.document')
    }
    await TestHelper.rotateWebhook(true)
    return user
  },
  createCompanyMissingPaymentDetails: async (country, existingUser) => {
    country = country || 'US'
    const user = existingUser || await TestHelper.createUser()
    await TestHelper.createStripeAccount(user, {
      country,
      business_type: 'company'
    })
    const accountData = createAccountData(user.profile, country, user.stripeAccount.stripeObject)
    await TestHelper.updateStripeAccount(user, accountData)
    await TestHelper.createPerson(user, {
      relationship_representative: 'true',
      relationship_executive: user.stripeAccount.requiresExecutives ? 'true' : undefined,
      relationship_title: 'SVP Testing',
      relationship_percent_ownership: 0
    })
    await waitForWebhook('person.created', (stripeEvent) => {
      return stripeEvent.data.object.id === user.representative.personid
    })
    await waitForPersonField(user, 'representative', 'first_name')
    const representativeData = createPersonData(TestHelper.nextIdentity(), country, user.representative.stripeObject)
    await TestHelper.updatePerson(user, user.representative, representativeData)
    if (country !== 'US') {
      await waitForPersonField(user, 'representative', 'verification.document')
      const uploadData = createPersonUploadData(user.representative.stripeObject)
      if (uploadData && Object.keys(uploadData).length) {
        await TestHelper.updatePerson(user, user.representative, {}, uploadData)
        await waitForPersonFieldToLeave(user, 'representative', 'verification.document')
      }
    }
    if (user.stripeAccount.requiresOwners) {
      await waitForAccountField(user, 'company.owners_provided')
      await TestHelper.submitCompanyOwners(user)
      await waitForAccountFieldToLeave(user, 'company.owners_provided')
    }
    if (user.stripeAccount.requiresDirectors) {
      await waitForAccountField(user, 'company.directors_provided')
      await TestHelper.submitCompanyDirectors(user)
      await waitForAccountFieldToLeave(user, 'company.directors_provided')
    }
    if (user.stripeAccount.requiresExecutives) {
      await waitForAccountField(user, 'company.executives_provided')
      await TestHelper.submitCompanyExecutives(user)
      await waitForAccountFieldToLeave(user, 'company.executives_provided')
    }
    const companyUploadFiles = createAccountUploadData(user.stripeAccount.stripeObject)
    if (companyUploadFiles && Object.keys(companyUploadFiles).length) {
      await TestHelper.updateStripeAccount(user, {}, companyUploadFiles)
      await waitForAccountFieldToLeave(user, 'company.verification.document')
    }
    await TestHelper.rotateWebhook(true)
    return user
  },
  createCompanyMissingOwners: async (country, existingUser) => {
    country = country || 'US'
    const user = existingUser || await TestHelper.createUser()
    await TestHelper.createStripeAccount(user, {
      country,
      business_type: 'company'
    })
    const accountData = createAccountData(user.profile, country, user.stripeAccount.stripeObject)
    if (accountData) {
      await TestHelper.updateStripeAccount(user, accountData)
    }
    await TestHelper.createPerson(user, {
      relationship_representative: 'true',
      relationship_executive: user.stripeAccount.requiresExecutives ? 'true' : undefined,
      relationship_title: 'SVP Testing',
      relationship_percent_ownership: '0'
    })
    await waitForWebhook('person.created', (stripeEvent) => {
      return stripeEvent.data.object.id === user.representative.personid
    })
    await waitForPersonField(user, 'representative', 'first_name')
    const representativeData = createPersonData(TestHelper.nextIdentity(), country, user.representative.stripeObject)
    await TestHelper.updatePerson(user, user.representative, representativeData)
    await waitForPersonField(user, 'representative', 'verification.document')
    const uploadData = createPersonUploadData(user.representative.stripeObject)
    if (uploadData && Object.keys(uploadData).length) {
      await TestHelper.updatePerson(user, user.representative, {}, uploadData)
      await waitForPersonFieldToLeave(user, 'representative', 'verification.document')
    }
    if (user.stripeAccount.requiresDirectors) {
      await waitForAccountField(user, 'company.directors_provided')
      await TestHelper.submitCompanyDirectors(user)
      await waitForAccountFieldToLeave(user, 'company.directors_provided')
    }
    if (user.stripeAccount.requiresExecutives) {
      await waitForAccountField(user, 'company.executives_provided')
      await TestHelper.submitCompanyExecutives(user)
      await waitForAccountFieldToLeave(user, 'company.executives_provided')
    }
    const bankingData = createBankingData(user.stripeAccount.stripeObject.business_type, user.profile, user.stripeAccount.stripeObject.country)
    if (bankingData) {
      await TestHelper.createExternalAccount(user, bankingData)
      await waitForAccountFieldToLeave(user, 'external_account')
    }
    const companyUploadFiles = createAccountUploadData(user.stripeAccount.stripeObject)
    if (companyUploadFiles && Object.keys(companyUploadFiles).length) {
      await TestHelper.updateStripeAccount(user, {}, companyUploadFiles)
      await waitForAccountFieldToLeave(user, 'company.verification.document')
    }
    await TestHelper.rotateWebhook(true)
    return user
  },
  createCompanyMissingCompanyDetails: async (country, existingUser) => {
    country = country || 'US'
    const user = existingUser || await TestHelper.createUser()
    await TestHelper.createStripeAccount(user, {
      country,
      business_type: 'company'
    })
    await TestHelper.createPerson(user, {
      relationship_representative: 'true',
      relationship_executive: user.stripeAccount.requiresExecutives ? 'true' : undefined,
      relationship_title: 'SVP Testing',
      relationship_percent_ownership: '0'
    })
    await waitForWebhook('person.created', (stripeEvent) => {
      return stripeEvent.data.object.id === user.representative.personid
    })
    await waitForPersonField(user, 'representative', 'first_name')
    const representativeData = createPersonData(TestHelper.nextIdentity(), country, user.representative.stripeObject)
    await TestHelper.updatePerson(user, user.representative, representativeData)
    await waitForPersonField(user, 'representative', 'verification.document')
    const uploadData = createPersonUploadData(user.representative.stripeObject)
    if (uploadData && Object.keys(uploadData).length) {
      await TestHelper.updatePerson(user, user.representative, {}, uploadData)
      await waitForPersonFieldToLeave(user, 'representative', 'verification.document')
    }
    if (user.stripeAccount.requiresOwners) {
      await waitForAccountField(user, 'company.owners_provided')
      await TestHelper.submitCompanyOwners(user)
      await waitForAccountFieldToLeave(user, 'company.owners_provided')
    }
    if (user.stripeAccount.requiresDirectors) {
      await waitForAccountField(user, 'company.directors_provided')
      await TestHelper.submitCompanyDirectors(user)
      await waitForAccountFieldToLeave(user, 'company.directors_provided')
    }
    if (user.stripeAccount.requiresExecutives) {
      await waitForAccountField(user, 'company.executives_provided')
      await TestHelper.submitCompanyExecutives(user)
      await waitForAccountFieldToLeave(user, 'company.executives_provided')
    }
    const bankingData = createBankingData(user.stripeAccount.stripeObject.business_type, user.profile, user.stripeAccount.stripeObject.country)
    if (bankingData) {
      await TestHelper.createExternalAccount(user, bankingData)
      await waitForAccountFieldToLeave(user, 'external_account')
    }
    const companyUploadFiles = createAccountUploadData(user.stripeAccount.stripeObject)
    if (companyUploadFiles && Object.keys(companyUploadFiles).length) {
      await TestHelper.updateStripeAccount(user, {}, companyUploadFiles)
      await waitForAccountFieldToLeave(user, 'company.verification.document')
    }
    await TestHelper.rotateWebhook(true)
    return user
  },
  createCompanyMissingDirectors: async (country, existingUser) => {
    country = country || 'US'
    const user = existingUser || await TestHelper.createUser()
    await TestHelper.createStripeAccount(user, {
      country,
      business_type: 'company'
    })
    const accountData = createAccountData(user.profile, country, user.stripeAccount.stripeObject)
    if (accountData) {
      await TestHelper.updateStripeAccount(user, accountData)
    }
    await TestHelper.createPerson(user, {
      relationship_representative: 'true',
      relationship_executive: user.stripeAccount.requiresExecutives ? 'true' : undefined,
      relationship_title: 'SVP Testing',
      relationship_percent_ownership: '0'
    })
    await waitForWebhook('person.created', (stripeEvent) => {
      return stripeEvent.data.object.id === user.representative.personid
    })
    await waitForPersonField(user, 'representative', 'first_name')
    const representativeData = createPersonData(TestHelper.nextIdentity(), country, user.representative.stripeObject)
    await TestHelper.updatePerson(user, user.representative, representativeData)
    await waitForPersonField(user, 'representative', 'verification.document')
    const uploadData = createPersonUploadData(user.representative.stripeObject)
    if (uploadData && Object.keys(uploadData).length) {
      await TestHelper.updatePerson(user, user.representative, {}, uploadData)
      await waitForPersonFieldToLeave(user, 'representative', 'verification.document')
    }
    if (user.stripeAccount.requiresOwners) {
      await waitForAccountField(user, 'company.owners_provided')
      await TestHelper.submitCompanyOwners(user)
      await waitForAccountFieldToLeave(user, 'company.owners_provided')
    }
    if (user.stripeAccount.requiresExecutives) {
      await waitForAccountField(user, 'company.executives_provided')
      await TestHelper.submitCompanyExecutives(user)
      await waitForAccountFieldToLeave(user, 'company.executives_provided')
    }
    const bankingData = createBankingData(user.stripeAccount.stripeObject.business_type, user.profile, user.stripeAccount.stripeObject.country)
    if (bankingData) {
      await TestHelper.createExternalAccount(user, bankingData)
      await waitForAccountFieldToLeave(user, 'external_account')
    }
    const companyUploadFiles = createAccountUploadData(user.stripeAccount.stripeObject)
    if (companyUploadFiles && Object.keys(companyUploadFiles).length) {
      await TestHelper.updateStripeAccount(user, {}, companyUploadFiles)
      await waitForAccountFieldToLeave(user, 'company.verification.document')
    }
    await TestHelper.rotateWebhook(true)
    return user
  },
  createIndividualMissingPaymentDetails: async (country, existingUser) => {
    country = country || 'US'
    const user = existingUser || await TestHelper.createUser()
    await TestHelper.createStripeAccount(user, {
      country,
      business_type: 'individual'
    })
    const accountData = createAccountData(user.profile, country, user.stripeAccount.stripeObject)
    await TestHelper.updateStripeAccount(user, accountData, createAccountUploadData(user.stripeAccount.stripeObject))
    return user
  },
  createIndividualMissingIndividualDetails: async (country, existingUser) => {
    country = country || 'US'
    const user = existingUser || await TestHelper.createUser()
    await TestHelper.createStripeAccount(user, {
      country,
      business_type: 'individual'
    })
    const bankingData = createBankingData(user.stripeAccount.stripeObject.business_type, user.profile, user.stripeAccount.stripeObject.country)
    await TestHelper.createExternalAccount(user, bankingData)
    return user
  }
}

function createAccountUploadData (stripeAccountOrPerson) {
  const requirements = stripeAccountOrPerson.requirements.currently_due.concat(stripeAccountOrPerson.requirements.eventually_due)
  const payload = {}
  for (const field of requirements) {
    const pseudonym = field.split('.').join('_')
    switch (field) {
      case 'individual.verification.document':
      case 'individual.verification.additional_document':
      case 'company.verification.document':
        payload[`${pseudonym}_front`] = TestStripeAccounts['success_id_scan_front.png']
        payload[`${pseudonym}_back`] = TestStripeAccounts['success_id_scan_back.png']
        continue
    }
  }
  if (Object.keys(payload).length) {
    return payload
  }
}

function createPersonUploadData (stripeAccountOrPerson, person) {
  const requirements = stripeAccountOrPerson.requirements.currently_due.concat(stripeAccountOrPerson.requirements.eventually_due)
  const payload = {}
  for (const field of requirements) {
    if (field.startsWith('person_')) {
      const trimmed = field.substring(field.indexOf('.') + 1)
      const pseudonym = trimmed.split('.').join('_')
      switch (trimmed) {
        case 'verification.document':
        case 'verification.additional_document':
          payload[`${pseudonym}_front`] = TestStripeAccounts['success_id_scan_front.png']
          payload[`${pseudonym}_back`] = TestStripeAccounts['success_id_scan_back.png']
          continue
      }
    }
    const pseudonym = field.split('.').join('_')
    switch (field) {
      case 'verification.document':
      case 'verification.additional_document':
        payload[`${pseudonym}_front`] = TestStripeAccounts['success_id_scan_front.png']
        payload[`${pseudonym}_back`] = TestStripeAccounts['success_id_scan_back.png']
        continue
    }
  }
  if (person) {
    const requirements2 = person.requirements.currently_due.concat(person.requirements.eventually_due)
    for (const field of requirements2) {
      const pseudonym = field.split('.').join('_')
      switch (field) {
        case 'verification.document':
        case 'verification.additional_document':
          payload[`${pseudonym}_front`] = TestStripeAccounts['success_id_scan_front.png']
          payload[`${pseudonym}_back`] = TestStripeAccounts['success_id_scan_back.png']
          continue
      }
    }
  }
  if (Object.keys(payload).length) {
    return payload
  }
}

function createAccountData (identity, country, stripeAccount, prefilled) {
  const requirements = stripeAccount.requirements.currently_due.concat(stripeAccount.requirements.eventually_due)
  const payload = {}
  prefilled = prefilled || {}
  for (const field of requirements) {
    const pseudonym = field.split('.').join('_')
    if (field.startsWith('individual.address.') || field.startsWith('company.address.')) {
      const suffix = field.split('.').pop()
      payload[pseudonym] = prefilled[field] || testData.addresses[country][suffix]
      continue
    }
    if (field.startsWith('individual.address_kana.') || field.startsWith('company.address_kana.')) {
      const suffix = field.split('.').pop()
      payload[pseudonym] = prefilled[field] || testData.addresses[country][`kana_${suffix}`]
      continue
    }
    if (field.startsWith('individual.address_kanji.') || field.startsWith('company.address_kanji.')) {
      const suffix = field.split('.').pop()
      payload[pseudonym] = prefilled[field] || testData.addresses[country][`kanji_${suffix}`]
      continue
    }
    switch (field) {
      case 'business_profile.mcc':
        payload[pseudonym] = prefilled[field] || testData.mcc[Math.floor(Math.random() * testData.mcc.length)].code.toString()
        continue
      case 'business_profile.product_description':
        payload[pseudonym] = prefilled[field] || 'test product description'
        continue
      case 'business_profile.support_phone':
        payload[pseudonym] = prefilled[field] || testData.phone[country]
        continue
      case 'business_profile.url':
        payload[pseudonym] = prefilled[field] || 'https://www.an-example-website.com'
        continue
      case 'individual.dob.day':
      case 'individual.dob.month':
        payload[pseudonym] = prefilled[field] || '1'
        continue
      case 'individual.dob.year':
        payload[pseudonym] = prefilled[field] || '1970'
        continue
      case 'individual.phone':
        payload[pseudonym] = prefilled[field] || testData.phone[country] || '4567890123'
        continue
      case 'individual.first_name':
        payload[pseudonym] = prefilled[field] || identity.firstName || identity.fullName.split(' ')[0]
        continue
      case 'individual.last_name':
        payload[pseudonym] = prefilled[field] || identity.lastName || identity.fullName.split(' ')[1]
        continue
      case 'individual.first_name_kana':
        payload[pseudonym] = prefilled[field] || 'ﾄｳｷﾖｳﾄ'
        continue
      case 'individual.last_name_kana':
        payload[pseudonym] = prefilled[field] || 'ﾄｳｷﾖｳﾄ'
        continue
      case 'individual.first_name_kanji':
        payload[pseudonym] = prefilled[field] || '東京都'
        continue
      case 'individual.last_name_kanji':
        payload[pseudonym] = prefilled[field] || '東京都'
        continue
      case 'individual.email':
        payload[pseudonym] = prefilled[field] || identity.contactEmail || identity.email
        continue
      case 'individual.gender':
        payload[pseudonym] = prefilled[field] || Math.random() < 0.5 ? 'male' : 'female'
        continue
      case 'individual.maiden_name':
        payload[pseudonym] = prefilled[field] || identity.lastName
        continue
      case 'individual.nationality':
        payload[pseudonym] = prefilled[field] || identity.nationality || 'BR'
        continue
      case 'individual.ssn_last_4':
        payload[pseudonym] = prefilled[field] || '0000'
        continue
      case 'individual.full_name_aliases':
        // TODO: required by SG, unsure if requires value
        continue
      case 'individual.id_number':
        if (country === 'HK') {
          payload[pseudonym] = prefilled[field] || 'AA000000A'
        } else {
          payload[pseudonym] = prefilled[field] || '00000000000'
        }
        continue
      case 'individual.political_exposure':
        payload[pseudonym] = prefilled[field] || 'existing'
        continue
      case 'company.phone':
        payload[pseudonym] = prefilled[field] || testData.phone[stripeAccount.country] || '4567890123'
        continue
      case 'company.name':
        payload[pseudonym] = prefilled[field] || 'Test Company Name'
        continue
      case 'company.name_kana':
        payload[pseudonym] = prefilled[field] || 'ﾄｳｷﾖｳﾄ'
        continue
      case 'company.name_kanji':
        payload[pseudonym] = prefilled[field] || '東京都'
        continue
      case 'company.structure':
        // TODO: not sure if need to test different values it seems this
        // affects required fields but it should work
        // https://stripe.com/docs/connect/identity-verification#business-structure
        payload[pseudonym] = prefilled[field] || 'public_corporation'
        continue
      case 'company.tax_id':
        if (stripeAccount.country === 'BR') {
          payload[pseudonym] = prefilled[field] || '00000000000000'
        } else if (stripeAccount.country === 'DE') {
          payload[pseudonym] = prefilled[field] || 'HRB 1234'
        } else {
          payload[pseudonym] = prefilled[field] || '00000000000'
        }
        continue
      case 'company.business_vat_id_number':
        payload[pseudonym] = prefilled[field] || '00000000000'
        continue
      case 'company.registration_number':
        payload[pseudonym] = prefilled[field] || '00000000000'
        continue
    }
  }
  if (Object.keys(payload).length) {
    return payload
  }
}

function createPersonData (identity, country, person, prefilled) {
  const requirements = person.requirements.currently_due.concat(person.requirements.eventually_due)
  const payload = {}
  prefilled = prefilled || {}
  for (const field of requirements) {
    const pseudonym = field.split('.').join('_')
    if (field.startsWith('address.')) {
      const suffix = field.split('.').pop()
      payload[pseudonym] = prefilled[field] || testData.addresses[country][suffix]
      continue
    }
    if (field.startsWith('address_kana.')) {
      const suffix = field.split('.').pop()
      payload[pseudonym] = prefilled[field] || testData.addresses[country][`kana_${suffix}`]
      continue
    }
    if (field.startsWith('address_kanji.')) {
      const suffix = field.split('.').pop()
      payload[pseudonym] = prefilled[field] || testData.addresses[country][`kanji_${suffix}`]
      continue
    }
    switch (field) {
      case 'dob.day':
      case 'dob.month':
        payload[pseudonym] = prefilled[field] || '1'
        continue
      case 'dob.year':
        payload[pseudonym] = prefilled[field] || '1970'
        continue
      case 'relationship_title':
        payload[pseudonym] = prefilled[field] || 'Job Title'
        continue
      case 'relationship_percent_ownership':
        payload[pseudonym] = prefilled[field] || '10'
        continue
      case 'phone':
        payload[pseudonym] = prefilled[field] || testData.phone[country] || '4567890123'
        continue
      case 'first_name':
        payload[pseudonym] = prefilled[field] || identity.firstName || identity.fullName.split(' ')[0]
        continue
      case 'last_name':
        payload[pseudonym] = prefilled[field] || identity.lastName || identity.fullName.split(' ')[1]
        continue
      case 'email':
        payload[pseudonym] = prefilled[field] || identity.contactEmail || identity.email
        continue
      case 'gender':
        payload[pseudonym] = prefilled[field] || Math.random() < 0.5 ? 'male' : 'female'
        continue
      case 'maiden_name':
        payload[pseudonym] = prefilled[field] || identity.lastName
        continue
      case 'nationality':
        continue
      case 'ssn_last_4':
        payload[pseudonym] = prefilled[field] || '0000'
        continue
      case 'full_name_aliases':
        // TODO: required by SG, unsure if requires value
        continue
      case 'id_number':
        if (country === 'HK') {
          payload[pseudonym] = prefilled[field] || 'AA000000A'
        } else {
          payload[pseudonym] = prefilled[field] || '00000000000'
        }
        continue
      case 'political_exposure':
        payload[pseudonym] = prefilled[field] || 'existing'
        continue
    }
  }
  if (Object.keys(payload).length) {
    return payload
  }
}

function createBankingData (type, identity, country, prefilled, arrayIndex) {
  prefilled = prefilled || {}
  const payload = {
    country
  }
  if (testData.banking[country].length) {
    arrayIndex = arrayIndex || 0
    for (const field in testData.banking[country][arrayIndex]) {
      const pseudonym = field.split('.').join('_')
      payload[pseudonym] = prefilled[field] || testData.banking[country][arrayIndex][field]
    }
  } else {
    for (const field in testData.banking[country]) {
      const pseudonym = field.split('.').join('_')
      payload[pseudonym] = prefilled[field] || testData.banking[country][field]
    }
  }
  payload.account_holder_name = prefilled.account_holder_name || identity.firstName ? `${identity.firstName} ${identity.lastName}` : identity.fullName
  payload.account_holder_type = prefilled.account_holder_type || type
  return payload
}
