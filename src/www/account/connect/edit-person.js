const connect = require('../../../../index.js')
const dashboard = require('@layeredapps/dashboard')
const formatStripeObject = require('../../../stripe-object.js')

module.exports = {
  before: beforeRequest,
  get: renderPage,
  post: submitForm
}

async function beforeRequest (req) {
  if (!req.query || !req.query.personid) {
    req.error = 'invalid-personid'
    req.removeContent = true
    req.data = {
      person: {
        personid: ''
      }
    }
    return
  }
  let personRaw
  try {
    personRaw = await global.api.user.connect.Person.get(req)
  } catch (error) {
    req.removeContents = true
    req.data = {
      person: {
        personid: ''
      }
    }
    if (error.message === 'invalid-personid' || error.message === 'invalid-account') {
      req.error = error.message
    } else {
      req.error = 'unknown-error'
    }
    return
  }
  const person = formatStripeObject(personRaw)
  if (!person.requirements.currently_due.length &&
      !person.requirements.eventually_due.length) {
    req.error = 'no-required-information'
    req.removeContent = true
    return
  }
  req.query.stripeid = person.account
  const stripeAccountRaw = await global.api.user.connect.StripeAccount.get(req)
  const stripeAccount = formatStripeObject(stripeAccountRaw)
  if (!stripeAccount) {
    req.error = 'invalid-stripeid'
    req.removeContent = true
    return
  }
  req.data = { stripeAccount, person }
}

async function renderPage (req, res, messageTemplate) {
  messageTemplate = req.error || messageTemplate || (req.query ? req.query.message : null)
  const doc = dashboard.HTML.parse(req.html || req.route.html, req.data.person, 'person')
  const removeElements = []
  if (global.stripeJS !== 3) {
    removeElements.push('stripe-v3', 'connect-v3', 'handler-v3')
  } else {
    const stripePublishableKey = doc.getElementById('stripe-publishable-key')
    stripePublishableKey.setAttribute('value', global.stripePublishableKey)
    res.setHeader('content-security-policy',
      'default-src * \'unsafe-inline\'; ' +
    `style-src https://uploads.stripe.com/ https://m.stripe.com/ https://m.stripe.network/ https://js.stripe.com/v3/ https://js.stripe.com/v2/ ${global.dashboardServer}/public/ 'unsafe-inline'; ` +
    `script-src * https://uploads.stripe.com/ https://q.stripe.com/ https://m.stripe.com/ https://m.stripe.network/ https://js.stripe.com/v3/ https://js.stripe.com/v2/ ${global.dashboardServer}/public/ 'unsafe-eval' 'unsafe-inline'; ` +
    'frame-src * https://uploads.stripe.com/ https://m.stripe.com/ https://m.stripe.network/ https://js.stripe.com/ \'unsafe-inline\'; ' +
    'connect-src https://uploads.stripe.com/ https://m.stripe.com/ https://m.stripe.network/ https://js.stripe.com/ \'unsafe-inline\'; ')
  }
  if (messageTemplate) {
    dashboard.HTML.renderTemplate(doc, null, messageTemplate, 'message-container')
    if (req.removeContent) {
      removeElements.push('form-container')
      for (const id of removeElements) {
        const element = doc.getElementById(id)
        element.parentNode.removeChild(element)
      }
      return dashboard.Response.end(req, res, doc)
    }
  }
  const requirements = req.data.person.requirements.currently_due.concat(req.data.person.requirements.eventually_due)
  let requiresAddress = false
  for (const requirement of requirements) {
    requiresAddress = requirement.startsWith('address')
    if (requiresAddress) {
      break
    }
  }
  if (req.data.stripeAccount.country !== 'JP') {
    removeElements.push(
      'gender-container',
      'kanji-address-container',
      'kana-address-container',
      'kana-information-container',
      'kanji-information-container')
  } else if (!requiresAddress) {
    removeElements.push('address-container')
  }
  if (!requiresAddress && removeElements.indexOf('address-container') === -1) {
    removeElements.push('address-container')
  } else {
    if (requirements.indexOf('address.state') > -1) {
      const personalStates = connect.countryDivisions[req.data.stripeAccount.country]
      dashboard.HTML.renderList(doc, personalStates, 'state-option', 'address_state')
    } else if (removeElements.indexOf('address-container') === -1) {
      removeElements.push('address_state-container')
    }
    if (requirements.indexOf('address.line1') === -1) {
      removeElements.push('address_line1-container', 'address.line2-container')
    }
    if (requirements.indexOf('address.city') === -1) {
      removeElements.push('address_city-container')
    }
    if (requirements.indexOf('address.country') === -1) {
      removeElements.push('address_country-container')
    }
    if (requirements.indexOf('address.postal_code') === -1) {
      removeElements.push('address_postal_code-container')
    }
  }
  if (requirements.indexOf('first_name') === -1) {
    removeElements.push('name-container')
  }
  if (requirements.indexOf('id_number') === -1) {
    removeElements.push('id_number-container')
  }
  if (requirements.indexOf('ssn_last_4') === -1) {
    removeElements.push('ssn_last_4-container')
  }
  if (requirements.indexOf('phone') === -1) {
    removeElements.push('phone-container')
  }
  if (requirements.indexOf('email') === -1) {
    removeElements.push('email-container')
  }
  if (requirements.indexOf('dob.day') === -1) {
    removeElements.push('dob-container')
  }
  if (requirements.indexOf('verification.document') === -1) {
    removeElements.push('verification_document-container')
  }
  if (requirements.indexOf('verification.additional_document') === -1) {
    removeElements.push('verification_additional_document-container')
  }
  if (req.method === 'GET') {
    for (const field of req.data.person.requirements.currently_due) {
      const posted = field.split('.').join('_')
      const element = doc.getElementById(posted)
      if (!element) {
        continue
      }
    }
    doc.getElementById('relationship_title').setAttribute('value', req.data.person.relationship.title)
  } else if (req.body) {
    for (const field in req.body) {
      const element = doc.getElementById(field)
      if (!element) {
        continue
      }
      if (element.tag === 'input') {
        element.setAttribute('value', dashboard.Format.replaceQuotes(req.body[field] || ''))
      } else if (element.tag === 'select') {
        dashboard.HTML.setSelectedOptionByValue(doc, element, req.body[field] || '')
      }
    }
  }
  for (const id of removeElements) {
    const element = doc.getElementById(id)
    if (!element || !element.parentNode) {
      continue
    }
    element.parentNode.removeChild(element)
  }
  return dashboard.Response.end(req, res, doc)
}

