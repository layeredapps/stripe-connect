const dashboard = require('@layeredapps/dashboard')

module.exports = {
  after: checkBeforeDeleteStripeAccount
}

async function checkBeforeDeleteStripeAccount (req, res) {
  if (!req.url.startsWith('/account/connect/delete-stripe-account')) {
    return
  }
  const urlWas = req.url
  if (process.env.CHECK_BEFORE_DELETE_STRIPE_ACCOUNT) {
    req.url = `${process.env.CHECK_BEFORE_DELETE_STRIPE_ACCOUNT}?stripeid=${req.query.stripeid}`
  } else {
    req.url = `/api/check-before-delete-stripe-account?stripeid=${req.query.stripeid}`
  }
  let response
  try {
    const responseRaw = await dashboard.Proxy.get(req)
    if (responseRaw && responseRaw.toString) {
      response = responseRaw.toString()
    }
  } catch (error) {
  }
  req.url = urlWas
  if (response.startsWith('{')) {
    const result = JSON.parse(response)
    if (result.redirect) {
      return dashboard.Response.redirect(req, res, response.redirect)
    }
  }
}
