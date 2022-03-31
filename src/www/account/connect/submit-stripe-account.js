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
    throw new Error('invalid-stripeid')
  }
  const stripeAccountRaw = await global.api.user.connect.StripeAccount.get(req)
  const stripeAccount = formatStripeObject(stripeAccountRaw)
  if (!stripeAccount) {
    throw new Error('invalid-stripeid')
  }
  let owners, directors
  if (stripeAccount.business_type === 'company') {
    if (stripeAccount.requiresOwners && !stripeAccount.company.owners_provided) {
      req.error = req.error || 'invalid-company-owners'
    }
    if (stripeAccount.requiresDirectors && !stripeAccount.company.directors_provided) {
      req.error = req.error || 'invalid-company-directors'
    }
    if (stripeAccount.requiresExecutives && !stripeAccount.company.executives_provided) {
      req.error = req.error || 'invalid-company-executives'
    }
    if (stripeAccount.business_type === 'company') {
      req.query.all = true
      const persons = await global.api.user.connect.Persons.get(req)
      owners = []
      directors = []
      if (!persons || !persons.length) {
        req.error = req.error || 'invalid-company-representative'
      } else {
        for (const i in persons) {
          const person = formatStripeObject(persons[i])
          persons[i] = person
          if (person.relationship.representative) {
            if (person.requirements.currently_due.length) {
              req.error = req.error || 'invalid-company-representative'
            }
          } else if (person.relationship.owner) {
            owners.push(person)
            if (person.requirements.currently_due.length) {
              req.error = req.error || 'invalid-company-owners'
            }
          } else {
            directors.push(person)
            if (person.requirements.currently_due.length) {
              req.error = req.error || 'invalid-company-directors'
            }
          }
        }
      }
    }
  }
  const completedPayment = stripeAccount.external_accounts &&
                           stripeAccount.external_accounts.data &&
                           stripeAccount.external_accounts.data.length
  if (!completedPayment) {
    req.error = req.error || 'invalid-payment-details'
  }
  const requirements = stripeAccount.requirements.currently_due.concat(stripeAccount.requirements.eventually_due)
  if (requirements.length) {
    for (const field of requirements) {
      if (field !== 'tos_acceptance.date' &&
          field !== 'tos_acceptance.ip') {
        req.error = req.error || 'invalid-registration'
      }
    }
  }
  req.data = { stripeAccount, owners, directors }
}

async function renderPage (req, res, messageTemplate) {
  messageTemplate = messageTemplate || req.error || (req.query ? req.query.message : null)
  const doc = dashboard.HTML.parse(req.html || req.route.html, req.data.stripeAccount, 'stripeAccount')
  navbar.setup(doc, req.data.stripeAccount)
  const removeElements = []
  if (messageTemplate) {
    dashboard.HTML.renderTemplate(doc, null, messageTemplate, 'message-container')
    if (messageTemplate === 'success' || req.error) {
      removeElements.push('submit-form', 'owners-container', 'directors-container')
      for (const id of removeElements) {
        const element = doc.getElementById(id)
        element.parentNode.removeChild(element)
      }
      return dashboard.Response.end(req, res, doc)
    }
  }
  if (req.data.stripeAccount.business_type !== 'company') {
    removeElements.push('company-representative-option', 'company-company-owners-option', 'company-directors-option')
  } else {
    if (req.data.owners && req.data.owners.length) {
      dashboard.HTML.renderTable(doc, req.data.owners, 'owner-row', 'owners-table')
    }
    if (req.data.directors && req.data.directors.length) {
      dashboard.HTML.renderTable(doc, req.data.directors, 'director-row', 'directors-table')
    }
  }
  for (const id of removeElements) {
    const element = doc.getElementById(id)
    element.parentNode.removeChild(element)
  }
  return dashboard.Response.end(req, res, doc)
}

async function submitForm (req, res) {
  if (req.error) {
    return renderPage(req, res)
  }
  try {
    await global.api.user.connect.SetStripeAccountSubmitted.patch(req)
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
