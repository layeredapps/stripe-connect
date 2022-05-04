const dashboard = require('@layeredapps/dashboard')
const formatStripeObject = require('../../../stripe-object.js')

module.exports = {
  before: beforeRequest,
  get: renderPage,
  post: submitForm
}

async function beforeRequest (req) {
  if (!req.query || !req.query.stripeid) {
    req.error = 'invalid-stripeid'
    req.removeContents = true
    return
  }
  if (req.query.message === 'success') {
    req.removeContents = true
    req.data = {
      stripeAccount: {
        stripeid: req.query.stripeid
      }
    }
    return
  }
  let stripeAccountRaw
  try {
    stripeAccountRaw = await global.api.administrator.connect.StripeAccount.get(req)
  } catch (error) {
    req.removeContents = true
    req.data = {
      stripeAccount: {
        stripeid: ''
      }
    }
    if (error.message === 'invalid-stripeid') {
      req.error = error.message
    } else {
      req.error = 'unknown-error'
    }
    return
  }
  const stripeAccount = formatStripeObject(stripeAccountRaw)
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
  stripeAccount.individual = stripeAccount.individual || {}
  stripeAccount.company = stripeAccount.company || {}
  req.data = { stripeAccount }
}

async function renderPage (req, res, messageTemplate) {
  messageTemplate = req.error || messageTemplate || (req.query ? req.query.message : null)
  const doc = dashboard.HTML.parse(req.html || req.route.html, req.data.stripeAccount, 'stripeAccount')
  if (messageTemplate) {
    dashboard.HTML.renderTemplate(doc, null, messageTemplate, 'message-container')
    if (req.removeContents) {
      const submitForm = doc.getElementById('submit-form')
      submitForm.parentNode.removeChild(submitForm)
    }
  }
  return dashboard.Response.end(req, res, doc)
}

async function submitForm (req, res) {
  try {
    await global.api.administrator.connect.DeleteStripeAccount.delete(req)
  } catch (error) {
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
