const TestHelper = require('./test-helper.js')
const testData = require('./test-data.json')

module.exports = {
  createAccountData,
  createBankingData,
  createPersonData,
  createUploadData,
  createSubmittedIndividual: async (country, existingUser) => {
    country = country || 'US'
    global.webhooks = []
    const user = await module.exports.createIndividualReadyForSubmission(country, existingUser)
    await TestHelper.submitStripeAccount(user)
    await TestHelper.waitForPayoutsEnabled(user)
    return user
  },
  createSubmittedCompany: async (country, existingUser) => {
    country = country || 'US'
    const user = await module.exports.createCompanyReadyForSubmission(country, existingUser)
    await TestHelper.submitStripeAccount(user)
    await TestHelper.waitForPayoutsEnabled(user)
    return user
  },
  createIndividualReadyForSubmission: async (country, existingUser) => {
    country = country || 'US'
    const user = existingUser || await TestHelper.createUser()
    await TestHelper.createStripeAccount(user, {
      country: country,
      business_type: 'individual'
    })
    await TestHelper.waitForCurrentlyDueFields(user, 'individual.dob.day')
    const accountData = createAccountData(user.profile, country, user.stripeAccount.stripeObject)
    await TestHelper.updateStripeAccount(user, accountData)
    const bankingData = createBankingData(user.stripeAccount.stripeObject.business_type, user.profile, user.stripeAccount.stripeObject.country)
    await TestHelper.createExternalAccount(user, bankingData)
    if (country !== 'US') {
      await TestHelper.waitForCurrentlyDueFields(user, 'individual.verification.document')
      const uploadData = createUploadData(user.stripeAccount.stripeObject)
      await TestHelper.updateStripeAccount(user, {}, uploadData)
    }
    await TestHelper.waitForCurrentlyDueFields(user, false)
    return user
  },
  createCompanyReadyForSubmission: async (country, existingUser) => {
    country = country || 'US'
    const user = existingUser || await TestHelper.createUser()
    await TestHelper.createStripeAccount(user, {
      country: country,
      business_type: 'company'
    })
    const accountData = createAccountData(user.profile, country, user.stripeAccount.stripeObject)
    if (accountData) {
      await TestHelper.updateStripeAccount(user, accountData)
    }
    await TestHelper.createPerson(user, {
      'relationship_representative': 'true',
      'relationship_executive': 'true',
      'relationship_title': 'SVP Testing',
      'relationship_percent_ownership': '0'
    })
    await TestHelper.waitForPersonCurrentlyDueFields(user, 'representative', 'first_name')
    const representativeData = createPersonData(TestHelper.nextIdentity(), country, user.representative.stripeObject)
    await TestHelper.updatePerson(user, user.representative, representativeData)
    await TestHelper.waitForCurrentlyDueFieldsToLeave(user, `representative.`)
    await TestHelper.waitForCurrentlyDueFieldsToLeave(user, `${user.representative.personid}.`)
    // await TestHelper.waitForPersonCurrentlyDueFields(user, 'representative', 'verification_document')
    const representativeUploadData = createUploadData(user.representative.stripeObject)
    if (representativeUploadData) {
      await TestHelper.updatePerson(user, user.representative, {}, representativeUploadData)
      await TestHelper.waitForPersonCurrentlyDueFields(user, 'representative', false)
    }
    if (user.stripeAccount.requiresOwners) {
      await TestHelper.submitCompanyOwners(user)
      await TestHelper.waitForVerificationFieldsToLeave(user, 'relationship_owner')
    }
    if (user.stripeAccount.requiresDirectors) {
      await TestHelper.submitCompanyDirectors(user)
      await TestHelper.waitForVerificationFieldsToLeave(user, 'relationship_director')
    }
    if (user.stripeAccount.requiresExecutives) {
      await TestHelper.submitCompanyExecutives(user)
      await TestHelper.waitForVerificationFieldsToLeave(user, 'relationship_executive')
    }
    const bankingData = createBankingData(user.stripeAccount.stripeObject.business_type, user.profile, user.stripeAccount.stripeObject.country)
    if (bankingData) {
      await TestHelper.createExternalAccount(user, bankingData)
    }
    const uploadData = createUploadData(user.stripeAccount.stripeObject)
    if (uploadData && Object.keys(uploadData).length) {
      await TestHelper.updateStripeAccount(user, {}, uploadData)
    }
    await TestHelper.waitForCurrentlyDueFields(user, false)
    return user
  },
  createCompanyWithOwners: async (country, numOwners, existingUser) => {
    country = country || 'US'
    const user = existingUser || await TestHelper.createUser()
    await TestHelper.createStripeAccount(user, {
      country: country,
      business_type: 'company'
    })
    if (numOwners && user.stripeAccount.requiresOwners) {
      for (let i = 0, len = numOwners; i < len; i++) {
        await TestHelper.createPerson(user, {
          'relationship_owner': true,
          'relationship_title': 'Shareholder',
          'relationship_percent_ownership': (i + 1)
        })
      }
    }
    return user
  },
  createCompanyWithDirectors: async (country, numDirectors, existingUser) => {
    country = country || 'US'
    const user = existingUser || await TestHelper.createUser()
    await TestHelper.createStripeAccount(user, {
      country: country,
      business_type: 'company'
    })
    if (numDirectors && user.stripeAccount.requiresDirectors) {
      for (let i = 0, len = numDirectors; i < len; i++) {
        await TestHelper.createPerson(user, {
          'relationship_director': true,
          'relationship_title': 'Director',
          'relationship_percent_ownership': '0'
        })
      }
    }
    return user
  },
  createCompanyWithExecutives: async (country, numExecutives, existingUser) => {
    country = country || 'US'
    const user = existingUser || await TestHelper.createUser()
    await TestHelper.createStripeAccount(user, {
      country: country,
      business_type: 'company'
    })
    if (numExecutives && user.stripeAccount.requiresExecutives) {
      for (let i = 0, len = numExecutives; i < len; i++) {
        await TestHelper.createPerson(user, {
          'relationship_executive': true,
          'relationship_title': 'VP',
          'relationship_percent_ownership': '0'
        })
      }
    }
    return user
  },
  createCompanyWithRepresentative: async (country, existingUser) => {
    country = country || 'US'
    const user = existingUser || await TestHelper.createUser()
    await TestHelper.createStripeAccount(user, {
      country: country,
      business_type: 'company'
    })
    await TestHelper.createPerson(user, {
      'relationship_representative': 'true',
      'relationship_title': 'SVP Testing',
      'relationship_percent_ownership': 0
    })
    const representativeData = createPersonData(TestHelper.nextIdentity(), country, user.representative.stripeObject)
    const representativeUploadData = createUploadData(user.representative.stripeObject)
    await TestHelper.updatePerson(user, user.representative, representativeData, representativeUploadData)
    return user
  },
  createCompanyMissingRepresentative: async (country, existingUser) => {
    country = country || 'US'
    const user = existingUser || await TestHelper.createUser()
    await TestHelper.createStripeAccount(user, {
      country: country,
      business_type: 'company'
    })
    const accountData = createAccountData(user.profile, country, user.stripeAccount.stripeObject)
    await TestHelper.updateStripeAccount(user, accountData, createUploadData(user.stripeAccount.stripeObject))
    if (user.stripeAccount.requiresOwners) {
      await TestHelper.submitCompanyOwners(user)
    }
    if (user.stripeAccount.requiresDirectors) {
      await TestHelper.submitCompanyDirectors(user)
    }
    if (user.stripeAccount.requiresExecutives) {
      await TestHelper.submitCompanyExecutives(user)
    }
    const bankingData = createBankingData(user.stripeAccount.stripeObject.business_type, user.profile, user.stripeAccount.stripeObject.country)
    await TestHelper.createExternalAccount(user, bankingData)
    await TestHelper.updateStripeAccount(user, {}, createUploadData(user.stripeAccount.stripeObject))
    return user
  },
  createCompanyMissingPaymentDetails: async (country, existingUser) => {
    country = country || 'US'
    const user = existingUser || await TestHelper.createUser()
    await TestHelper.createStripeAccount(user, {
      country: country,
      business_type: 'company'
    })
    const accountData = createAccountData(user.profile, country, user.stripeAccount.stripeObject)
    await TestHelper.updateStripeAccount(user, accountData, createUploadData(user.stripeAccount.stripeObject))
    await TestHelper.createPerson(user, {
      'relationship_representative': 'true',
      'relationship_executive': 'true',
      'relationship_title': 'SVP Testing',
      'relationship_percent_ownership': 0
    })
    const representativeData = createPersonData(TestHelper.nextIdentity(), country, user.representative.stripeObject)
    await TestHelper.updatePerson(user, user.representative, representativeData)
    await TestHelper.waitForCurrentlyDueFieldsToLeave(user, `representative.first_name`)
    await TestHelper.waitForCurrentlyDueFieldsToLeave(user, `${user.representative.personid}.first_name`)
    const uploadData = createUploadData(user.stripeAccount.stripeObject)
    if (uploadData && Object.keys(uploadData).length) {
      await TestHelper.updatePerson(user, user.representative, {}, uploadData)
      await TestHelper.waitForCurrentlyDueFieldsToLeave(user, `representative.`)
      await TestHelper.waitForCurrentlyDueFieldsToLeave(user, `${user.representative.personid}.`)
    }
    if (user.stripeAccount.requiresOwners) {
      await TestHelper.submitCompanyOwners(user)
    }
    if (user.stripeAccount.requiresDirectors) {
      await TestHelper.submitCompanyDirectors(user)
    }
    if (user.stripeAccount.requiresExecutives) {
      await TestHelper.submitCompanyExecutives(user)
    }
    await TestHelper.updateStripeAccount(user, {}, createUploadData(user.stripeAccount.stripeObject))
    return user
  },
  createCompanyMissingOwners: async (country, existingUser) => {
    country = country || 'US'
    const user = existingUser || await TestHelper.createUser()
    await TestHelper.createStripeAccount(user, {
      country: country,
      business_type: 'company'
    })
    const bankingData = createBankingData(user.stripeAccount.stripeObject.business_type, user.profile, user.stripeAccount.stripeObject.country)
    await TestHelper.createExternalAccount(user, bankingData)
    const accountData = createAccountData(user.profile, country, user.stripeAccount.stripeObject)
    await TestHelper.updateStripeAccount(user, accountData, createUploadData(user.stripeAccount.stripeObject))
    await TestHelper.createPerson(user, {
      'relationship_representative': 'true',
      'relationship_executive': 'true',
      'relationship_title': 'SVP Testing',
      'relationship_percent_ownership': 0
    })
    const representativeData = createPersonData(TestHelper.nextIdentity(), country, user.representative.stripeObject)
    const representativeUploadData = createUploadData(user.representative.stripeObject)
    await TestHelper.updatePerson(user, user.representative, representativeData, representativeUploadData)
    if (user.stripeAccount.requiresDirectors) {
      await TestHelper.submitCompanyDirectors(user)
    }
    if (user.stripeAccount.requiresExecutives) {
      await TestHelper.submitCompanyExecutives(user)
    }
    await TestHelper.updateStripeAccount(user, {}, createUploadData(user.stripeAccount.stripeObject))
    return user
  },
  createCompanyMissingCompanyDetails: async (country, existingUser) => {
    country = country || 'US'
    const user = existingUser || await TestHelper.createUser()
    await TestHelper.createStripeAccount(user, {
      country: country,
      business_type: 'company'
    })
    const bankingData = createBankingData(user.stripeAccount.stripeObject.business_type, user.profile, user.stripeAccount.stripeObject.country)
    await TestHelper.createExternalAccount(user, bankingData)
    await TestHelper.createPerson(user, {
      'relationship_representative': 'true',
      'relationship_executive': 'true',
      'relationship_title': 'SVP Testing',
      'relationship_percent_ownership': 0
    })
    const representativeData = createPersonData(TestHelper.nextIdentity(), country, user.representative.stripeObject)
    const representativeUploadData = createUploadData(user.representative.stripeObject)
    await TestHelper.updatePerson(user, user.representative, representativeData, representativeUploadData)
    if (user.stripeAccount.requiresOwners) {
      await TestHelper.submitCompanyOwners(user)
    }
    if (user.stripeAccount.requiresDirectors) {
      await TestHelper.submitCompanyDirectors(user)
    }
    if (user.stripeAccount.requiresExecutives) {
      await TestHelper.submitCompanyExecutives(user)
    }
    return user
  },
  createCompanyMissingDirectors: async (country, existingUser) => {
    country = country || 'US'
    const user = existingUser || await TestHelper.createUser()
    await TestHelper.createStripeAccount(user, {
      country: country,
      business_type: 'company'
    })
    const bankingData = createBankingData(user.stripeAccount.stripeObject.business_type, user.profile, user.stripeAccount.stripeObject.country)
    await TestHelper.createExternalAccount(user, bankingData)
    const accountData = createAccountData(user.profile, country, user.stripeAccount.stripeObject)
    await TestHelper.updateStripeAccount(user, accountData, createUploadData(user.stripeAccount.stripeObject))
    await TestHelper.createPerson(user, {
      'relationship_representative': 'true',
      'relationship_executive': 'true',
      'relationship_title': 'SVP Testing',
      'relationship_percent_ownership': 0
    })
    const representativeData = createPersonData(TestHelper.nextIdentity(), country, user.representative.stripeObject)
    const representativeUploadData = createUploadData(user.representative.stripeObject)
    await TestHelper.updatePerson(user, user.representative, representativeData, representativeUploadData)
    if (user.stripeAccount.requiresOwners) {
      await TestHelper.submitCompanyOwners(user)
    }
    await TestHelper.updateStripeAccount(user, {}, createUploadData(user.stripeAccount.stripeObject))
    return user
  },
  createIndividualMissingPaymentDetails: async (country, existingUser) => {
    country = country || 'US'
    const user = existingUser || await TestHelper.createUser()
    await TestHelper.createStripeAccount(user, {
      country: country,
      business_type: 'individual'
    })
    const accountData = createAccountData(user.profile, country, user.stripeAccount.stripeObject)
    await TestHelper.updateStripeAccount(user, accountData, createUploadData(user.stripeAccount.stripeObject))
    return user
  },
  createIndividualMissingIndividualDetails: async (country, existingUser) => {
    country = country || 'US'
    const user = existingUser || await TestHelper.createUser()
    await TestHelper.createStripeAccount(user, {
      country: country,
      business_type: 'individual'
    })
    const bankingData = createBankingData(user.stripeAccount.stripeObject.business_type, user.profile, user.stripeAccount.stripeObject.country)
    await TestHelper.createExternalAccount(user, bankingData)
    return user
  }
}

