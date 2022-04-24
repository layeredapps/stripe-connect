module.exports = async (req, proxyRequestOptions) => {
  if (!req.account) {
    return
  }
  req.query = req.query || {}
  req.query.accountid = req.account.accountid
  req.query.all = true
  const registrations = await global.api.user.connect.StripeAccounts.get(req)
  if (!registrations) {
    proxyRequestOptions.headers['x-active-stripe-account'] = 'false'
    return
  }
  for (const i in registrations) {
    registrations[i] = registrations[i].stripeObject
    if (registrations[i].payouts_enabled) {
      proxyRequestOptions.headers['x-active-stripe-account'] = 'true'
      return
    }
  }
  proxyRequestOptions.headers['x-active-stripe-account'] = 'false'
}
