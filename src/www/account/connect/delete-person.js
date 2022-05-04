const dashboard = require('@layeredapps/dashboard')
const navbar = require('./navbar-person.js')
const formatStripeObject = require('../../../stripe-object.js')

module.exports = {
  before: beforeRequest,
  get: renderPage,
  post: submitForm
}

async function beforeRequest (req) {
  if (!req.query || !req.query.personid) {
    req.error = 'invalid-personid'
    req.removeContents = true
    req.data = {
      person: {
        personid: '',
        requirements: { currently_due: [] },
        relationship: {}
      }
    }
    return
  }
  if (req.query.message === 'success') {
    req.removeContents = true
    req.data = {
      person: {
        personid: req.query.personid,
        requirements: { currently_due: [] },
        relationship: {}
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
        personid: '',
        requirements: { currently_due: [] },
        relationship: {}
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
  req.query.stripeid = person.account
  const stripeAccountRaw = await global.api.user.connect.StripeAccount.get(req)
  const stripeAccount = formatStripeObject(stripeAccountRaw)
  req.data = { person, stripeAccount }
}

async function renderPage (req, res, messageTemplate) {
  messageTemplate = req.error || messageTemplate || (req.query ? req.query.message : null)
  const doc = dashboard.HTML.parse(req.html || req.route.html, req.data.person, 'person')
  await navbar.setup(doc, req.data.person)
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
    await global.api.user.connect.DeletePerson.delete(req)
  } catch (error) {
    return renderPage(req, res, error.message)
  }
  if (req.query['return-url']) {
    return dashboard.Response.redirect(req, res, req.query['return-url'])
  } else {
    res.writeHead(302, {
      location: `${req.urlPath}?personid=${req.query.personid}&message=success`
    })
    return res.end()
  }
}
