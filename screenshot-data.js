const { faker } = require('@faker-js/faker')
const DashboardScreenshots = require('@layeredapps/dashboard/screenshot-data.js')
const mergeStripeObject = require('./src/stripe-object')
const merchantCategoryCodes = require('./merchant-category-codes.json')

const stripeAccountQuantities = []
for (let i = 0; i < 365; i++) {
  if (i === 0) {
    stripeAccountQuantities[i] = Math.ceil(Math.random() * 100)
  } else {
    stripeAccountQuantities[i] = Math.ceil(stripeAccountQuantities[i - 1] * (0.85 + (Math.random() * 0.25)))
  }
}

const payoutQuantities = []
for (let i = 0; i < 365; i++) {
  payoutQuantities[i] = Math.floor((0.5 + Math.random()) * stripeAccountQuantities[i] / 10)
}

const administratorIndex = {
  before: async (req) => {
    if (req.urlPath !== '/administrator/connect') {
      return
    }
    const route = req.route
    const oldAPI = req.route.api
    req.route = {}
    for (const key in route) {
      req.route[key] = route[key]
    }
    req.route.api = {
      before: oldAPI.before,
      get: oldAPI.get,
      post: oldAPI.post,
      patch: oldAPI.patch,
      put: oldAPI.put,
      delete: oldAPI.delete
    }
    req.route.api.before = async (req) => {
      await oldAPI.before(req)
      DashboardScreenshots.addMetrics(req.data.createdChartDays, 90, stripeAccountQuantities)
      DashboardScreenshots.addMetrics(req.data.payoutsChartDays, 90, payoutQuantities)
      DashboardScreenshots.adjustNormalize(req.data.createdChartDays)
      DashboardScreenshots.adjustNormalize(req.data.payoutsChartDays)
      DashboardScreenshots.adjustHighlight(stripeAccountQuantities, req.data.createdChartHighlights)
      DashboardScreenshots.adjustHighlight(payoutQuantities, req.data.payoutsChartHighlights)
      DashboardScreenshots.adjustValues(req.data.createdChartDays, req.data.createdChartValues)
      DashboardScreenshots.adjustValues(req.data.payoutsChartDays, req.data.payoutsChartValues)
    }
  }
}

const administratorStripeAccounts = {
  before: async (req) => {
    if (req.urlPath !== '/administrator/connect/stripe-accounts' || global.pageSize !== 50) {
      return
    }
    const route = req.route
    const oldAPI = req.route.api
    req.route = {}
    for (const key in route) {
      req.route[key] = route[key]
    }
    req.route.api = {
      before: oldAPI.before,
      get: oldAPI.get,
      post: oldAPI.post,
      patch: oldAPI.patch,
      put: oldAPI.put,
      delete: oldAPI.delete
    }
    req.route.api.before = async (req) => {
      await oldAPI.before(req)
      DashboardScreenshots.addMetrics(req.data.createdChartDays, 365, stripeAccountQuantities)
      DashboardScreenshots.adjustNormalize(req.data.createdChartDays)
      DashboardScreenshots.adjustHighlight(stripeAccountQuantities, req.data.createdChartHighlights)
      DashboardScreenshots.adjustValues(req.data.createdChartDays, req.data.createdChartValues)
      addStripeAccountObjects(req.data.stripeAccounts, global.pageSize - req.data.stripeAccounts.length)
      req.data.total = req.data.createdChartHighlights.total
    }
  }
}

const administratorPayouts = {
  before: async (req) => {
    if (req.urlPath !== '/administrator/connect/payouts' || global.pageSize !== 50) {
      return
    }
    const route = req.route
    const oldAPI = req.route.api
    req.route = {}
    for (const key in route) {
      req.route[key] = route[key]
    }
    req.route.api = {
      before: oldAPI.before,
      get: oldAPI.get,
      post: oldAPI.post,
      patch: oldAPI.patch,
      put: oldAPI.put,
      delete: oldAPI.delete
    }
    req.route.api.before = async (req) => {
      await oldAPI.before(req)
      DashboardScreenshots.addMetrics(req.data.createdChartDays, 365, payoutQuantities)
      DashboardScreenshots.adjustNormalize(req.data.createdChartDays)
      DashboardScreenshots.adjustHighlight(payoutQuantities, req.data.createdChartHighlights)
      DashboardScreenshots.adjustValues(req.data.createdChartDays, req.data.createdChartValues)
      addPayoutObjects(req.data.payouts, global.pageSize - req.data.payouts.length)
      req.data.total = req.data.createdChartHighlights.total
    }
  }
}

module.exports = {
  administratorIndex,
  administratorStripeAccounts,
  administratorPayouts
}

function addStripeAccountObjects (array, quantity) {
  const now = new Date()
  let date = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  let day = 0
  let dayCount = 0
  const constructors = [
    createIndividualMissingInfo,
    createIndividualMissingSubmission,
    createIndividualSubmitted,
    createCompanyMissingBanking,
    createCompanyMissingInfo,
    createCompanyMissingSubmission,
    createCompanySubmitted
  ]
  for (let i = 0; i < quantity; i++) {
    dayCount++
    if (dayCount === stripeAccountQuantities[day]) {
      day++
      dayCount = 0
      date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day)
    }
    const type = constructors[Math.floor(Math.random() * constructors.length)]
    const stripeAccount = mergeStripeObject(type(date))
    stripeAccount.individual = stripeAccount.individual || {}
    stripeAccount.company = stripeAccount.company || {}
    if (stripeAccount.payouts_enabled) {
      stripeAccount.statusMessage = 'verified'
    } else if (stripeAccount.requirements.disabled_reason) {
      stripeAccount.statusMessage = stripeAccount.requirements.disabled_reason
    } else if (stripeAccount.requirements.details_code) {
      stripeAccount.statusMessage = stripeAccount.requirements.details_code
    } else if (stripeAccount.submittedAt) {
      stripeAccount.statusMessage = 'under-review'
    } else {
      stripeAccount.statusMessage = 'not-submitted'
    }
    array.push(stripeAccount)
  }
}

