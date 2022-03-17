const dashboard = require('@layeredapps/dashboard')
const navbar = require('./navbar-person.js')
const formatStripeObject = require('../../../stripe-object.js')

module.exports = {
  before: beforeRequest,
  get: renderPage
}

async function beforeRequest (req) {
  if (!req.query || !req.query.personid) {
    throw new Error('invalid-personid')
  }
  const personRaw = await global.api.user.connect.Person.get(req)
  const person = formatStripeObject(personRaw)
  req.data = { person }
}

async function renderPage (req, res) {
  const doc = dashboard.HTML.parse(req.html || req.route.html, req.data.person, 'person')
  await navbar.setup(doc, req.data.person)
  const removeElements = []
  if (!req.data.person.requirements.currently_due.length) {
    removeElements.push('requires-information')
  }
  if (req.data.person.relationship.representative) {
    removeElements.push('director', 'owner')
  } else if (req.data.person.relationship.owner) {
    removeElements.push('director', 'representative')
  } else {
    removeElements.push('owner', 'representative')
  }
  for (const id of removeElements) {
    const element = doc.getElementById(id)
    element.parentNode.removeChild(element)
  }
  return dashboard.Response.end(req, res, doc)
}
