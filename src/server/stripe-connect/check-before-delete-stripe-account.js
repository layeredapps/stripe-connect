const dashboard = require('@layeredapps/dashboard')
const Proxy = require('../proxy.js')

module.exports = {
  after: async (req, res) => {
    if (!req.url.startsWith('/account/connect/delete-stripe-account')) {
      return
    }
    const urlWas = req.url
    if (process.env.CHECK_BEFORE_DELETE_STRIPE_ACCOUNT) {
      req.url = `${process.env.CHECK_BEFORE_DELETE_STRIPE_ACCOUNT}?stripeid=${req.query.stripeid}`
    } else {
      req.url = `/api/check-before-delete-stripe-account?stripeid=${req.query.stripeid}`
    }
    const response = await Proxy.get(req)
    req.url = urlWas
    if (response.redirect) {
      return dashboard.Response.redirect(req, res, response.redirect)
    }
  }
}