function addPayoutObjects (array, quantity) {
  const now = new Date()
  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const stripeAccounts = []
  addStripeAccountObjects(stripeAccounts, quantity * 20)
  const preexisting = [].concat(array)
  for (const stripeAccount of stripeAccounts) {
    if (!stripeAccount.payouts_enabled) {
      continue
    }
    let month = 0
    while (true) {
      const payoutDate = new Date(date.getFullYear(), date.getMonth() - month, date.getDate())
      if (payoutDate.getTime() < stripeAccount.createdAt.getTime()) {
        break
      }
      month++
      const id = faker.datatype.uuid().split('-').join('').substring(0, 16)
      const payout = {
        payoutid: `po_${id}`,
        object: 'payout',
        stripeObject: {
          id: `po_${id}`,
          object: 'payout',
          amount: 10000 + Math.ceil(Math.random() * 100000),
          arrival_date: Math.floor(payoutDate.getTime() / 1000),
          automatic: false,
          balance_transaction: 'txn_1KoMUmRez1x7uV4Qxs4i53bT',
          created: Math.floor(payoutDate.getTime() / 1000),
          currency: stripeAccount.default_currency,
          description: null,
          destination: 'ba_1KoMUNRez1x7uV4Ql5XXWYra',
          failure_balance_transaction: null,
          failure_code: null,
          failure_message: null,
          livemode: false,
          metadata: {},
          method: 'standard',
          original_payout: null,
          reversed_by: null,
          source_type: 'card',
          statement_descriptor: null,
          status: 'paid',
          type: 'bank_account'
        },
        accountid: stripeAccount.accountid,
        stripeid: stripeAccount.id,
        appid: global.appid,
        createdAt: payoutDate,
        updatedAt: payoutDate
      }
      array.push(mergeStripeObject(payout))
    }
  }
  array.sort((a, b) => {
    return a.createdAt.getTime() > b.createdAt.getTime() ? 1 : -1
  })
  // put the original payouts back at the top of the list
  preexisting.reverse()
  for (const item of preexisting) {
    array.splice(array.indexOf(item), 1)
    array.unshift(item)
  }
  array.length = quantity + preexisting.length
}

function addPersonObjects (array, stripeAccount, type, quantity) {
  const now = new Date()
  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  let identityNumber = 0
  for (let i = 0; i < quantity; i++) {
    const identity = DashboardScreenshots.identities[identityNumber]
    identityNumber++
    const person = {
      personid: 'mmbr_' + faker.datatype.uuid().split('-').join('').substring(0, 16),
      object: 'person',
      appid: global.appid,
      payoutid: 'invt_' + faker.datatype.uuid().split('-').join('').substring(0, 16),
      stripeAccountid: 'acct_' + faker.datatype.uuid().split('-').join('').substring(0, 16),
      accountid: 'acct_' + faker.datatype.uuid().split('-').join('').substring(0, 16),
      profileid: 'prof_' + faker.datatype.uuid().split('-').join('').substring(0, 16),
      createdAt: date,
      createdAtFormatted: date.getFullYear() + '-' + DashboardScreenshots.twoDigits(date.getMonth() + 1) + '-' + DashboardScreenshots.twoDigits(date.getDate()),
      updatedAt: date,
      updatedAtFormatted: date.getFullYear() + '-' + DashboardScreenshots.twoDigits(date.getMonth() + 1) + '-' + DashboardScreenshots.twoDigits(date.getDate()),
      displayName: identity.firstName,
      displayEmail: identity.email
    }
    array.push(person)
  }
}

// TODO: randomize the addresses
// TODO: randomize the phone numbers
const currencies = {
  US: 'usd',
  AU: 'aud',
  NZ: 'nzd',
  CA: 'cad',
  GB: 'gbp',
  DE: 'eur',
  FR: 'eur',
  IT: 'eur',
  JP: 'jpy',
  SG: 'sgd'
}
const countries = Object.keys(currencies)

