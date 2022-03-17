const connect = require('../../../../index.js')
const dashboard = require('@layeredapps/dashboard')
const formatStripeObject = require('../../../stripe-object.js')

module.exports = {
  before: beforeRequest,
  get: renderPage
}

async function beforeRequest (req) {
  const stripeAccounts = await global.api.administrator.connect.StripeAccounts.get(req)
  for (const i in stripeAccounts) {
    const stripeAccount = formatStripeObject(stripeAccounts[i])
    stripeAccounts[i] = stripeAccount
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
  }
  req.data = { stripeAccounts }
}

async function renderPage (req, res) {
  const doc = dashboard.HTML.parse(req.html || req.route.html)
  const removeElements = []
  if (req.data.stripeAccounts && req.data.stripeAccounts.length) {
    dashboard.HTML.renderTable(doc, req.data.stripeAccounts, 'stripe-account-row', 'stripe-accounts-table')
    for (const stripeAccount of req.data.stripeAccounts) {
      if (stripeAccount.business_type === 'individual') {
        removeElements.push(`business-name-${stripeAccount.id}`)
        if (stripeAccount.individual.first_name) {
          removeElements.push(`blank-name-${stripeAccount.id}`)
        } else {
          removeElements.push(`individual-name-${stripeAccount.id}`)
        }
      } else {
        removeElements.push(`individual-name-${stripeAccount.id}`)
        if (stripeAccount.company.name) {
          removeElements.push(`blank-name-${stripeAccount.id}`)
        } else {
          removeElements.push(`business-name-${stripeAccount.id}`)
        }
      }
      if (stripeAccount.statusMessage) {
        dashboard.HTML.renderTemplate(doc, null, stripeAccount.statusMessage, `account-status-${stripeAccount.id}`)
      }
      const mccCodes = connect.getMerchantCategoryCodes(req.language)
      const mccDescription = doc.getElementById(`mcc-description-${stripeAccount.id}`)
      for (const code of mccCodes) {
        if (code.code === stripeAccount.business_profile.mcc) {
          mccDescription.innerHTML = code.description
          break
        }
      }
    }
    removeElements.push('no-stripe-accounts')
  } else {
    removeElements.push('stripe-accounts-table')
  }
  for (const id of removeElements) {
    const element = doc.getElementById(id)
    element.parentNode.removeChild(element)
  }
  return dashboard.Response.end(req, res, doc)
}
