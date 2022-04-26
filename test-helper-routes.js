const connect = require('./index.js')
const stripeCache = require('./src/stripe-cache.js')

module.exports = {
  fakePayout: {
    api: {
      get: async (req) => {
        if (process.env.NODE_ENV !== 'testing') {
          throw new Error('invalid-route')
        }
        if (!req.query || !req.query.stripeid) {
          throw new Error('invalid-stripeid')
        }
        const stripeAccount = await global.api.administrator.connect.StripeAccount.get(req)
        if (!stripeAccount.stripeObject.payouts_enabled) {
          throw new Error('invalid-stripe-account')
        }
        req.stripeKey.stripeAccount = req.query.stripeid
        const chargeInfo = {
          amount: 2500,
          currency: stripeAccount.stripeObject.default_currency,
          source: 'tok_bypassPending',
          description: 'Test charge'
        }
        await stripeCache.execute('charges', 'create', chargeInfo, req.stripeKey)
        const payoutInfo = {
          amount: 2000,
          currency: stripeAccount.stripeObject.default_currency
        }
        const payout = await stripeCache.execute('payouts', 'create', payoutInfo, req.stripeKey)
        await connect.Storage.Payout.create({
          payoutid: payout.id,
          stripeid: stripeAccount.stripeid,
          appid: req.appid || global.appid,
          accountid: stripeAccount.accountid,
          stripeObject: payout
        })
        return payout
      }
    }
  }
}