function createIndividualMissingInfo (date) {
  const id = faker.datatype.uuid().split('-').join('').substring(0, 16)
  const country = countries[Math.floor(Math.random() * countries.length)]
  return {
    stripeid: `acct_${id}`,
    object: 'stripeAccount',
    accountid: 'acct_' + faker.datatype.uuid().split('-').join('').substring(0, 16),
    tokenUpdate: null,
    stripeObject: {
      id: `acct_${id}`,
      object: 'account',
      business_profile: {
        mcc: null,
        name: null,
        product_description: null,
        support_address: null,
        support_email: null,
        support_phone: null,
        support_url: null,
        url: null
      },
      business_type: 'individual',
      capabilities: {
        card_payments: 'inactive',
        transfers: 'inactive'
      },
      charges_enabled: false,
      company: {
        address: {
          city: null,
          country,
          line1: null,
          line2: null,
          postal_code: null,
          state: null
        },
        directors_provided: true,
        executives_provided: true,
        name: null,
        owners_provided: true,
        tax_id_provided: false,
        verification: {
          document: {
            back: null,
            details: null,
            details_code: null,
            front: null
          }
        }
      },
      country,
      created: Math.floor(date.getTime() / 1000),
      default_currency: currencies[country],
      details_submitted: false,
      email: null,
      external_accounts: {
        object: 'list',
        data: [],
        has_more: false,
        total_count: 0,
        url: '/v1/accounts/acct_1KoMTKRdAY4tThnB/external_accounts'
      },
      future_requirements: {
        alternatives: [],
        current_deadline: null,
        currently_due: [],
        disabled_reason: null,
        errors: [],
        eventually_due: [],
        past_due: [],
        pending_verification: []
      },
      metadata: {},
      payouts_enabled: false,
      requirements: {
        alternatives: [],
        current_deadline: null,
        currently_due: [
          'business_profile.mcc',
          'business_profile.url',
          'external_account',
          'individual.address.city',
          'individual.address.line1',
          'individual.address.postal_code',
          'individual.address.state',
          'individual.dob.day',
          'individual.dob.month',
          'individual.dob.year',
          'individual.email',
          'individual.first_name',
          'individual.last_name',
          'individual.phone',
          'individual.ssn_last_4',
          'tos_acceptance.date',
          'tos_acceptance.ip'
        ],
        disabled_reason: 'requirements.past_due',
        errors: [],
        eventually_due: [
          'business_profile.mcc',
          'business_profile.url',
          'external_account',
          'individual.address.city',
          'individual.address.line1',
          'individual.address.postal_code',
          'individual.address.state',
          'individual.dob.day',
          'individual.dob.month',
          'individual.dob.year',
          'individual.email',
          'individual.first_name',
          'individual.last_name',
          'individual.phone',
          'individual.ssn_last_4',
          'tos_acceptance.date',
          'tos_acceptance.ip'
        ],
        past_due: [
          'business_profile.mcc',
          'business_profile.url',
          'external_account',
          'individual.address.city',
          'individual.address.line1',
          'individual.address.postal_code',
          'individual.address.state',
          'individual.dob.day',
          'individual.dob.month',
          'individual.dob.year',
          'individual.email',
          'individual.first_name',
          'individual.last_name',
          'individual.phone',
          'individual.ssn_last_4',
          'tos_acceptance.date',
          'tos_acceptance.ip'
        ],
        pending_verification: []
      },
      settings: {
        bacs_debit_payments: {},
        branding: {
          icon: null,
          logo: null,
          primary_color: null,
          secondary_color: null
        },
        card_issuing: {
          tos_acceptance: {
            date: null,
            ip: null
          }
        },
        card_payments: {
          decline_on: {
            avs_failure: false,
            cvc_failure: false
          },
          statement_descriptor_prefix: null
        },
        dashboard: {
          display_name: null,
          timezone: 'Etc/UTC'
        },
        payments: {
          statement_descriptor: null,
          statement_descriptor_kana: null,
          statement_descriptor_kanji: null
        },
        payouts: {
          debit_negative_balances: false,
          schedule: {
            delay_days: 2,
            interval: 'daily'
          },
          statement_descriptor: null
        },
        sepa_debit_payments: {}
      },
      tos_acceptance: {
        date: null,
        ip: null,
        user_agent: null
      },
      type: 'custom'
    },
    requiresOwners: false,
    requiresDirectors: false,
    requiresExecutives: false,
    appid: global.appid,
    createdAt: date,
    updatedAt: date
  }
}

