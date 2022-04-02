const connect = require('../../../../../index.js')
const stripeCache = require('../../../../stripe-cache.js')
const dashboard = require('@layeredapps/dashboard')

module.exports = {
  patch: async (req) => {
    if (!req.query || !req.query.personid) {
      throw new Error('invalid-personid')
    }
    const person = await global.api.user.connect.Person.get(req)
    if (!person) {
      throw new Error('invalid-personid')
    }
    req.query.stripeid = person.stripeid
    const stripeAccount = await global.api.user.connect.StripeAccount.get(req)
    const requirements = person.stripeObject.requirements.currently_due.concat(person.stripeObject.requirements.eventually_due)
    const accountRequirements = stripeAccount.stripeObject.requirements.currently_due.concat(stripeAccount.stripeObject.requirements.eventually_due)
    for (const requirement of accountRequirements) {
      if (requirement.startsWith(person.personid)) {
        const trimmed = requirement.substring(requirement.indexOf('.') + 1)
        if (requirements.indexOf(trimmed) === -1) {
          requirements.push(trimmed)
        }
      }
    }
    if (!requirements.length) {
      throw new Error('invalid-person')
    }
    req.body = req.body || {}
    const updateInfo = {}
    if (global.stripeJS === 3 && req.uploads && Object.keys(req.uploads).length && !req.body.token) {
      throw new Error('invalid-token')
    }
    if (global.stripeJS === 3 && req.body.token) {
      updateInfo.person_token = req.body.token
      try {
        await dashboard.StorageCache.remove(req.query.personid)
        const personNow = await stripeCache.execute('accounts', 'updatePerson', person.stripeid, person.personid, updateInfo, req.stripeKey)
        await connect.Storage.Person.update({
          stripeObject: personNow,
          tokenUpdate: new Date()
        }, {
          where: {
            personid: req.query.personid
          }
        })
      } catch (error) {
        if (error.message.startsWith('invalid-')) {
          throw new Error(error.message.split('.').join('_'))
        }
        throw error
      }
      delete (updateInfo.person_token)
    }
    let validateDOB = false
    if (req.body.dob_day) {
      validateDOB = true
      try {
        const day = parseInt(req.body.dob_day, 10)
        if (!day || day < 1 || day > 31) {
          throw new Error('invalid-dob_day')
        }
      } catch (s) {
        throw new Error('invalid-dob_day')
      }
    }
    if (req.body.dob_month) {
      validateDOB = true
      try {
        const month = parseInt(req.body.dob_month, 10)
        if (!month || month < 1 || month > 12) {
          throw new Error('invalid-dob_month')
        }
      } catch (s) {
        throw new Error('invalid-dob_month')
      }
    }
    if (req.body.dob_year) {
      validateDOB = true
      try {
        const year = parseInt(req.body.dob_year, 10)
        const now = new Date().getFullYear()
        if (!year || year < now - 120 || year > now - 18) {
          throw new Error('invalid-dob_year')
        }
      } catch (s) {
        throw new Error('invalid-dob_year')
      }
    }
    if (validateDOB) {
      if (!req.body.dob_day) {
        throw new Error('invalid-dob_day')
      }
      if (!req.body.dob_month) {
        throw new Error('invalid-dob_month')
      }
      if (!req.body.dob_year) {
        throw new Error('invalid-dob_year')
      }
      try {
        Date.parse(`${req.body.dob_year}/${req.body.dob_month}/${req.body.dob_day}`)
      } catch (error) {
        throw new Error('invalid-dob_day')
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
        updateInfo.verification = updateInfo.verification || {}
        const side = key.split('_').pop()
        if (key.indexOf('_additional_document') > -1) {
          updateInfo.verification.additional_document = updateInfo.verification.additional_document || {}
          updateInfo.verification.additional_document[side] = file.id
        } else if (key.indexOf('_document') > -1) {
          updateInfo.verification.document = updateInfo.verification.document || {}
          updateInfo.verification.document[side] = file.id
        }
      }
    }
    for (const field of requirements) {
      const pseudonym = field.split('.').join('_')
      if (!req.body[pseudonym]) {
        continue
      }
      if (field.startsWith('dob.')) {
        const property = field.substring('dob.'.length)
        updateInfo.dob = updateInfo.dob || {}
        updateInfo.dob[property] = req.body[pseudonym]
      } else if (field.startsWith('address.kanji.')) {
        const property = field.substring('address.kanji.'.length)
        updateInfo.address.kanji = updateInfo.address.kanji || {}
        updateInfo.address.kanji[property] = req.body[pseudonym]
      } else if (field.startsWith('address.kana.')) {
        const property = field.substring('address.kana.'.length)
        updateInfo.address.kana = updateInfo.address.kana || {}
        updateInfo.address.kana[property] = req.body[pseudonym]
      } else if (field.startsWith('address.')) {
        const property = field.substring('address.'.length)
        updateInfo.address = updateInfo.address || {}
        updateInfo.address[property] = req.body[pseudonym]
      } else if (field.startsWith('verification.document.')) {
        const property = field.substring('verification.document'.length)
        updateInfo.verification = updateInfo.verification || {}
        updateInfo.verification.document = updateInfo.verification.document || {}
        updateInfo.verification.document[property] = req.body[pseudonym]
      } else if (field.startsWith('verification.additional_document.')) {
        const property = field.substring('verification.additional_document'.length)
        updateInfo.verification = updateInfo.verification || {}
        updateInfo.verification.additional_document = updateInfo.verification.additional_document || {}
        updateInfo.verification.additional_document[property] = req.body[pseudonym]
      } else {
        updateInfo[field] = req.body[pseudonym]
      }
    }
    // TODO: these fields are optional but not represented in requirements
    // so when Stripe updates to have something like an 'optionally_due' array
    // the manual checks can be removed
    if (req.body.relationship_title) {
      updateInfo.relationship = updateInfo.relationship || {}
      updateInfo.relationship.title = req.body.relationship_title
    }
    if (req.body.relationship_executive) {
      updateInfo.relationship = updateInfo.relationship || {}
      updateInfo.relationship.executive = true
    }
    if (req.body.relationship_director) {
      updateInfo.relationship = updateInfo.relationship || {}
      updateInfo.relationship.director = true
    }
    if (req.body.relationship_owner) {
      updateInfo.relationship = updateInfo.relationship || {}
      updateInfo.relationship.owner = true
    }
    if (req.body.relationship_percent_ownership) {
      try {
        const percent = parseFloat(req.body.relationship_percent_ownership, 10)
        if ((!percent && percent !== 0) || percent > 100 || percent < 0) {
          throw new Error('invalid-relationship_percent_ownership')
        }
      } catch (s) {
        throw new Error('invalid-relationship_percent_ownership')
      }
      updateInfo.relationship = updateInfo.relationship || {}
      updateInfo.relationship.percent_ownership = req.body.relationship_percent_ownership
    }
    if (req.body.address_line2) {
      updateInfo.address = updateInfo.address || {}
      updateInfo.address.line2 = req.body.address_line2
    }
    if (req.body.address_country && req.body.address_country.length) {
      if (!connect.countryNameIndex[req.body.address_country]) {
        throw new Error('invalid-address_country')
      }
      updateInfo.address = updateInfo.address || {}
      updateInfo.address.country = req.body.address_country
    }
    if (req.body.address_state && req.body.address_state.length) {
      const states = connect.countryDivisions[req.body.address_country || stripeAccount.stripeObject.country]
      let found
      for (const state of states) {
        found = state.value === req.body.address_state
        if (found) {
          break
        }
      }
      if (!found) {
        throw new Error('invalid-address_state')
      }
      updateInfo.address = updateInfo.address || {}
      updateInfo.address.state = req.body.address_state
    }
    if (req.body.address_postal_code) {
      updateInfo.address = updateInfo.address || {}
      updateInfo.address.postal_code = req.body.address_postal_code
    }
    if (req.body.email) {
      if (req.body.email.indexOf('@') === -1 || req.body.email.indexOf('@') > req.body.email.lastIndexOf('.')) {
        throw new Error('invalid-email')
      }
      updateInfo.email = req.body.email
    }
    if (req.body.id_number && req.body.id_number.length < 5) {
      throw new Error('invalid-id_number')
    }
    if (req.body.ssn_last_4 && req.body.ssn_last_4.length < 4) {
      throw new Error('invalid-ssn_last_4')
    }
    try {
      const personNow = await stripeCache.execute('accounts', 'updatePerson', person.stripeid, person.personid, updateInfo, req.stripeKey)
      await connect.Storage.Person.update({
        stripeObject: personNow
      }, {
        where: {
          personid: req.query.personid
        }
      })
    } catch (error) {
      if (error.message.startsWith('invalid-')) {
        throw new Error(error.message.split('.').join('_'))
      }
      throw error
    }
    await dashboard.StorageCache.remove(req.query.personid)
    return global.api.user.connect.Person.get(req)
  }
}
