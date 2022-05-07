const dashboard = require('@layeredapps/dashboard')
const navbar = require('./navbar-stripe-account.js')
const formatStripeObject = require('../../../stripe-object.js')

module.exports = {
  before: beforeRequest,
  get: renderPage
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
  if (stripeAccount.payouts_enabled) {
    stripeAccount.statusMessage = 'verified'
  } else if (stripeAccount.verification && stripeAccount.requirements.disabled_reason) {
    stripeAccount.statusMessage = stripeAccount.requirements.disabled_reason
  } else if (stripeAccount.verification && stripeAccount.requirements.details_code) {
    stripeAccount.statusMessage = stripeAccount.requirements.details_code
  } else if (stripeAccount.submittedAt) {
    stripeAccount.statusMessage = 'under-review'
  } else {
    stripeAccount.statusMessage = 'not-submitted'
  }
  if (stripeAccount.submittedAt) {
    stripeAccount.submittedAtFormatted = dashboard.Format.date(stripeAccount.submittedAt)
  }
  let registrationComplete = true
  if (stripeAccount.requirements.currently_due.length) {
    for (const field of stripeAccount.requirements.currently_due) {
      if (field === 'external_account' ||
          field === 'relationship.representative' ||
          field === 'relationship.account_opener' ||
          field === 'relationship.title' ||
          field === 'relationship.owner' ||
          field === 'relationship.executive' ||
          field === 'relationship.director' ||
          field === 'business_type' ||
          field === 'tos_acceptance.ip' ||
          field === 'tos_acceptance.date') {
        continue
      }
      registrationComplete = false
    }
  }
  stripeAccount.company = stripeAccount.company || {}
  stripeAccount.individual = stripeAccount.individual || {}
  let owners, directors, executives, representatives
  if (stripeAccount.business_type === 'company') {
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
        if (person.relationship.executive) {
          executives = executives || []
          executives.push(person)
        }
      }
    }
  }
  req.data = { owners, directors, executives, representatives, stripeAccount, registrationComplete }
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
    if (req.data.stripeAccount.statusMessage) {
      dashboard.HTML.renderTemplate(doc, null, req.data.stripeAccount.statusMessage, `account-status-${req.data.stripeAccount.id}`)
    }
    if (req.data.stripeAccount.submittedAt) {
      removeElements.push('not-submitted2')
    } else {
      removeElements.push('submitted')
    }
    const completedPaymentInformation = req.data.stripeAccount.external_accounts.data.length
    if (completedPaymentInformation) {
      removeElements.push('setup-payment')
      dashboard.HTML.renderTemplate(doc, req.data.stripeAccount.external_accounts.data[0], 'payment-information', 'payment-information-status')
    } else {
      removeElements.push('update-payment')
      dashboard.HTML.renderTemplate(doc, null, 'no-payment-information', 'payment-information-status')
    }
    if (req.data.stripeAccount.business_type === 'individual') {
      removeElements.push('business', 'business-name', 'representative-container', 'owners-container', 'directors-container', 'executives-container')
      if (req.data.stripeAccount.individual.first_name) {
        removeElements.push('blank-name')
      } else {
        removeElements.push('individual-name')
      }
    } else {
      removeElements.push('individual', 'individual-name')
      if (req.data.stripeAccount.company.name) {
        removeElements.push('blank-name')
      } else {
        removeElements.push('business-name')
      }
      if (req.data.representatives && req.data.representatives.length) {
        dashboard.HTML.renderTable(doc, req.data.representatives, 'person-row', 'representatives-table')
        for (const person of req.data.representatives) {
          if (person.requirements.currently_due.length) {
            removeElements.push(`requires-no-information-${person.id}`)
          } else {
            removeElements.push(`requires-information-${person.id}`)
          }
        }
      } else {
        removeElements.push('representatives-table')
      }
      if (req.data.owners && req.data.owners.length) {
        dashboard.HTML.renderTable(doc, req.data.owners, 'person-row', 'owners-table')
        for (const person of req.data.owners) {
          if (person.requirements.currently_due.length) {
            removeElements.push(`requires-no-information-${person.id}`)
          } else {
            removeElements.push(`requires-information-${person.id}`)
          }
        }
      } else {
        if (!req.data.stripeAccount.requiresOwners) {
          removeElements.push('owners-container')
        } else {
          removeElements.push('owners-table')
        }
      }
      if (req.data.directors && req.data.directors.length) {
        dashboard.HTML.renderTable(doc, req.data.directors, 'person-row', 'directors-table')
        for (const person of req.data.directors) {
          if (person.requirements.currently_due.length) {
            removeElements.push(`requires-no-information-${person.id}`)
          } else {
            removeElements.push(`requires-information-${person.id}`)
          }
        }
      } else {
        if (!req.data.stripeAccount.requiresDirectors) {
          removeElements.push('directors-container')
        } else {
          removeElements.push('directors-table')
        }
      }
      if (req.data.executives && req.data.executives.length) {
        dashboard.HTML.renderTable(doc, req.data.executives, 'person-row', 'executives-table')
        for (const person of req.data.executives) {
          if (person.requirements.currently_due.length) {
            removeElements.push(`requires-no-information-${person.id}`)
          } else {
            removeElements.push(`requires-information-${person.id}`)
          }
        }
      } else {
        if (!req.data.stripeAccount.requiresExecutives) {
          removeElements.push('executives-container')
        } else {
          removeElements.push('executives-table')
        }
      }
    }
    if (req.data.stripeAccount.submittedAt) {
      removeElements.push('registration-container')
    } else if (req.data.registrationComplete) {
      dashboard.HTML.renderTemplate(doc, null, 'completed-registration', 'account-status')
      removeElements.push('start-registration-link', 'update-registration-link')
    } else {
      dashboard.HTML.renderTemplate(doc, null, 'unstarted-registration', 'account-status')
      removeElements.push('update-registration-link')
    }
    if (req.data.stripeAccount.submittedAt) {
      dashboard.HTML.renderTemplate(doc, req.data.stripeAccount, 'submitted-information', 'submission-status')
      removeElements.push('submit-registration-link-container')
    } else {
      dashboard.HTML.renderTemplate(doc, req.data.stripeAccount, 'not-submitted-information', 'submission-status')
      if (!req.data.registrationComplete || !completedPaymentInformation) {
        const registrationLink = doc.getElementById('submit-registration-link')
        registrationLink.setAttribute('disabled', 'disabled')
      }
    }
  }
  for (const id of removeElements) {
    const element = doc.getElementById(id)
    element.parentNode.removeChild(element)
  }
  return dashboard.Response.end(req, res, doc)
}
