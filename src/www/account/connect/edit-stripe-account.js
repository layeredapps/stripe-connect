const connect = require('../../../../index.js')
const dashboard = require('@layeredapps/dashboard')
const navbar = require('./navbar-stripe-account.js')
const formatStripeObject = require('../../../stripe-object.js')

module.exports = {
  before: beforeRequest,
  get: renderPage,
  post: submitForm
}

async function beforeRequest (req) {
  if (!req.query || !req.query.stripeid) {
    req.removeContents = true
    req.error = 'invalid-stripeid'
    return
  }
  if (req.query.message === 'success') {
    req.removeContents = true
    req.data = {
      stripeAccount: {
        id: req.query.stripeid,
        stripeid: req.query.stripeid
      }
    }
    return
  }
  let stripeAccountRaw
  try {
    stripeAccountRaw = await global.api.user.connect.StripeAccount.get(req)
  } catch (error) {
    req.removeContents = true
    req.data = {
      stripeAccount: {
        stripeid: ''
      }
    }
    if (error.message === 'invalid-stripeid' || error.message === 'invalid-account') {
      req.error = error.message
    } else {
      req.error = 'unknown-error'
    }
    return
  }
  const stripeAccount = formatStripeObject(stripeAccountRaw)
  stripeAccount.stripePublishableKey = global.stripePublishableKey
  if (!stripeAccount.requirements.currently_due.length &&
      !stripeAccount.requirements.eventually_due.length) {
    req.error = 'no-required-information'
    req.removeContent = true
    return
  }
  req.data = { stripeAccount }
}

