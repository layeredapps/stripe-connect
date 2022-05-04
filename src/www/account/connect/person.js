const dashboard = require('@layeredapps/dashboard')
const navbar = require('./navbar-person.js')
const formatStripeObject = require('../../../stripe-object.js')

module.exports = {
  before: beforeRequest,
  get: renderPage
}

async function beforeRequest (req) {
  if (!req.query || !req.query.personid) {
    req.removeContents = true
    req.error = 'invalid-personid'
    req.data = {
      person: {
        personid: '',
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
  req.data = { person }
}

async function renderPage (req, res, messageTemplate) {
  messageTemplate = req.error || messageTemplate || (req.query ? req.query.message : null)
  const doc = dashboard.HTML.parse(req.html || req.route.html, req.data.person, 'person')
  await navbar.setup(doc, req.data.person)
  const removeElements = []
  if (messageTemplate) {
    dashboard.HTML.renderTemplate(doc, null, messageTemplate, 'message-container')
    if (req.removeContents) {
      removeElements.push('submit-form')
    }
  } else {
    if (!req.data.person.requirements.currently_due.length) {
      removeElements.push('requires-information')
    }
    if (!req.data.person.relationship.representative) {
      removeElements.push('representative')
    }
    if (!req.data.person.relationship.owner) {
      removeElements.push('owner')
    }
    if (!req.data.person.relationship.director) {
      removeElements.push('director')
    }
    if (!req.data.person.relationship.executive) {
      removeElements.push('executive')
    }
  }
  for (const id of removeElements) {
    const element = doc.getElementById(id)
    element.parentNode.removeChild(element)
  }
  return dashboard.Response.end(req, res, doc)
}
