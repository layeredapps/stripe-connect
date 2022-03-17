const connect = require('../../../../index.js')
const dashboard = require('@layeredapps/dashboard')
const formatStripeObject = require('../../../stripe-object.js')

module.exports = {
  before: beforeRequest,
  get: renderPage
}

async function beforeRequest (req) {
  if (!req.query || !req.query.stripeid) {
    throw new Error('invalid-stripeid')
  }
  const stripeAccountRaw = await global.api.administrator.connect.StripeAccount.get(req)
  const stripeAccount = formatStripeObject(stripeAccountRaw)
  stripeAccount.createdAtFormatted = dashboard.Format.date(stripeAccount.created)
  stripeAccount.individual = stripeAccount.individual || {}
  stripeAccount.company = stripeAccount.company || {}
  if (stripeAccount.submittedAt) {
    stripeAccount.submittedAtFormatted = dashboard.Format.date(stripeAccount.submittedAt)
  } else {
    stripeAccount.submittedAtFormatted = ''
  }
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
  req.data = { stripeAccount }
}

async function renderPage (req, res) {
  const doc = dashboard.HTML.parse(req.html || req.route.html, req.data.stripeAccount, 'stripeAccount')
  dashboard.HTML.renderTemplate(doc, null, req.data.stripeAccount.statusMessage, 'account-status')
  const mccCodes = connect.getMerchantCategoryCodes(req.language)
  const mccDescription = doc.getElementById('mcc-description')
  for (const code of mccCodes) {
    if (code.code === req.data.stripeAccount.business_profile.mcc) {
      mccDescription.innerHTML = code.description
      break
    }
  }
  const removeElements = []
  if (req.data.stripeAccount.business_type === 'individual') {
    removeElements.push('business-name')
    if (req.data.stripeAccount.individual.first_name) {
      removeElements.push('blank-name')
    } else {
      removeElements.push('individual-name')
    }
  } else {
    removeElements.push('individual-name')
    if (req.data.stripeAccount.company.name) {
      removeElements.push('blank-name')
    } else {
      removeElements.push('business-name')
    }
  }
  for (const id of removeElements) {
    const element = doc.getElementById(id)
    element.parentNode.removeChild(element)
  }
  return dashboard.Response.end(req, res, doc)
}