function createIndividualMissingSubmission (date) {
  const id = faker.datatype.uuid().split('-').join('').substring(0, 16)
  const mcc = merchantCategoryCodes.en[Math.floor(Math.random() * merchantCategoryCodes.en.length)].code
  const country = countries[Math.floor(Math.random() * countries.length)]
  return {
    stripeid: `acct_${id}`,
    object: 'stripeAccount',
    accountid: 'acct_' + faker.datatype.uuid().split('-').join('').substring(0, 16),
    tokenUpdate: null,
    stripeObject: {
      id: `acct_${id}`,
      object: 'account',
      business_profile: {
        mcc,
        name: null,
        product_description: null,
        support_address: null,
        support_email: null,
        support_phone: null,
        support_url: null,
        url: 'https://www.an-example-website.com'
      },
      business_type: 'individual',
      capabilities: {
        card_payments: 'inactive',
        transfers: 'inactive'
      },
      charges_enabled: false,
      company: {
        address: {
          city: 'New York',
          country,
          line1: '285 Fulton St',
          line2: null,
          postal_code: '10007',
          state: 'NY'
        },
        directors_provided: true,
        executives_provided: true,
        name: null,
        owners_provided: true,
        phone: '+14567890123',
        tax_id_provided: false,
        verification: {
          document: {
            back: null,
            details: null,
            details_code: null,
            front: null
          }
        }
      },
      country,
      created: Math.floor(date.getTime() / 1000),
      default_currency: currencies[country],
      details_submitted: false,
      email: null,
      external_accounts: {
        object: 'list',
        data: [
          {
            id: 'ba_1Kp9NZRYQnBwJLS2IPUjRZzM',
            object: 'bank_account',
            account: 'acct_1Kp9NURYQnBwJLS2',
            account_holder_name: 'Max Bailey',
            account_holder_type: 'individual',
            account_type: null,
            available_payout_methods: [
              'standard'
            ],
            bank_name: 'STRIPE TEST BANK',
            country,
            currency: currencies[country],
            default_for_currency: true,
            fingerprint: 'JimHdPVl5ugmtnve',
            last4: '6789',
            metadata: {},
            routing_number: '110000000',
            status: 'new'
          }
        ],
        has_more: false,
        total_count: 1,
        url: '/v1/accounts/acct_1Kp9NURYQnBwJLS2/external_accounts'
      },
      future_requirements: {
        alternatives: [],
        current_deadline: null,
        currently_due: [],
        disabled_reason: null,
        errors: [],
        eventually_due: [],
        past_due: [],
        pending_verification: []
      },
      individual: {
        id: 'person_4Kp9NX00FXSzySKu',
        object: 'person',
        account: 'acct_1Kp9NURYQnBwJLS2',
        address: {
          city: 'New York',
          country,
          line1: '285 Fulton St',
          line2: null,
          postal_code: '10007',
          state: 'NY'
        },
        created: Math.floor(date.getTime() / 1000),
        dob: {
          day: 1,
          month: 1,
          year: 1970
        },
        email: 'Max_Bailey@hotmail.com',
        first_name: 'Max',
        future_requirements: {
          alternatives: [],
          currently_due: [],
          errors: [],
          eventually_due: [],
          past_due: [],
          pending_verification: []
        },
        id_number_provided: false,
        last_name: 'Bailey',
        metadata: {},
        phone: '+14567890123',
        relationship: {
          director: false,
          executive: false,
          owner: false,
          percent_ownership: null,
          representative: true,
          title: null
        },
        requirements: {
          alternatives: [],
          currently_due: [],
          errors: [],
          eventually_due: [],
          past_due: [],
          pending_verification: [
            'address.city',
            'address.line1',
            'address.postal_code',
            'address.state',
            'id_number'
          ]
        },
        ssn_last_4_provided: true,
        verification: {
          additional_document: {
            back: null,
            details: null,
            details_code: null,
            front: null
          },
          details: null,
          details_code: null,
          document: {
            back: null,
            details: null,
            details_code: null,
            front: null
          },
          status: 'pending'
        }
      },
      metadata: {},
      payouts_enabled: false,
      requirements: {
        alternatives: [],
        current_deadline: null,
        currently_due: [
          'tos_acceptance.date',
          'tos_acceptance.ip'
        ],
        disabled_reason: 'requirements.past_due',
        errors: [],
        eventually_due: [
          'tos_acceptance.date',
          'tos_acceptance.ip'
        ],
        past_due: [
          'tos_acceptance.date',
          'tos_acceptance.ip'
        ],
        pending_verification: [
          'individual.address.city',
          'individual.address.line1',
          'individual.address.postal_code',
          'individual.address.state',
          'individual.id_number'
        ]
      },
      settings: {
        bacs_debit_payments: {},
        branding: {
          icon: null,
          logo: null,
          primary_color: null,
          secondary_color: null
        },
        card_issuing: {
          tos_acceptance: {
            date: null,
            ip: null
          }
        },
        card_payments: {
          decline_on: {
            avs_failure: false,
            cvc_failure: false
          },
          statement_descriptor_prefix: null
        },
        dashboard: {
          display_name: 'An-example-website',
          timezone: 'Etc/UTC'
        },
        payments: {
          statement_descriptor: 'WWW.AN-EXAMPLE-WEBSITE.COM',
          statement_descriptor_kana: null,
          statement_descriptor_kanji: null
        },
        payouts: {
          debit_negative_balances: false,
          schedule: {
            delay_days: 2,
            interval: 'daily'
          },
          statement_descriptor: null
        },
        sepa_debit_payments: {}
      },
      tos_acceptance: {
        date: null,
        ip: null,
        user_agent: null
      },
      type: 'custom'
    },
    requiresOwners: false,
    requiresDirectors: false,
    requiresExecutives: false,
    appid: global.appid,
    createdAt: date,
    updatedAt: date
  }
}