function createUploadData (stripeAccountOrPerson) {
  const requirements = stripeAccountOrPerson.requirements.currently_due.concat(stripeAccountOrPerson.requirements.eventually_due)
  const payload = {}
  for (const field of requirements) {
    const pseudonym = field.split('.').join('_')
    switch (field) {
      case 'verification.document':
      case 'verification.additional_document':
      case 'individual.verification.document':
      case 'individual.verification.additional_document':
        payload[`${pseudonym}_front`] = TestHelper['success_id_scan_front.png']
        payload[`${pseudonym}_back`] = TestHelper['success_id_scan_back.png']
        continue
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
        payload[pseudonym] = prefilled[field] || testData.mcc[Math.floor(Math.random() * testData.mcc.length)].code
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
        payload[pseudonym] = prefilled[field] || identity.firstName
        continue
      case 'individual.last_name':
        payload[pseudonym] = prefilled[field] || identity.lastName
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
        payload[pseudonym] = prefilled[field] || '00000000000'
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
        payload[pseudonym] = prefilled[field] || identity.firstName
        continue
      case 'last_name':
        payload[pseudonym] = prefilled[field] || identity.lastName
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
        payload[pseudonym] = prefilled[field] || '00000000000'
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
  payload.account_holder_name = prefilled.account_holder_name || `${identity.firstName} ${identity.lastName}`
  payload.account_holder_type = prefilled.account_holder_type || type
  return payload
}