async function submitForm (req, res) {
  if (!req.body || req.body.refresh === 'true') {
    return renderPage(req, res)
  }
  if (req.query && req.query.message === 'success') {
    return renderPage(req, res)
  }
  if (global.stripeJS !== 3) {
    const requirements = req.data.person.requirements.currently_due.concat(req.data.person.requirements.eventually_due)
    for (const field of req.data.person.requirements.currently_due) {
      const pseudonym = field.split('.').join('_')
      if (!req.body[pseudonym]) {
        if (field === 'address.line2' ||
            field === 'relationship.title' ||
            field === 'relationship.executive' ||
            field === 'relationship.director' ||
            field === 'relationship.owner' ||
            field === 'verification.document' ||
            field === 'verification.additional_document') {
          continue
        }
        return renderPage(req, res, `invalid-${pseudonym}`)
      }
      req.body[field] = req.body[pseudonym]
    }
    if (requirements.indexOf('verification.document') > -1) {
      if (!req.uploads || (
        !req.uploads.verification_document_front &&
          !req.body.verification_document_front)) {
        return renderPage(req, res, 'invalid-verification_document_front')
      }
      if (!req.uploads || (
        !req.uploads.verification_document_back &&
        !req.body.verification_document_back)) {
        return renderPage(req, res, 'invalid-verification_document_back')
      }
    }
    if (requirements.indexOf('verification.additional_document') > -1) {
      if (!req.uploads || (
        !req.uploads.verification_additional_document_front &&
        !req.body.verification_additional_document_front)) {
        return renderPage(req, res, 'invalid-verification_additional_document_front')
      }
      if (!req.uploads || (
        !req.uploads.verification_additional_document_back &&
        !req.body.verification_additional_document_back)) {
        return renderPage(req, res, 'invalid-verification_additional_document_back')
      }
    }
  }
  try {
    await global.api.user.connect.UpdatePerson.patch(req)
  } catch (error) {
    if (error.message.startsWith('invalid-')) {
      return renderPage(req, res, error.message)
    }
    return renderPage(req, res, error.message)
  }
  if (req.query['return-url']) {
    return dashboard.Response.redirect(req, res, req.query['return-url'])
  } else {
    res.writeHead(302, {
      location: `/account/connect/person?personid=${req.query.personid}`
    })
    return res.end()
  }
}
