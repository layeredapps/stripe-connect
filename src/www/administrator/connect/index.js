const dashboard = require('@layeredapps/dashboard')
const formatStripeObject = require('../../../stripe-object.js')

module.exports = {
  before: beforeRequest,
  get: renderPage
}

async function beforeRequest (req) {
  const stripeAccounts = await global.api.administrator.connect.StripeAccounts.get(req)
  if (!stripeAccounts || !stripeAccounts.length) {
    return
  }
  for (const i in stripeAccounts) {
    const stripeAccount = formatStripeObject(stripeAccounts[i])
    stripeAccounts[i] = stripeAccount
    stripeAccount.createdAtFormatted = dashboard.Format.date(stripeAccount.created)
    stripeAccount.individual = stripeAccount.individual || {}
    stripeAccount.company = stripeAccount.company || {}
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
  // registrations
  req.query.keys = dashboard.Metrics.metricKeys('stripe-accounts-created').join(',')
  const createdChart = await global.api.administrator.MetricKeys.get(req)
  const createdChartMaximum = dashboard.Metrics.maximumDay(createdChart)
  const createdChartDays = dashboard.Metrics.days(createdChart, createdChartMaximum)
  const createdChartHighlights = dashboard.Metrics.highlights(createdChart, createdChartDays)
  const createdChartValues = dashboard.Metrics.chartValues(createdChartMaximum)
  // approved
  req.query.keys = dashboard.Metrics.metricKeys('stripe-accounts-approved').join(',')
  const approvedChart = await global.api.administrator.MetricKeys.get(req)
  const approvedChartMaximum = dashboard.Metrics.maximumDay(approvedChart)
  const approvedChartDays = dashboard.Metrics.days(approvedChart, approvedChartMaximum)
  const approvedChartHighlights = dashboard.Metrics.highlights(approvedChart, approvedChartDays)
  const approvedChartValues = dashboard.Metrics.chartValues(approvedChartMaximum)
  // payouts
  req.query.keys = dashboard.Metrics.metricKeys('payouts-created').join(',')
  const payoutsChart = await global.api.administrator.MetricKeys.get(req)
  const payoutsChartMaximum = dashboard.Metrics.maximumDay(payoutsChart)
  const payoutsChartDays = dashboard.Metrics.days(payoutsChart, payoutsChartMaximum)
  const payoutsChartHighlights = dashboard.Metrics.highlights(payoutsChart, payoutsChartDays)
  const payoutsChartValues = dashboard.Metrics.chartValues(payoutsChartMaximum)
  req.data = {
    stripeAccounts,
    createdChartDays,
    createdChartHighlights,
    createdChartValues,
    approvedChartDays,
    approvedChartHighlights,
    approvedChartValues,
    payoutsChartDays,
    payoutsChartHighlights,
    payoutsChartValues
  }
}

async function renderPage (req, res) {
  const doc = dashboard.HTML.parse(req.html || req.route.html)
  const removeElements = []
  if (req.data) {
    if (req.data.createdChartDays && req.data.createdChartDays.length) {
      dashboard.HTML.renderList(doc, req.data.createdChartDays, 'chart-column', 'created-chart')
      dashboard.HTML.renderList(doc, req.data.createdChartValues, 'chart-value', 'created-values')
      dashboard.HTML.renderTemplate(doc, req.data.createdChartHighlights, 'metric-highlights', 'created-highlights')
    } else {
      const createdChart = doc.getElementById('created-chart-container')
      createdChart.parentNode.removeChild(createdChart)
    }
    if (req.data.approvedChartDays && req.data.approvedChartDays.length) {
      dashboard.HTML.renderList(doc, req.data.approvedChartDays, 'chart-column', 'approved-chart')
      dashboard.HTML.renderList(doc, req.data.approvedChartValues, 'chart-value', 'approved-values')
      dashboard.HTML.renderTemplate(doc, req.data.approvedChartHighlights, 'metric-highlights', 'approved-highlights')
    } else {
      const approvedChart = doc.getElementById('approved-chart-container')
      approvedChart.parentNode.removeChild(approvedChart)
    }
    if (req.data.payoutsChartDays && req.data.payoutsChartDays.length) {
      dashboard.HTML.renderList(doc, req.data.payoutsChartDays, 'chart-column', 'payouts-chart')
      dashboard.HTML.renderList(doc, req.data.payoutsChartValues, 'chart-value', 'payouts-values')
      dashboard.HTML.renderTemplate(doc, req.data.payoutsChartHighlights, 'metric-highlights', 'payouts-highlights')
    } else {
      const payoutsChart = doc.getElementById('payouts-chart-container')
      payoutsChart.parentNode.removeChild(payoutsChart)
    }
    removeElements.push('no-stripe-accounts')
  } else {
    removeElements.push('created-chart-container', 'approved-chart-container', 'payouts-chart-container')
  }
  for (const id of removeElements) {
    const element = doc.getElementById(id)
    element.parentNode.removeChild(element)
  }  
  return dashboard.Response.end(req, res, doc)
}
