module.exports = addXStripeAccountsHeader

async function addXStripeAccountsHeader (req, proxyRequestOptions) {
  if (!req.account) {
    return
  }
  req.query = req.query || {}
  req.query.accountid = req.account.accountid
  req.query.all = true
  const registrations = await global.api.user.connect.StripeAccounts.get(req)
  if (!registrations) {
    proxyRequestOptions.headers['x-stripe-accounts'] = '[]'
    return
  }
  for (const i in registrations) {
    registrations[i] = registrations[i].stripeObject
  }
  proxyRequestOptions.headers['x-stripe-accounts'] = JSON.stringify(registrations || [])
}