function createIndividualSubmitted (date) {
  const id = faker.datatype.uuid().split('-').join('').substring(0, 16)
  const mcc = merchantCategoryCodes.en[Math.floor(Math.random() * merchantCategoryCodes.en.length)].code
  const country = countries[Math.floor(Math.random() * countries.length)]
  return {
    stripeid: `acct_${id}`,
    object: 'stripeAccount',
    accountid: 'acct_' + faker.datatype.uuid().split('-').join('').substring(0, 16),
    tokenUpdate: null,
    stripeObject: {
      id: `acct_${id}`,
      object: 'account',
      business_profile: {
        mcc,
        name: null,
        product_description: null,
        support_address: null,
        support_email: null,
        support_phone: null,
        support_url: null,
        url: 'https://www.an-example-website.com'
      },
      business_type: 'individual',
      capabilities: {
        card_payments: 'active',
        transfers: 'active'
      },
      charges_enabled: true,
      company: {
        address: {
          city: 'Auckland',
          country,
          line1: '123 Park Lane',
          line2: null,
          postal_code: '6011',
          state: null
        },
        directors_provided: true,
        executives_provided: true,
        name: null,
        owners_provided: true,
        phone: '+14567890123',
        tax_id_provided: false,
        verification: {
          document: {
            back: null,
            details: null,
            details_code: null,
            front: null
          }
        }
      },
      country,
      created: Math.floor(date.getTime() / 1000),
      default_currency: currencies[country],
      details_submitted: true,
      email: null,
      external_accounts: {
        object: 'list',
        data: [
          {
            id: 'ba_1Kp9I7RV4Gk44k5yPVzBTwkj',
            object: 'bank_account',
            account: 'acct_1Kp9I2RV4Gk44k5y',
            account_holder_name: 'Lawrence Nitzsche',
            account_holder_type: 'individual',
            account_type: null,
            available_payout_methods: [
              'standard'
            ],
            bank_name: 'STRIPE TEST BANK',
            country,
            currency: currencies[country],
            default_for_currency: true,
            fingerprint: 'Ui4A3KT8DTEFPL2X',
            last4: '0010',
            metadata: {},
            routing_number: '110000',
            status: 'new'
          }
        ],
        has_more: false,
        total_count: 1,
        url: '/v1/accounts/acct_1Kp9I2RV4Gk44k5y/external_accounts'
      },
      future_requirements: {
        alternatives: [],
        current_deadline: null,
        currently_due: [],
        disabled_reason: null,
        errors: [],
        eventually_due: [],
        past_due: [],
        pending_verification: []
      },
      individual: {
        id: 'person_4Kp9I5004CTO3JuD',
        object: 'person',
        account: 'acct_1Kp9I2RV4Gk44k5y',
        address: {
          city: 'Auckland',
          country,
          line1: '123 Park Lane',
          line2: null,
          postal_code: '6011',
          state: null
        },
        created: Math.floor(date.getTime() / 1000),
        dob: {
          day: 1,
          month: 1,
          year: 1970
        },
        email: 'Lawrence.Nitzsche@yahoo.com',
        first_name: 'Lawrence',
        future_requirements: {
          alternatives: [],
          currently_due: [],
          errors: [],
          eventually_due: [],
          past_due: [],
          pending_verification: []
        },
        last_name: 'Nitzsche',
        metadata: {},
        phone: '+14567890123',
        relationship: {
          director: false,
          executive: false,
          owner: false,
          percent_ownership: null,
          representative: true,
          title: null
        },
        requirements: {
          alternatives: [],
          currently_due: [],
          errors: [],
          eventually_due: [],
          past_due: [],
          pending_verification: []
        },
        verification: {
          additional_document: {
            back: 'file_1Kp9INDsofxDmDiWJ8b6vpl0',
            details: null,
            details_code: null,
            front: 'file_1Kp9IMDsofxDmDiWPr0fpxOC'
          },
          details: null,
          details_code: null,
          document: {
            back: 'file_1Kp9IQDsofxDmDiWPI5gL2En',
            details: null,
            details_code: null,
            front: 'file_1Kp9IPDsofxDmDiWVWtTGMSg'
          },
          status: 'verified'
        }
      },
      metadata: {},
      payouts_enabled: false,
      requirements: {
        alternatives: [],
        current_deadline: null,
        currently_due: [],
        disabled_reason: 'requirements.pending_verification',
        errors: [],
        eventually_due: [],
        past_due: [],
        pending_verification: []
      },
      settings: {
        bacs_debit_payments: {},
        branding: {
          icon: null,
          logo: null,
          primary_color: null,
          secondary_color: null
        },
        card_issuing: {
          tos_acceptance: {
            date: null,
            ip: null
          }
        },
        card_payments: {
          decline_on: {
            avs_failure: false,
            cvc_failure: false
          },
          statement_descriptor_prefix: null
        },
        dashboard: {
          display_name: 'An-example-website',
          timezone: 'Etc/UTC'
        },
        payments: {
          statement_descriptor: 'WWW.AN-EXAMPLE-WEBSITE.COM',
          statement_descriptor_kana: null,
          statement_descriptor_kanji: null
        },
        payouts: {
          debit_negative_balances: false,
          schedule: {
            delay_days: 4,
            interval: 'daily'
          },
          statement_descriptor: null
        },
        sepa_debit_payments: {}
      },
      tos_acceptance: {
        date: Math.floor(date.getTime() / 1000),
        ip: '127.0.0.1',
        user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X x.y; rv:42.0) Gecko/20100101 Firefox/42.0'
      },
      type: 'custom'
    },
    requiresOwners: false,
    requiresDirectors: false,
    requiresExecutives: false,
    submittedAt: date,
    appid: global.appid,
    createdAt: date,
    updatedAt: date
  }
}

