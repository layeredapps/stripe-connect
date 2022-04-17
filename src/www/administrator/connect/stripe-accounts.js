const connect = require('../../../../index.js')
const dashboard = require('@layeredapps/dashboard')
const formatStripeObject = require('../../../stripe-object.js')

module.exports = {
  before: beforeRequest,
  get: renderPage
}

async function beforeRequest (req) {
  const total = await global.api.administrator.connect.StripeAccountsCount.get(req)
  const stripeAccounts = await global.api.administrator.connect.StripeAccounts.get(req)
  const offset = req.query ? req.query.offset || 0 : 0
  for (const i in stripeAccounts) {
    const stripeAccount = formatStripeObject(stripeAccounts[i])
    stripeAccounts[i] = stripeAccount
    stripeAccount.individual = stripeAccount.individual || {}
    stripeAccount.company = stripeAccount.company || {}
    if (stripeAccount.submittedAt) {
      stripeAccount.submittedAtFormatted = dashboard.Format.date(stripeAccount.submittedAt)
    } else {
      stripeAccount.submittedAtFormatted = ''
    }
    if (stripeAccount.payouts_enabled) {
      stripeAccount.statusMessage = 'verified'
    } else if (stripeAccount.requirements.disabled_reason) {
      stripeAccount.statusMessage = stripeAccount.requirements.disabled_reason
    } else if (stripeAccount.requirements.details_code) {
      stripeAccount.statusMessage = stripeAccount.requirements.details_code
    } else if (stripeAccount.submittedAt) {
      stripeAccount.statusMessage = 'under-review'
    } else {
      stripeAccount.statusMessage = 'not-submitted'
    }
  }
  let createdChartDays, createdChartHighlights, createdChartValues, approvedDays, approvedHighlights, approvedValues
  if (offset === 0) {
    // registrations
    req.query.keys = dashboard.Metrics.metricKeys('stripe-accounts-created', 365).join(',')
    const createdChart = await global.api.administrator.MetricKeys.get(req)
    const createdChartMaximum = dashboard.Metrics.maximumDay(createdChart)
    createdChartDays = dashboard.Metrics.days(createdChart, createdChartMaximum)
    createdChartHighlights = dashboard.Metrics.highlights(createdChart, createdChartDays)
    createdChartValues = dashboard.Metrics.chartValues(createdChartMaximum)
    // approved
    req.query.keys = dashboard.Metrics.metricKeys('stripe-accounts-approved', 365).join(',')
    const approved = await global.api.administrator.MetricKeys.get(req)
    const approvedMaximum = dashboard.Metrics.maximumDay(approved)
    approvedDays = dashboard.Metrics.days(approved, approvedMaximum)
    approvedHighlights = dashboard.Metrics.highlights(approved, approvedDays)
    approvedValues = dashboard.Metrics.chartValues(approvedMaximum)
  }
  req.data = { stripeAccounts, total, offset, createdChartDays, createdChartHighlights, createdChartValues, approvedDays, approvedHighlights, approvedValues }
}

async function renderPage (req, res) {
  const doc = dashboard.HTML.parse(req.html || req.route.html)
  const removeElements = []
  if (req.data.stripeAccounts && req.data.stripeAccounts.length) {
    dashboard.HTML.renderTable(doc, req.data.stripeAccounts, 'stripe-account-row', 'stripe-accounts-table')
    const mccCodes = connect.getMerchantCategoryCodes(req.language)
    for (const stripeAccount of req.data.stripeAccounts) {
      if (stripeAccount.business_type === 'individual') {
        removeElements.push(`business-name-${stripeAccount.id}`)
        if (stripeAccount.individual.first_name) {
          removeElements.push(`blank-name-${stripeAccount.id}`)
        } else {
          removeElements.push(`individual-name-${stripeAccount.id}`)
        }
      } else {
        removeElements.push(`individual-name-${stripeAccount.id}`)
        if (stripeAccount.company.name) {
          removeElements.push(`blank-name-${stripeAccount.id}`)
        } else {
          removeElements.push(`business-name-${stripeAccount.id}`)
        }
      }
      if (stripeAccount.statusMessage) {
        dashboard.HTML.renderTemplate(doc, null, stripeAccount.statusMessage, `account-status-${stripeAccount.id}`)
      }
      if (stripeAccount.business_profile.mcc) {
        for (const code of mccCodes) {
          if (code.code.toString() === stripeAccount.business_profile.mcc.toString()) {
            const mccDescription = doc.getElementById(`mcc-description-${stripeAccount.id}`)
            mccDescription.child = [{
              node: 'text',
              text: code.description
            }]
            break
          }
        }
      }
    }
    if (req.data.total <= global.PAGE_SIZE) {
      const pageLinks = doc.getElementById('page-links')
      pageLinks.parentNode.removeChild(pageLinks)
    } else {
      dashboard.HTML.renderPagination(doc, req.data.offset, req.data.total)
    }
    if (req.data.createdChartDays && req.data.createdChartDays.length) {
      dashboard.HTML.renderList(doc, req.data.createdChartDays, 'chart-column', 'created-chart')
      dashboard.HTML.renderList(doc, req.data.createdChartValues, 'chart-value', 'created-values')
      dashboard.HTML.renderTemplate(doc, req.data.createdChartHighlights, 'metric-highlights', 'created-highlights')
    } else {
      const createdChart = doc.getElementById('created-chart-container')
      createdChart.parentNode.removeChild(createdChart)
    }
    if (req.data.approvedDays && req.data.approvedDays.length) {
      dashboard.HTML.renderList(doc, req.data.approvedDays, 'chart-column', 'approved-chart')
      dashboard.HTML.renderList(doc, req.data.approvedValues, 'chart-value', 'approved-values')
      dashboard.HTML.renderTemplate(doc, req.data.approvedHighlights, 'metric-highlights', 'approved-highlights')
    } else {
      const approvedChart = doc.getElementById('approved-chart-container')
      approvedChart.parentNode.removeChild(approvedChart)
    }
    removeElements.push('no-stripe-accounts')
  } else {
    removeElements.push('stripe-accounts-table', 'created-chart-container', 'approved-chart-container')
  }
  for (const id of removeElements) {
    const element = doc.getElementById(id)
    element.parentNode.removeChild(element)
  }
  return dashboard.Response.end(req, res, doc)
}
