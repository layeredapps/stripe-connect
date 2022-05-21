const connect = require('../../../../index.js')
const dashboard = require('@layeredapps/dashboard')

module.exports = {
  get: renderPage,
  post: submitForm
}

async function renderPage (req, res, messageTemplate) {
  messageTemplate = req.error || messageTemplate || (req.query ? req.query.message : null)
  const doc = dashboard.HTML.parse(req.html || req.route.html)
  if (!messageTemplate && req.method === 'GET' && req.query && req.query['return-url']) {
    const submitForm = doc.getElementById('submit-form')
    const divider = submitForm.attr.action.indexOf('?') > -1 ? '&' : '?'
    submitForm.attr.action += `${divider}return-url=${encodeURI(req.query['return-url']).split('?').join('%3F')}`
  }
  if (messageTemplate) {
    dashboard.HTML.renderTemplate(doc, null, messageTemplate, 'message-container')
    if (req.removeContents) {
      const submitForm = doc.getElementById('submit-form')
      submitForm.parentNode.removeChild(submitForm)
      return dashboard.Response.end(req, res, doc)
    }
  }
  if (req.method === 'GET' && req.query && req.query.business_type) {
    if (req.query.business_type === 'company') {
      const company = doc.getElementById('company')
      company.setAttribute('checked', 'checked')
    } else if (req.query.business_type === 'individual') {
      const individual = doc.getElementById('individual')
      individual.setAttribute('checked', 'checked')
    }
  }
  dashboard.HTML.renderList(doc, connect.countrySpecs, 'country-option', 'country')
  let countryCode
  if (req.body) {
    countryCode = req.body.address_country
  } else {
    if (req.country) {
      countryCode = req.country.country.iso_code
    } else {
      req.query = req.query || {}
      req.query.ip = req.ip
      const defaultCountry = await global.api.user.geoip.Country.get(req)
      countryCode = defaultCountry.country.iso_code
    }
  }
  dashboard.HTML.setSelectedOptionByValue(doc, 'country', countryCode)
  return dashboard.Response.end(req, res, doc)
}

async function submitForm (req, res) {
  if (!req.body) {
    return renderPage(req, res)
  }
  if (req.query && req.query.message === 'success') {
    return renderPage(req, res)
  }
  if (!req.body.country) {
    return renderPage(req, res, 'invalid-country')
  }
  const found = connect.countrySpecIndex[req.body.country] && connect.countrySpecIndex[req.body.country].object
  if (!found) {
    return renderPage(req, res, 'invalid-country')
  }
  req.query = req.query || {}
  req.query.accountid = req.account.accountid
  let stripeAccount
  try {
    stripeAccount = await global.api.user.connect.CreateStripeAccount.post(req)
  } catch (error) {
    return renderPage(req, res, error.message)
  }
  if (req.query['return-url']) {
    return dashboard.Response.redirect(req, res, req.query['return-url'])
  } else {
    res.writeHead(302, {
      location: `/account/connect/stripe-account?stripeid=${stripeAccount.stripeid}`
    })
    return res.end()
  }
}
