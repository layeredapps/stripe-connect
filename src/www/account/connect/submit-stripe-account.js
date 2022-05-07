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
  if (stripeAccount.submittedAt) {
    req.removeContents = true
    req.error = 'not-required'
    req.data = {
      stripeAccount: {
        stripeid: req.query.stripeid
      }
    }
    return
  }
  let owners, directors, executives
  if (stripeAccount.business_type === 'company') {
    if (stripeAccount.requiresOwners && !stripeAccount.company.owners_provided) {
      req.removeContents = true
      req.error = 'invalid-company-owners'
      req.data = {
        stripeAccount: {
          stripeid: req.query.stripeid
        }
      }
      return
    }
    if (stripeAccount.requiresDirectors && !stripeAccount.company.directors_provided) {
      req.removeContents = true
      req.error = 'invalid-company-directors'
      req.data = {
        stripeAccount: {
          stripeid: req.query.stripeid
        }
      }
      return
    }
    if (stripeAccount.requiresExecutives && !stripeAccount.company.executives_provided) {
      req.removeContents = true
      req.error = 'invalid-company-executives'
      req.data = {
        stripeAccount: {
          stripeid: req.query.stripeid
        }
      }
      return
    }
    if (stripeAccount.business_type === 'company') {
      req.query.all = true
      const persons = await global.api.user.connect.Persons.get(req)
      owners = []
      directors = []
      executives = []
      if (!persons || !persons.length) {
        req.removeContents = true
        req.error = 'invalid-company-representative'
        req.data = {
          stripeAccount: {
            stripeid: req.query.stripeid
          }
        }
        return
      }
      for (const i in persons) {
        const person = formatStripeObject(persons[i])
        persons[i] = person
        if (person.relationship.representative) {
          if (person.requirements.currently_due.length) {
            req.removeContents = true
            req.error = 'invalid-company-representative'
            req.data = {
              stripeAccount: {
                stripeid: req.query.stripeid
              }
            }
            return
          }
        } else if (person.relationship.owner) {
          owners.push(person)
          if (person.requirements.currently_due.length) {
            req.removeContents = true
            req.error = 'invalid-company-owners'
            req.data = {
              stripeAccount: {
                stripeid: req.query.stripeid
              }
            }
            return
          }
        } else if (person.relationship.director) {
          directors.push(person)
          if (person.requirements.currently_due.length) {
            req.removeContents = true
            req.error = 'invalid-company-directors'
            req.data = {
              stripeAccount: {
                stripeid: req.query.stripeid
              }
            }
            return
          }
        } else {
          executives.push(person)
          if (person.requirements.currently_due.length) {
            req.removeContents = true
            req.error = 'invalid-company-executives'
            req.data = {
              stripeAccount: {
                stripeid: req.query.stripeid
              }
            }
            return
          }
        }
      }
    }
  }
  const completedPayment = stripeAccount.external_accounts &&
                           stripeAccount.external_accounts.data &&
                           stripeAccount.external_accounts.data.length
  if (!completedPayment) {
    req.removeContents = true
    req.error = 'invalid-payment-details'
    req.data = {
      stripeAccount: {
        stripeid: req.query.stripeid
      }
    }
    return
  }
  const requirements = stripeAccount.requirements.currently_due.concat(stripeAccount.requirements.eventually_due)
  if (requirements.length) {
    for (const field of requirements) {
      if (field !== 'tos_acceptance.date' &&
          field !== 'tos_acceptance.ip') {
        req.removeContents = true
        req.error = 'invalid-registration'
        req.data = {
          stripeAccount: {
            stripeid: req.query.stripeid
          }
        }
        return
      }
    }
  }
  req.data = { stripeAccount, owners, directors, executives }
}

async function renderPage (req, res, messageTemplate) {
  messageTemplate = req.error || messageTemplate || (req.query ? req.query.message : null)
  const doc = dashboard.HTML.parse(req.html || req.route.html, req.data.stripeAccount, 'stripeAccount')
  navbar.setup(doc, req.data.stripeAccount)
  const removeElements = []
  if (messageTemplate) {
    dashboard.HTML.renderTemplate(doc, null, messageTemplate, 'message-container')
    if (req.removeContents) {
      removeElements.push('submit-form', 'owners-container', 'directors-container', 'executives-container')
    }
  } else {
    if (req.data.stripeAccount.business_type !== 'company') {
      removeElements.push(
        'company-representative-option',
        'company-company-owners-option',
        'company-directors-option',
        'company-executives-option',
        'owners-container',
        'directors-container',
        'executives-container'
      )
    } else {
      if (req.data.owners && req.data.owners.length) {
        dashboard.HTML.renderTable(doc, req.data.owners, 'person-row', 'owners-table')
      }
      if (req.data.directors && req.data.directors.length) {
        dashboard.HTML.renderTable(doc, req.data.directors, 'person-row', 'directors-table')
      }
      if (req.data.executives && req.data.executives.length) {
        dashboard.HTML.renderTable(doc, req.data.executives, 'person-row', 'executives-table')
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
