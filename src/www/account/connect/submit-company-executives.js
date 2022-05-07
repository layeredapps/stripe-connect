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
  if (stripeAccount.business_type === 'individual') {
    req.removeContents = true
    req.error = 'invalid-stripe-account'
    return
  }
  if (!stripeAccount.requiresExecutives) {
    req.removeContents = true
    req.error = 'not-required'
    req.data = {
      stripeAccount: {
        stripeid: req.query.stripeid
      }
    }
    return
  }
  req.query.all = true
  const persons = await global.api.user.connect.Persons.get(req)
  const executives = []
  if (persons && persons.length) {
    for (const i in persons) {
      const person = formatStripeObject(persons[i])
      persons[i] = person
      if (person.relationship.executive) {
        executives.push(person)
        if (person.requirements.currently_due.length) {
          req.error = req.error || 'invalid-company-executives'
          break
        }
      }
    }
  }
  req.data = { stripeAccount, executives }
}

async function renderPage (req, res, messageTemplate) {
  messageTemplate = messageTemplate || req.error || (req.query ? req.query.message : null)
  const doc = dashboard.HTML.parse(req.html || req.route.html, req.data.stripeAccount, 'stripeAccount')
  navbar.setup(doc, req.data.stripeAccount)
  if (messageTemplate) {
    dashboard.HTML.renderTemplate(doc, null, messageTemplate, 'message-container')
    if (req.removeContents) {
      const submitForm = doc.getElementById('submit-form')
      submitForm.parentNode.removeChild(submitForm)
    }
  }
  if (messageTemplate !== 'success' && req.data.executives && req.data.executives.length) {
    dashboard.HTML.renderTable(doc, req.data.executives, 'person-row', 'executives-table')
  } else {
    const executivesContainer = doc.getElementById('executives-container')
    executivesContainer.parentNode.removeChild(executivesContainer)
  }
  return dashboard.Response.end(req, res, doc)
}

async function submitForm (req, res) {
  if (req.error) {
    return renderPage(req, res)
  }
  try {
    await global.api.user.connect.SetCompanyExecutivesSubmitted.patch(req)
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
