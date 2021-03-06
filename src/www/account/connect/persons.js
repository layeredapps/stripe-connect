const dashboard = require('@layeredapps/dashboard')
const navbar = require('./navbar-persons.js')
const formatStripeObject = require('../../../stripe-object.js')

module.exports = {
  before: beforeRequest,
  get: renderPage
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
  if (!stripeAccount) {
    req.error = 'invalid-stripeid'
    req.removeContents = true
    return
  }
  if (stripeAccount.business_type !== 'company') {
    req.error = 'invalid-stripe-account'
    req.removeContents = true
    return
  }
  let owners, directors, representatives
  req.query.all = true
  const persons = await global.api.user.connect.Persons.get(req)
  if (persons && persons.length) {
    for (const i in persons) {
      const person = formatStripeObject(persons[i])
      persons[i] = person
      if (person.relationship.representative) {
        representatives = representatives || []
        representatives.push(person)
      }
      if (person.relationship.owner) {
        owners = owners || []
        owners.push(person)
      }
      if (person.relationship.director) {
        directors = directors || []
        directors.push(person)
      }
    }
  }
  req.data = { stripeAccount, owners, directors, representatives }
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
    if (!req.data.owners || !req.data.owners.length) {
      removeElements.push('owners-container')
    } else {
      dashboard.HTML.renderTable(doc, req.data.owners, 'person-row', 'owners-table')
      for (const person of req.data.owners) {
        if (person.requirements.currently_due.length) {
          removeElements.push(`requires-no-information-${person.id}`)
        } else {
          removeElements.push(`requires-information-${person.id}`)
        }
        if (!person.first_name && !person.last_name) {
          removeElements.push(`has-name-${person.id}`)
        } else {
          removeElements.push(`no-name-${person.id}`)
        }
      }
    }
    if (!req.data.representatives || !req.data.representatives.length) {
      removeElements.push('representatives-table')
    } else {
      dashboard.HTML.renderTable(doc, req.data.representatives, 'person-row', 'representatives-table')
      for (const person of req.data.representatives) {
        if (person.requirements.currently_due.length) {
          removeElements.push(`requires-no-information-${person.id}`)
        } else {
          removeElements.push(`requires-information-${person.id}`)
        }
        if (!person.first_name && !person.last_name) {
          removeElements.push(`has-name-${person.id}`)
        } else {
          removeElements.push(`no-name-${person.id}`)
        }
      }
    }
    if (!req.data.directors || !req.data.directors.length) {
      removeElements.push('directors-container')
    } else {
      dashboard.HTML.renderTable(doc, req.data.directors, 'person-row', 'directors-table')
      for (const person of req.data.directors) {
        if (person.requirements.currently_due.length) {
          removeElements.push(`requires-no-information-${person.id}`)
        } else {
          removeElements.push(`requires-information-${person.id}`)
        }
        if (!person.first_name && !person.last_name) {
          removeElements.push(`has-name-${person.id}`)
        } else {
          removeElements.push(`no-name-${person.id}`)
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
