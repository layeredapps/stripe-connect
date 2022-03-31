const dashboard = require('@layeredapps/dashboard')

module.exports = {
  after: async (req, res) => {
    if (!req.account || !req.session) {
      return
    }
    if (req.urlPath === '/account' ||
      req.urlPath === '/administrator' ||
      req.urlPath.startsWith('/public/') ||
      req.urlPath.startsWith('/account/') ||
      req.urlPath.startsWith('/administrator/') ||
      req.urlPath.startsWith('/api/')) {
      return
    }
    const queryWas = req.query
    req.query = {
      accountid: req.account.accountid,
      all: true
    }
    const registrations = await global.api.user.connect.StripeAccounts.get(req)
    req.query = queryWas
    if (registrations && registrations.length) {
      for (const registration of registrations) {
        if (registration.stripeObject.payouts_enabled) {
          return
        }
      }
    }
    res.ended = true
    return dashboard.Response.redirect(req, res, '/account/connect/create-stripe-account')
  }
}
