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
    req.error = 'invalid-stripeid'
    req.removeContents = true
    req.data = {
      stripeAccount: {
        stripeid: ''
      }
    }
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
  req.data = { stripeAccount }
}

async function renderPage (req, res, messageTemplate) {
  messageTemplate = req.error || messageTemplate || (req.query ? req.query.message : null)
  const doc = dashboard.HTML.parse(req.html || req.route.html, req.data.stripeAccount, 'stripeAccount')
  navbar.setup(doc, req.data.stripeAccount)
  const removeElements = []
  if (messageTemplate) {
    dashboard.HTML.renderTemplate(doc, null, messageTemplate, 'message-container')
    if (req.removeContents) {
      removeElements.push('submit-form')
    }
  } else {
    // only countries with country specs have containers for
    // their banking field format, but during tests the list
    // of country specs may be replaced with a single country
    // so the full, non-stripe country list is used here
    for (const country of connect.countryList) {
      if (country.code !== req.data.stripeAccount.country) {
        if (req.route.html.indexOf(`${country.code}-container`) > -1) {
          removeElements.push(`${country.code}-container`)
        }
      }
    }
    const countries = []
    for (const country of connect.countrySpecs) {
      countries.push({
        object: 'country',
        code: country.id,
        name: connect.countryNameIndex[country.id]
      })
    }
    dashboard.HTML.renderList(doc, countries, 'country-option', 'country')
    const nominatedCountry = (req.body ? req.body.country : '') || req.data.stripeAccount.country
    const currencies = connect.countryCurrencyIndex[nominatedCountry]
    dashboard.HTML.renderList(doc, currencies, 'currency-option', 'currency')
    if (req.body) {
      for (const field in req.body) {
        const element = doc.getElementById(field)
        if (!element) {
          continue
        }
        if (element.tag === 'input') {
          if (element.attr &&
            (element.attr.type === 'checkbox' || element.attr.type === 'radio')) {
            element.setAttribute('checked', 'checked')
          } else {
            element.setAttribute('value', dashboard.Format.replaceQuotes(req.body[field] || ''))
          }
        } else if (element.tag === 'select') {
          dashboard.HTML.setSelectedOptionByValue(doc, field, req.body[field] || '')
        }
      }
    }
  }
  for (const id of removeElements) {
    const element = doc.getElementById(id)
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
  try {
    await global.api.user.connect.UpdatePaymentInformation.patch(req)
  } catch (error) {
    return renderPage(req, res, error.message.split('.').join('_').replace('external_account_', ''))
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
