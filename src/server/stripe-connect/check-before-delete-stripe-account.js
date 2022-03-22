const dashboard = require('@layeredapps/dashboard')

module.exports = {
  after: async (req, res) => {
    if (!req.url.startsWith('/account/connect/delete-stripe-account')) {
      return
    }
    const requestObject = {}
    if (process.env.CHECK_BEFORE_DELETE_STRIPE_ACCOUNT) {
      requestObject.url = `${process.env.CHECK_BEFORE_DELETE_STRIPE_ACCOUNT}?stripeid=${req.query.stripeid}`
    } else {
      requestObject.url = `/api/check-before-delete-stripe-account?stripeid=${req.query.stripeid}`
    }
    const response = await dashboard.Proxy.get(requestObject)
    if (response.redirect) {
      return dashboard.Response.redirect(req, res, response.redirect)
    }
  }
}
