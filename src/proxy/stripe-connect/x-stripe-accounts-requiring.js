module.exports = async (req, proxyRequestOptions) => {
  if (!req.account) {
    return
  }
  req.query = req.query || {}
  req.query.accountid = req.account.accountid
  req.query.all = true
  const registrations = await global.api.user.connect.StripeAccounts.get(req)
  if (!registrations) {
    proxyRequestOptions.headers['x-stripe-accounts-requiring'] = '[]'
    return
  }
  const requiring = []
  for (const i in registrations) {
    registrations[i] = registrations[i].stripeObject
    if (registrations[i].requirements.currently_due.length) {
      requiring.push(registrations[i])
    }
  }
  proxyRequestOptions.headers['x-stripe-accounts-requiring'] = JSON.stringify(requiring || [])
}