function createCompanyMissingInfo (date) {
  const id = faker.datatype.uuid().split('-').join('').substring(0, 16)
  const country = countries[Math.floor(Math.random() * countries.length)]
  return {
    stripeid: `acct_${id}`,
    object: 'stripeAccount',
    accountid: 'acct_' + faker.datatype.uuid().split('-').join('').substring(0, 16),
    tokenUpdate: null,
    stripeObject: {
      id: `acct_${id}`,
      object: 'account',
      business_profile: {
        mcc: null,
        name: null,
        product_description: null,
        support_address: null,
        support_email: null,
        support_phone: null,
        support_url: null,
        url: null
      },
      business_type: 'company',
      capabilities: {
        card_payments: 'inactive',
        transfers: 'inactive'
      },
      charges_enabled: false,
      company: {
        address: {
          city: null,
          country,
          line1: null,
          line2: null,
          postal_code: null,
          state: null
        },
        directors_provided: false,
        executives_provided: false,
        name: null,
        owners_provided: false,
        tax_id_provided: false,
        verification: {
          document: {
            back: null,
            details: null,
            details_code: null,
            front: null
          }
        }
      },
      country,
      created: Math.floor(date.getTime() / 1000),
      default_currency: currencies[country],
      details_submitted: false,
      email: null,
      external_accounts: {
        object: 'list',
        data: [],
        has_more: false,
        total_count: 0,
        url: '/v1/accounts/acct_1KoMbSRZ7pn7ijcJ/external_accounts'
      },
      future_requirements: {
        alternatives: [],
        current_deadline: null,
        currently_due: [],
        disabled_reason: null,
        errors: [],
        eventually_due: [],
        past_due: [],
        pending_verification: []
      },
      metadata: {},
      payouts_enabled: false,
      requirements: {
        alternatives: [
          {
            alternative_fields_due: [
              'owners.verification.document'
            ],
            original_fields_due: [
              'owners.ssn_last_4'
            ]
          },
          {
            alternative_fields_due: [
              'representative.verification.document'
            ],
            original_fields_due: [
              'representative.ssn_last_4'
            ]
          }
        ],
        current_deadline: null,
        currently_due: [
          'business_profile.mcc',
          'business_profile.url',
          'company.address.city',
          'company.address.line1',
          'company.address.postal_code',
          'company.address.state',
          'company.name',
          'company.owners_provided',
          'company.phone',
          'company.tax_id',
          'external_account',
          'owners.email',
          'owners.first_name',
          'owners.last_name',
          'representative.address.city',
          'representative.address.line1',
          'representative.address.postal_code',
          'representative.address.state',
          'representative.dob.day',
          'representative.dob.month',
          'representative.dob.year',
          'representative.email',
          'representative.first_name',
          'representative.last_name',
          'representative.phone',
          'representative.relationship.executive',
          'representative.relationship.title',
          'representative.ssn_last_4',
          'tos_acceptance.date',
          'tos_acceptance.ip'
        ],
        disabled_reason: 'requirements.past_due',
        errors: [],
        eventually_due: [
          'business_profile.mcc',
          'business_profile.url',
          'company.address.city',
          'company.address.line1',
          'company.address.postal_code',
          'company.address.state',
          'company.name',
          'company.owners_provided',
          'company.phone',
          'company.tax_id',
          'external_account',
          'owners.address.city',
          'owners.address.line1',
          'owners.address.postal_code',
          'owners.address.state',
          'owners.dob.day',
          'owners.dob.month',
          'owners.dob.year',
          'owners.email',
          'owners.first_name',
          'owners.last_name',
          'owners.phone',
          'owners.ssn_last_4',
          'representative.address.city',
          'representative.address.line1',
          'representative.address.postal_code',
          'representative.address.state',
          'representative.dob.day',
          'representative.dob.month',
          'representative.dob.year',
          'representative.email',
          'representative.first_name',
          'representative.last_name',
          'representative.phone',
          'representative.relationship.executive',
          'representative.relationship.title',
          'representative.ssn_last_4',
          'tos_acceptance.date',
          'tos_acceptance.ip'
        ],
        past_due: [
          'business_profile.mcc',
          'business_profile.url',
          'company.address.city',
          'company.address.line1',
          'company.address.postal_code',
          'company.address.state',
          'company.name',
          'company.owners_provided',
          'company.phone',
          'company.tax_id',
          'external_account',
          'owners.email',
          'owners.first_name',
          'owners.last_name',
          'representative.address.city',
          'representative.address.line1',
          'representative.address.postal_code',
          'representative.address.state',
          'representative.dob.day',
          'representative.dob.month',
          'representative.dob.year',
          'representative.email',
          'representative.first_name',
          'representative.last_name',
          'representative.phone',
          'representative.relationship.executive',
          'representative.relationship.title',
          'representative.ssn_last_4',
          'tos_acceptance.date',
          'tos_acceptance.ip'
        ],
        pending_verification: []
      },
      settings: {
        bacs_debit_payments: {},
        branding: {
          icon: null,
          logo: null,
          primary_color: null,
          secondary_color: null
        },
        card_issuing: {
          tos_acceptance: {
            date: null,
            ip: null
          }
        },
        card_payments: {
          decline_on: {
            avs_failure: false,
            cvc_failure: false
          },
          statement_descriptor_prefix: null
        },
        dashboard: {
          display_name: null,
          timezone: 'Etc/UTC'
        },
        payments: {
          statement_descriptor: null,
          statement_descriptor_kana: null,
          statement_descriptor_kanji: null
        },
        payouts: {
          debit_negative_balances: false,
          schedule: {
            delay_days: 2,
            interval: 'daily'
          },
          statement_descriptor: null
        },
        sepa_debit_payments: {}
      },
      tos_acceptance: {
        date: null,
        ip: null,
        user_agent: null
      },
      type: 'custom'
    },
    requiresOwners: true,
    requiresDirectors: false,
    requiresExecutives: false,
    appid: global.appid,
    createdAt: date,
    updatedAt: date
  }
}

