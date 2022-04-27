module.exports = addXStripeAccountsPendingHeader

async function addXStripeAccountsPendingHeader (req, proxyRequestOptions) {
  if (!req.account) {
    return
  }
  req.query = req.query || {}
  req.query.accountid = req.account.accountid
  req.query.all = true
  const registrations = await global.api.user.connect.StripeAccounts.get(req)
  if (!registrations) {
    proxyRequestOptions.headers['x-stripe-accounts-pending'] = '[]'
    return
  }
  const pending = []
  for (const i in registrations) {
    registrations[i] = registrations[i].stripeObject
    if (registrations[i].requirements.pending_verification.length) {
      pending.push(registrations[i])
    }
  }
  proxyRequestOptions.headers['x-stripe-accounts-pending'] = JSON.stringify(pending || [])
}
