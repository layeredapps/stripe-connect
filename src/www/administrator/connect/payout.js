const dashboard = require('@layeredapps/dashboard')
const formatStripeObject = require('../../../stripe-object.js')

module.exports = {
  before: beforeRequest,
  get: renderPage
}

async function beforeRequest (req) {
  if (!req.query || !req.query.payoutid) {
    req.error = 'invalid-payoutid'
    req.removeContents = true
    req.data = {
      payout: {
        payoutid: ''
      }
    }
    return
  }
  let payoutRaw
  try {
    payoutRaw = await global.api.administrator.connect.Payout.get(req)
  } catch (error) {
    req.removeContents = true
    req.data = {
      payout: {
        payoutid: ''
      }
    }
    if (error.message === 'invalid-payoutid') {
      req.error = error.message
    } else {
      req.error = 'unknown-error'
    }
    return
  }
  const payout = formatStripeObject(payoutRaw)
  payout.createdAtFormatted = dashboard.Format.date(payout.created)
  payout.amountFormatted = dashboard.Format.money(payout.amount, payout.currency)
  req.data = { payout }
}

async function renderPage (req, res, messageTemplate) {
  messageTemplate = req.error || messageTemplate || (req.query ? req.query.message : null)
  const doc = dashboard.HTML.parse(req.html || req.route.html, req.data.payout, 'payout')
  if (messageTemplate) {
    dashboard.HTML.renderTemplate(doc, null, messageTemplate, 'message-container')
    if (req.removeContents) {
      const submitForm = doc.getElementById('submit-form')
      submitForm.parentNode.removeChild(submitForm)
    }
  } else {
    if (req.data.payout.failure_code) {
      dashboard.HTML.renderTemplate(doc, null, req.data.payout.failure_code, `status-${req.data.payout.id}`)
    }
  }
  return dashboard.Response.end(req, res, doc)
}