function createCompanyMissingBanking (date) {
  const id = faker.datatype.uuid().split('-').join('').substring(0, 16)
  const mcc = merchantCategoryCodes.en[Math.floor(Math.random() * merchantCategoryCodes.en.length)].code
  const country = countries[Math.floor(Math.random() * countries.length)]
  const companyName = faker.company.companyName()
  return {
    stripeid: `acct_${id}`,
    object: 'stripeAccount',
    accountid: 'acct_' + faker.datatype.uuid().split('-').join('').substring(0, 16),
    tokenUpdate: null,
    stripeObject: {
      id: `acct_${id}`,
      object: 'account',
      business_profile: {
        mcc,
        name: companyName,
        product_description: null,
        support_address: null,
        support_email: null,
        support_phone: null,
        support_url: null,
        url: 'https://www.an-example-website.com'
      },
      business_type: 'company',
      capabilities: {
        card_payments: 'inactive',
        transfers: 'inactive'
      },
      charges_enabled: false,
      company: {
        address: {
          city: 'Berlin',
          country,
          line1: '123 Park Lane',
          line2: null,
          postal_code: '01067',
          state: null
        },
        directors_provided: true,
        executives_provided: true,
        name: companyName,
        owners_provided: true,
        phone: '4567890123',
        tax_id_provided: true,
        verification: {
          document: {
            back: null,
            details: null,
            details_code: null,
            front: null
          }
        }
      },
      country,
      created: Math.floor(date.getTime() / 1000),
      default_currency: currencies[country],
      details_submitted: false,
      email: null,
      external_accounts: {
        object: 'list',
        data: [],
        has_more: false,
        total_count: 0,
        url: '/v1/accounts/acct_1Kp9RARUDFdeTcn1/external_accounts'
      },
      future_requirements: {
        alternatives: [],
        current_deadline: null,
        currently_due: [],
        disabled_reason: null,
        errors: [],
        eventually_due: [],
        past_due: [],
        pending_verification: []
      },
      metadata: {},
      payouts_enabled: false,
      requirements: {
        alternatives: [],
        current_deadline: null,
        currently_due: [
          'external_account',
          'tos_acceptance.date',
          'tos_acceptance.ip'
        ],
        disabled_reason: 'requirements.past_due',
        errors: [],
        eventually_due: [
          'external_account',
          'tos_acceptance.date',
          'tos_acceptance.ip'
        ],
        past_due: [
          'external_account',
          'tos_acceptance.date',
          'tos_acceptance.ip'
        ],
        pending_verification: [
          'company.verification.document'
        ]
      },
      settings: {
        bacs_debit_payments: {},
        branding: {
          icon: null,
          logo: null,
          primary_color: null,
          secondary_color: null
        },
        card_issuing: {
          tos_acceptance: {
            date: null,
            ip: null
          }
        },
        card_payments: {
          decline_on: {
            avs_failure: false,
            cvc_failure: false
          },
          statement_descriptor_prefix: null
        },
        dashboard: {
          display_name: 'An-example-website',
          timezone: 'Etc/UTC'
        },
        payments: {
          statement_descriptor: 'WWW.AN-EXAMPLE-WEBSITE.COM',
          statement_descriptor_kana: null,
          statement_descriptor_kanji: null
        },
        payouts: {
          debit_negative_balances: false,
          schedule: {
            delay_days: 7,
            interval: 'daily'
          },
          statement_descriptor: null
        },
        sepa_debit_payments: {}
      },
      tos_acceptance: {
        date: null,
        ip: null,
        user_agent: null
      },
      type: 'custom'
    },
    requiresOwners: true,
    requiresDirectors: true,
    requiresExecutives: true,
    appid: global.appid,
    createdAt: date,
    updatedAt: date
  }
}

function createCompanyMissingSubmission (date) {
  const id = faker.datatype.uuid().split('-').join('').substring(0, 16)
  const mcc = merchantCategoryCodes.en[Math.floor(Math.random() * merchantCategoryCodes.en.length)].code
  const country = countries[Math.floor(Math.random() * countries.length)]
  const companyName = faker.company.companyName()
  return {
    stripeid: `acct_${id}`,
    object: 'stripeAccount',
    accountid: 'acct_' + faker.datatype.uuid().split('-').join('').substring(0, 16),
    tokenUpdate: null,
    stripeObject: {
      id: `acct_${id}`,
      object: 'account',
      business_profile: {
        mcc,
        name: companyName,
        product_description: null,
        support_address: null,
        support_email: null,
        support_phone: null,
        support_url: null,
        url: 'https://www.an-example-website.com'
      },
      business_type: 'company',
      capabilities: {
        card_payments: 'inactive',
        transfers: 'inactive'
      },
      charges_enabled: false,
      company: {
        address: {
          city: 'Berlin',
          country,
          line1: '123 Park Lane',
          line2: null,
          postal_code: '01067',
          state: null
        },
        directors_provided: true,
        executives_provided: true,
        name: companyName,
        owners_provided: true,
        phone: '4567890123',
        tax_id_provided: true,
        verification: {
          document: {
            back: null,
            details: null,
            details_code: null,
            front: null
          }
        }
      },
      country,
      created: Math.floor(date.getTime() / 1000),
      default_currency: currencies[country],
      details_submitted: false,
      email: null,
      external_accounts: {
        object: 'list',
        data: [
          {
            id: 'ba_1Kp9ViRg0w5dblmPLT8Lzhc5',
            object: 'bank_account',
            account: 'acct_1Kp9UsRg0w5dblmP',
            account_holder_name: 'Tim Legros',
            account_holder_type: 'company',
            account_type: null,
            available_payout_methods: [
              'standard'
            ],
            bank_name: 'STRIPE TEST BANK',
            country,
            currency: currencies[country],
            default_for_currency: true,
            fingerprint: '8JEgQB776Ig8OZcq',
            last4: '3000',
            metadata: {},
            routing_number: '110000000',
            status: 'new'
          }
        ],
        has_more: false,
        total_count: 1,
        url: '/v1/accounts/acct_1Kp9UsRg0w5dblmP/external_accounts'
      },
      future_requirements: {
        alternatives: [],
        current_deadline: null,
        currently_due: [],
        disabled_reason: null,
        errors: [],
        eventually_due: [],
        past_due: [],
        pending_verification: []
      },
      metadata: {},
      payouts_enabled: false,
      requirements: {
        alternatives: [],
        current_deadline: null,
        currently_due: [
          'tos_acceptance.date',
          'tos_acceptance.ip'
        ],
        disabled_reason: 'requirements.past_due',
        errors: [],
        eventually_due: [
          'tos_acceptance.date',
          'tos_acceptance.ip'
        ],
        past_due: [
          'tos_acceptance.date',
          'tos_acceptance.ip'
        ],
        pending_verification: [
          'company.verification.document'
        ]
      },
      settings: {
        bacs_debit_payments: {},
        branding: {
          icon: null,
          logo: null,
          primary_color: null,
          secondary_color: null
        },
        card_issuing: {
          tos_acceptance: {
            date: null,
            ip: null
          }
        },
        card_payments: {
          decline_on: {
            avs_failure: false,
            cvc_failure: false
          },
          statement_descriptor_prefix: null
        },
        dashboard: {
          display_name: 'An-example-website',
          timezone: 'Etc/UTC'
        },
        payments: {
          statement_descriptor: 'WWW.AN-EXAMPLE-WEBSITE.COM',
          statement_descriptor_kana: null,
          statement_descriptor_kanji: null
        },
        payouts: {
          debit_negative_balances: false,
          schedule: {
            delay_days: 7,
            interval: 'daily'
          },
          statement_descriptor: null
        },
        sepa_debit_payments: {}
      },
      tos_acceptance: {
        date: null,
        ip: null,
        user_agent: null
      },
      type: 'custom'
    },
    requiresOwners: true,
    requiresDirectors: true,
    requiresExecutives: true,
    appid: global.appid,
    createdAt: date,
    updatedAt: date
  }
}

