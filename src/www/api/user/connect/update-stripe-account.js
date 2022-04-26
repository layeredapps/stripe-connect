const connect = require('../../../../../index.js')
const stripeCache = require('../../../../stripe-cache.js')
const dashboard = require('@layeredapps/dashboard')

module.exports = {
  patch: async (req) => {
    if (!req.query || !req.query.stripeid) {
      throw new Error('invalid-stripeid')
    }
    req.body = req.body || {}
    // TODO: the plan was you submit by token, or you submit data, but
    // for now only the file uploads are handled by token
    // if (global.stripeJS === 3 && (!req.body.token || req.body.token.length < 5)) {
    //   throw new Error('invalid-token')
    // }
    const stripeAccount = await global.api.user.connect.StripeAccount.get(req)
    if (!stripeAccount.stripeObject.requirements.currently_due.length) {
      throw new Error('invalid-stripe-account')
    }
    let required = false
    for (const requirement of stripeAccount.stripeObject.requirements.currently_due) {
      if (requirement.startsWith('tos_acceptance')) {
        continue
      }
      required = true
      break
    }
    if (!required) {
      throw new Error('invalid-stripe-account')
    }
    if (global.stripeJS === 3 && !req.body.token && req.uploads && Object.keys(req.uploads).length) {
      throw new Error('invalid-token')
    }
    const accountInfo = {}
    if (global.stripeJS === 3 && req.body.token) {
      accountInfo.account_token = req.body.token
      try {
        const stripeAccountNow = await stripeCache.execute('accounts', 'update', req.query.stripeid, accountInfo, req.stripeKey)
        await connect.Storage.StripeAccount.update({
          stripeObject: stripeAccountNow,
          tokenUpdate: new Date()
        }, {
          where: {
            stripeid: req.query.stripeid,
            appid: req.appid || global.appid
          }
        })
        await dashboard.StorageCache.remove(req.query.stripeid)
      } catch (error) {
        if (error.message.startsWith('invalid-')) {
          throw new Error(error.message.split('.').join('_'))
        }
        throw error
      }
      delete (accountInfo.account_token)
    } // else {
    let validateDOB = false
    if (req.body.individual_dob_day) {
      validateDOB = true
      try {
        const day = parseInt(req.body.individual_dob_day, 10)
        if (!day || day < 1 || day > 31) {
          throw new Error('invalid-individual_dob_day')
        }
      } catch (s) {
        throw new Error('invalid-individual_dob_day')
      }
    }
    if (req.body.individual_dob_month) {
      validateDOB = true
      try {
        const month = parseInt(req.body.individual_dob_month, 10)
        if (!month || month < 1 || month > 12) {
          throw new Error('invalid-individual_dob_month')
        }
      } catch (s) {
        throw new Error('invalid-individual_dob_month')
      }
    }
    if (req.body.individual_dob_year) {
      validateDOB = true
      try {
        const year = parseInt(req.body.individual_dob_year, 10)
        if (!year || year < 1900 || year > new Date().getFullYear() - 18) {
          throw new Error('invalid-individual_dob_year')
        }
      } catch (s) {
        throw new Error('invalid-individual_dob_year')
      }
    }
    if (validateDOB) {
      if (!req.body.individual_dob_day) {
        throw new Error('invalid-individual_dob_day')
      }
      if (!req.body.individual_dob_month) {
        throw new Error('invalid-individual_dob_month')
      }
      if (!req.body.individual_dob_year) {
        throw new Error('invalid-individual_dob_year')
      }
      try {
        Date.parse(`${req.body.individual_dob_year}/${req.body.individual_dob_month}/${req.body.individual_dob_day}`)
      } catch (error) {
        throw new Error('invalid-individual_dob_day')
      }
    }
    if (req.uploads) {
      for (const key in req.uploads) {
        const fileData = {
          purpose: 'identity_document',
          file: {
            type: 'application/octet-stream',
            name: req.uploads[key].name,
            data: req.uploads[key].buffer
          }
        }
        const file = await stripeCache.execute('files', 'create', fileData, req.stripeKey)
        if (stripeAccount.stripeObject.business_type === 'company') {
          accountInfo.company = accountInfo.company || {}
          accountInfo.company.verification = accountInfo.company.verification || {}
          const side = key.split('_').pop()
          if (key.indexOf('_additional_document') > -1) {
            accountInfo.company.verification.additional_document = accountInfo.company.verification.additional_document || {}
            accountInfo.company.verification.additional_document[side] = file.id
          } else if (key.indexOf('_document') > -1) {
            accountInfo.company.verification.document = accountInfo.company.verification.document || {}
            accountInfo.company.verification.document[side] = file.id
          }
        } else {
          accountInfo.individual = accountInfo.individual || {}
          accountInfo.individual.verification = accountInfo.individual.verification || {}
          const side = key.split('_').pop()
          if (key.indexOf('_additional_document') > -1) {
            accountInfo.individual.verification.additional_document = accountInfo.individual.verification.additional_document || {}
            accountInfo.individual.verification.additional_document[side] = file.id
          } else if (key.indexOf('_document') > -1) {
            accountInfo.individual.verification.document = accountInfo.individual.verification.document || {}
            accountInfo.individual.verification.document[side] = file.id
          }
        }
      }
    }
    const requirements = stripeAccount.stripeObject.requirements.currently_due.concat(stripeAccount.stripeObject.requirements.eventually_due)
    for (const field of requirements) {
      const pseudonym = field.split('.').join('_')
      if (!req.body[pseudonym]) {
        continue
      }
      const property = field.split('.').pop()
      if (field.startsWith('business_profile.')) {
        if (property === 'mcc') {
          const mccList = connect.getMerchantCategoryCodes(req.language)
          let found = false
          for (const mcc of mccList) {
            found = mcc.code === req.body.business_profile_mcc
            if (found) {
              break
            }
          }
          if (!found) {
            throw new Error('invalid-business_profile_mcc')
          }
        }
        if (property === 'url') {
          if (!req.body.business_profile_url.startsWith('http://') && !req.body.business_profile_url.startsWith('https://')) {
            throw new Error('invalid-business_profile_url')
          }
        }
        accountInfo.business_profile = accountInfo.business_profile || {}
        accountInfo.business_profile[property] = req.body[pseudonym]
      } else if (field.startsWith('individual.address_kanji.') || field.startsWith('company.address_kanji.')) {
        if (stripeAccount.stripeObject.business_type === 'company') {
          accountInfo.company = accountInfo.company || {}
          accountInfo.company.address_kanji = accountInfo.company.address_kanji || {}
          accountInfo.company.address_kanji[property] = req.body[pseudonym]
        } else {
          accountInfo.individual = accountInfo.individual || {}
          accountInfo.individual.address_kanji = accountInfo.individual.address_kanji || {}
          accountInfo.individual.address_kanji[property] = req.body[pseudonym]
        }
      } else if (field.startsWith('individual.address_kana.') || field.startsWith('company.address_kana.')) {
        if (stripeAccount.stripeObject.business_type === 'company') {
          accountInfo.company = accountInfo.company || {}
          accountInfo.company.address_kana = accountInfo.company.address_kana || {}
          accountInfo.company.address_kana[property] = req.body[pseudonym]
        } else {
          accountInfo.individual = accountInfo.individual || {}
          accountInfo.individual.address_kana = accountInfo.individual.address_kana || {}
          accountInfo.individual.address_kana[property] = req.body[pseudonym]
        }
      } else if (field.startsWith('individual.address.') || field.startsWith('company.address.')) {
        if (stripeAccount.stripeObject.business_type === 'company') {
          accountInfo.company = accountInfo.company || {}
          accountInfo.company.address = accountInfo.company.address || {}
          accountInfo.company.address[property] = req.body[pseudonym]
        } else {
          accountInfo.individual = accountInfo.individual || {}
          accountInfo.individual.address = accountInfo.individual.address || {}
          accountInfo.individual.address[property] = req.body[pseudonym]
        }
      } else if (field.startsWith('individual.dob.')) {
        accountInfo.individual = accountInfo.individual || {}
        accountInfo.individual.dob = accountInfo.individual.dob || {}
        accountInfo.individual.dob[property] = req.body[pseudonym]
      } else if (field.startsWith('company.')) {
        if (field === 'company.tax_id' && req.body[pseudonym].length < 6) {
          throw new Error('invalid-company_tax_id')
        }
        if (field === 'company.business_vat_id_number' && !req.body[pseudonym].length) {
          throw new Error('invalid-company_business_vat_id_number')
        }
        if (field === 'company.registration_number' && !req.body[pseudonym].length) {
          throw new Error('invalid-company_registration_number')
        }
        accountInfo.company = accountInfo.company || {}
        accountInfo.company[property] = req.body[pseudonym]
      } else if (field.startsWith('individual.')) {
        if (field === 'individual.id_number' && req.body[pseudonym] && req.body[pseudonym].length < 7) {
          throw new Error('invalid-individual_id_number')
        }
        if (field === 'individual.ssn_last_4' && req.body[pseudonym] && req.body[pseudonym].length !== 4) {
          throw new Error('invalid-individual_ssn_last_4')
        }
        if (field === 'individual.gender' && req.body[pseudonym] && req.body[pseudonym] !== 'male' && req.body[pseudonym] !== 'female') {
          throw new Error('invalid-individual_gender')
        }
        accountInfo.individual = accountInfo.individual || {}
        accountInfo.individual[property] = req.body[pseudonym]
      }
    }
    // these fields are optional but may not be represented in requirements
    if (stripeAccount.stripeObject.business_type === 'company') {
      if (req.body.company_address_country && req.body.company_address_country.length) {
        if (!connect.countryNameIndex[req.body.company_address_country]) {
          throw new Error('invalid-company_address_country')
        }
        accountInfo.company = accountInfo.company || {}
        accountInfo.company.address = accountInfo.company.address || {}
        accountInfo.company.address.country = req.body.company_address_country
      }
      if (req.body.company_address_line2) {
        accountInfo.company = accountInfo.company || {}
        accountInfo.company.address = accountInfo.company.address || {}
        accountInfo.company.address.line2 = req.body.company_address_line2
      }
      if (req.body.company_address_state && req.body.company_address_state.length) {
        const states = connect.countryDivisions[req.body.company_address_country || stripeAccount.stripeObject.country]
        let found
        for (const state of states) {
          found = state.value === req.body.company_address_state
          if (found) {
            break
          }
        }
        if (!found) {
          throw new Error('invalid-company_address_state')
        }
        accountInfo.company = accountInfo.company || {}
        accountInfo.company.address = accountInfo.company.address || {}
        accountInfo.company.address.state = req.body.company_address_state
      }
    } else {
      if (req.body.individual_address_country && req.body.individual_address_country.length) {
        if (!connect.countryNameIndex[req.body.individual_address_country]) {
          throw new Error('invalid-individual_address_country')
        }
        accountInfo.individual = accountInfo.individual || {}
        accountInfo.individual.address = accountInfo.individual.address || {}
        accountInfo.individual.address.country = req.body.individual_address_country
      }
      if (req.body.individual_address_line2) {
        accountInfo.individual = accountInfo.individual || {}
        accountInfo.individual.address = accountInfo.individual.address || {}
        accountInfo.individual.address.line2 = req.body.individual_address_line2
      }
      if (req.body.individual_address_state && req.body.individual_address_state.length) {
        const states = connect.countryDivisions[req.body.individual_address_country || stripeAccount.stripeObject.country]
        let found
        for (const state of states) {
          found = state.value === req.body.individual_address_state
          if (found) {
            break
          }
        }
        if (!found) {
          throw new Error('invalid-individual_address_state')
        }
        accountInfo.individual = accountInfo.individual || {}
        accountInfo.individual.address = accountInfo.individual.address || {}
        accountInfo.individual.address.state = req.body.individual_address_state
      }
    }
    // }
    try {
      const stripeAccountNow = await stripeCache.execute('accounts', 'update', req.query.stripeid, accountInfo, req.stripeKey)
      await connect.Storage.StripeAccount.update({
        stripeObject: stripeAccountNow
      }, {
        where: {
          stripeid: req.query.stripeid,
          appid: req.appid || global.appid
        }
      })
      await dashboard.StorageCache.remove(req.query.stripeid)
      return global.api.user.connect.StripeAccount.get(req)
    } catch (error) {
      if (error.message.startsWith('invalid-')) {
        throw new Error(error.message.split('.').join('_'))
      }
      throw error
    }
  }
}