async function renderPage (req, res, messageTemplate) {
  messageTemplate = req.error || messageTemplate || (req.query ? req.query.message : null)
  const doc = dashboard.HTML.parse(req.html || req.route.html, req.data.stripeAccount, 'stripeAccount')
  navbar.setup(doc, req.data.stripeAccount)
  const removeElements = []
  if (global.stripeJS !== 3) {
    removeElements.push('stripe-v3', 'connect-v3', 'handler-v3')
  } else {
    const stripePublishableKey = doc.getElementById('stripe-publishable-key')
    stripePublishableKey.setAttribute('value', global.stripePublishableKey)
    res.setHeader('content-security-policy',
      'default-src * \'unsafe-inline\'; ' +
    `style-src https://uploads.stripe.com/v1/files https://m.stripe.com/ https://m.stripe.network/ https://js.stripe.com/v3/ https://js.stripe.com/v2/ ${global.dashboardServer}/public/ 'unsafe-inline'; ` +
    `script-src * https://uploads.stripe.com/v1/files https://q.stripe.com/ https://m.stripe.com/ https://m.stripe.network/ https://js.stripe.com/v3/ https://js.stripe.com/v2/ ${global.dashboardServer}/public/ 'unsafe-inline' 'unsafe-eval'; ` +
    'frame-src * https://uploads.stripe.com/v1/files https://m.stripe.com/ https://m.stripe.network/ https://js.stripe.com/ \'unsafe-inline\'; ' +
    'connect-src https://uploads.stripe.com/v1/files https://m.stripe.com/ https://m.stripe.network/ https://js.stripe.com/ \'unsafe-inline\'; ')
  }
  if (messageTemplate) {
    dashboard.HTML.renderTemplate(doc, null, messageTemplate, 'message-container')
    if (req.removeContents) {
      removeElements.push('submit-form')
      for (const id of removeElements) {
        const element = doc.getElementById(id)
        element.parentNode.removeChild(element)
      }
      return dashboard.Response.end(req, res, doc)
    }
  }
  const requirements = req.data.stripeAccount.requirements.currently_due.concat(req.data.stripeAccount.requirements.eventually_due)
  let hasRequirements = false
  if (req.data.stripeAccount.business_type === 'individual') {
    if (req.data.stripeAccount.country !== 'JP') {
      removeElements.push(
        'individual-kana-container',
        'individual-kanji-container',
        'individual-address-kana-kanji-container',
        'individual-address-kana-kanji-container')
    }
    removeElements.push('company-address-container', 'company-container')
    if (requirements.indexOf('individual.first_name') === -1) {
      removeElements.push('individual-first_name-container')
    } else {
      hasRequirements = true
    }
    if (requirements.indexOf('individual.last_name') === -1) {
      removeElements.push('individual-last_name-container')
    } else {
      hasRequirements = true
    }
    if (requirements.indexOf('individual.phone') === -1) {
      removeElements.push('individual-phone-container')
    } else {
      hasRequirements = true
    }
    if (requirements.indexOf('individual.email') === -1) {
      removeElements.push('individual-email-container')
    } else {
      hasRequirements = true
    }
    if (requirements.indexOf('individual.dob.day') === -1) {
      removeElements.push('individual-dob-container')
    } else {
      hasRequirements = true
    }
    if (requirements.indexOf('individual.gender') === -1) {
      removeElements.push('individual-gender-container')
    } else {
      hasRequirements = true
    }
    if (requirements.indexOf('individual.id_number') === -1) {
      removeElements.push('individual-id_number-container')
    } else {
      hasRequirements = true
    }
    if (requirements.indexOf('individual.ssn_last_4') === -1) {
      removeElements.push('individual-ssn_last_4-container')
    } else {
      hasRequirements = true
    }
    if (requirements.indexOf('individual.verification.document') === -1) {
      removeElements.push('individual-document-container')
    } else {
      hasRequirements = true
    }
    if (requirements.indexOf('individual.verification.additional_document') === -1) {
      removeElements.push('individual-additional-document-container')
    } else {
      hasRequirements = true
    }
  } else {
    if (req.data.stripeAccount.country !== 'JP') {
      removeElements.push(
        'company-kana-kanji-container',
        'company-address-kana-container',
        'company-address-kanji-container')
    }
    removeElements.push('individual-container')
    if (requirements.indexOf('company.phone') === -1) {
      removeElements.push('company-phone-container')
    } else {
      hasRequirements = true
    }
    if (requirements.indexOf('company.tax_id') === -1) {
      removeElements.push('company-tax_id-container')
    } else {
      hasRequirements = true
    }
    if (requirements.indexOf('company.registration_number') === -1) {
      removeElements.push('company-registration_number-container')
    } else {
      hasRequirements = true
    }
  }
  let requireAddress = false
  for (const field of requirements) {
    requireAddress = field.indexOf(`${req.data.stripeAccount.business_type}.address`) > -1
    if (requireAddress) {
      break
    }
  }
  if (!requireAddress) {
    removeElements.push(`${req.data.stripeAccount.business_type}-address-container`)
  } else {
    hasRequirements = true
    if (requirements.indexOf(`${req.data.stripeAccount.business_type}.address.line1`) === -1) {
      removeElements.push(
        `${req.data.stripeAccount.business_type}-address_line1-container`,
        `${req.data.stripeAccount.business_type}-address_line2-container`
      )
    }
    if (requirements.indexOf(`${req.data.stripeAccount.business_type}.address.city`) === -1) {
      removeElements.push(`${req.data.stripeAccount.business_type}-address_city-container`)
    }
    if (requirements.indexOf(`${req.data.stripeAccount.business_type}.address.state`) === -1) {
      removeElements.push(`${req.data.stripeAccount.business_type}-address_state-container`)
    }
    if (requirements.indexOf(`${req.data.stripeAccount.business_type}.address.postal_code`) === -1) {
      removeElements.push(`${req.data.stripeAccount.business_type}-address_postal_code-container`)
    }
  }
  if (requirements.indexOf('business_profile.mcc') > -1) {
    hasRequirements = true
    const mccList = connect.getMerchantCategoryCodes(req.language)
    dashboard.HTML.renderList(doc, mccList, 'mcc-option', 'business_profile_mcc')
  } else {
    removeElements.push('business_profile_mcc-container')
  }
  if (requirements.indexOf('business_profile.url') === -1) {
    removeElements.push('business_profile_url-container')
  } else {
    hasRequirements = true
  }
  if (requirements.indexOf(`${req.data.stripeAccount.business_type}.address.state`) > -1) {
    hasRequirements = true
    const personalStates = connect.countryDivisions[req.data.stripeAccount.country]
    dashboard.HTML.renderList(doc, personalStates, 'state-option', `${req.data.stripeAccount.business_type}_address_state`)
  }
  if (!hasRequirements) {
    removeElements.push('submit-form')
    dashboard.HTML.renderTemplate(doc, null, 'no-required-information', 'message-container')
  } else {
    if (req.body) {
      for (const field in req.body) {
        const element = doc.getElementById(field)
        if (!element) {
          continue
        }
        if (element.tag === 'input') {
          element.setAttribute('value', dashboard.Format.replaceQuotes(req.body[field] || ''))
        } else if (element.tag === 'select') {
          dashboard.HTML.setSelectedOptionByValue(doc, field, req.body[field] || '')
        }
      }
    }
  }
  for (const id of removeElements) {
    const element = doc.getElementById(id)
    if (!element) {
      console.log('no element', id, removeElements)
    }
    element.parentNode.removeChild(element)
    if (id === 'submit-form') {
      break
    }
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
  const requirements = req.data.stripeAccount.requirements.currently_due.concat(req.data.stripeAccount.requirements.eventually_due)
  for (const field of requirements) {
    const pseudonym = field.split('.').join('_')
    if (!req.body[pseudonym]) {
      if (field === 'address.line2' ||
        field === 'company.verification.document' ||
        field === 'individual.verification.document' ||
        field === 'individual.verification.additional_document' ||
        field === 'external_account' ||
        field.startsWith('relationship.') ||
        field.startsWith('tos_acceptance.') ||
        field.startsWith('company.owners') ||
        field.startsWith('company.directors') ||
        field.startsWith('company.executives') ||
        field.startsWith('company.representative') ||
        field.startsWith('owners') ||
        field.startsWith('directors') ||
        field.startsWith('executives') ||
        field.startsWith('representative') ||
        field.startsWith('person_') ||
        (field === 'business_profile.url' && req.body.business_profile_product_description) ||
        (field === 'business_profile.product_description' && req.body.business_profile_url)) {
        continue
      }
      if (field === 'business_profile.product_description' && !req.body.business_profile_url) {
        return renderPage(req, res, 'invalid-business_profile_url')
      }
      return renderPage(req, res, `invalid-${pseudonym}`)
    }
  }
  if (requirements.indexOf('company.verification.document') > -1) {
    if (!req.uploads || !req.uploads.verification_document_front) {
      return renderPage(req, res, 'invalid-verification_document_front')
    }
    if (!req.uploads || !req.uploads.verification_document_back) {
      return renderPage(req, res, 'invalid-verification_document_back')
    }
  }
  if (requirements.indexOf('individual_verification.document') > -1) {
    if (!req.uploads || !req.uploads.verification_document_front) {
      return renderPage(req, res, 'invalid-verification_document_front')
    }
    if (!req.uploads || !req.uploads.verification_document_back) {
      return renderPage(req, res, 'invalid-verification_document_back')
    }
  }
  if (requirements.indexOf('individual_verification.additional_document') > -1) {
    if (!req.uploads || !req.uploads.verification_additional_document_front) {
      return renderPage(req, res, 'invalid-verification_additional_document_front')
    }
    if (!req.uploads || !req.uploads.verification_additional_document_back) {
      return renderPage(req, res, 'invalid-verification_additional_document_back')
    }
  }
  try {
    await global.api.user.connect.UpdateStripeAccount.patch(req)
  } catch (error) {
    if (error.message.startsWith('invalid-')) {
      return renderPage(req, res, error.message.split('.').join('_'))
    }
    return renderPage(req, res, error.message)
  }
  if (req.query['return-url']) {
    return dashboard.Response.redirect(req, res, req.query['return-url'])
  } else {
    res.writeHead(302, {
      location: `${req.urlPath}?stripeid=${req.query.stripeid}&message=success`
    })
    return res.end()
  }
}