function createCompanySubmitted (date) {
  const id = faker.datatype.uuid().split('-').join('').substring(0, 16)
  const mcc = merchantCategoryCodes.en[Math.floor(Math.random() * merchantCategoryCodes.en.length)].code
  const country = countries[Math.floor(Math.random() * countries.length)]
  const companyName = faker.company.companyName()
  return {
    stripeid: `acct_${id}`,
    object: 'stripeAccount',
    accountid: 'acct_' + faker.datatype.uuid().split('-').join('').substring(0, 16),
    tokenUpdate: null,
    stripeObject: {
      id: `acct_${id}`,
      object: 'account',
      business_profile: {
        mcc,
        name: companyName,
        product_description: null,
        support_address: null,
        support_email: null,
        support_phone: null,
        support_url: null,
        url: 'https://www.an-example-website.com'
      },
      business_type: 'company',
      capabilities: {
        card_payments: 'active',
        transfers: 'active'
      },
      charges_enabled: true,
      company: {
        address: {
          city: 'Rome',
          country,
          line1: '123 Park Lane',
          line2: null,
          postal_code: '00010',
          state: null
        },
        directors_provided: true,
        executives_provided: true,
        name: companyName,
        owners_provided: true,
        phone: '4567890123',
        tax_id_provided: true,
        verification: {
          document: {
            back: null,
            details: null,
            details_code: null,
            front: null
          }
        }
      },
      country,
      created: Math.floor(date.getTime() / 1000),
      default_currency: currencies[country],
      details_submitted: true,
      email: null,
      external_accounts: {
        object: 'list',
        data: [
          {
            id: 'ba_1Kp9cjRWUC6tC6MJL24ZWEUP',
            object: 'bank_account',
            account: 'acct_1Kp9boRWUC6tC6MJ',
            account_holder_name: 'Krystal Harris',
            account_holder_type: 'company',
            account_type: null,
            available_payout_methods: [
              'standard'
            ],
            bank_name: 'STRIPE TEST BANK',
            country,
            currency: currencies[country],
            default_for_currency: true,
            fingerprint: 'EVIlHoxE1ipOtH7U',
            last4: '3000',
            metadata: {},
            routing_number: '110000000',
            status: 'new'
          }
        ],
        has_more: false,
        total_count: 1,
        url: '/v1/accounts/acct_1Kp9boRWUC6tC6MJ/external_accounts'
      },
      future_requirements: {
        alternatives: [],
        current_deadline: null,
        currently_due: [],
        disabled_reason: null,
        errors: [],
        eventually_due: [],
        past_due: [],
        pending_verification: []
      },
      metadata: {},
      payouts_enabled: true,
      requirements: {
        alternatives: [],
        current_deadline: null,
        currently_due: [],
        disabled_reason: null,
        errors: [],
        eventually_due: [],
        past_due: [],
        pending_verification: []
      },
      settings: {
        bacs_debit_payments: {},
        branding: {
          icon: null,
          logo: null,
          primary_color: null,
          secondary_color: null
        },
        card_issuing: {
          tos_acceptance: {
            date: null,
            ip: null
          }
        },
        card_payments: {
          decline_on: {
            avs_failure: false,
            cvc_failure: false
          },
          statement_descriptor_prefix: null
        },
        dashboard: {
          display_name: 'An-example-website',
          timezone: 'Etc/UTC'
        },
        payments: {
          statement_descriptor: 'WWW.AN-EXAMPLE-WEBSITE.COM',
          statement_descriptor_kana: null,
          statement_descriptor_kanji: null
        },
        payouts: {
          debit_negative_balances: false,
          schedule: {
            delay_days: 7,
            interval: 'daily'
          },
          statement_descriptor: null
        },
        sepa_debit_payments: {}
      },
      tos_acceptance: {
        date: Math.floor(date.getTime() / 1000),
        ip: '127.0.0.1',
        user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X x.y; rv:42.0) Gecko/20100101 Firefox/42.0'
      },
      type: 'custom'
    },
    requiresOwners: true,
    requiresDirectors: true,
    requiresExecutives: true,
    createdAt: date,
    updatedAt: date,
    submittedAt: date
  }
}
