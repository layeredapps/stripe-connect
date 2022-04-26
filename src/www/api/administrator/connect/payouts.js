const connect = require('../../../../../index.js')

module.exports = {
  get: async (req) => {
    req.query = req.query || {}
    const where = {
      appid: req.appid || global.appid
    }
    if (req.query.stripeid) {
      const StripeAccount = await global.api.administrator.connect.StripeAccount.get(req)
      if (!StripeAccount) {
        throw new Error('invalid-stripeid')
      }
      where.stripeid = req.query.stripeid
    } else if (req.query.accountid) {
      const account = await global.api.administrator.Account.get(req)
      if (!account) {
        throw new Error('invalid-account')
      }
      where.accountid = req.query.accountid
    }
    let payoutids
    if (req.query.all) {
      payoutids = await connect.Storage.Payout.findAll({
        where,
        attributes: ['payoutid'],
        order: [
          ['createdAt', 'DESC']
        ]
      })
    } else {
      const offset = req.query.offset ? parseInt(req.query.offset, 10) : 0
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : global.pageSize
      payoutids = await connect.Storage.Payout.findAll({
        where,
        attributes: ['payoutid'],
        offset,
        limit,
        order: [
          ['createdAt', 'DESC']
        ]
      })
    }
    if (!payoutids || !payoutids.length) {
      return null
    }
    const items = []
    for (const payoutInfo of payoutids) {
      req.query.payoutid = payoutInfo.dataValues.payoutid
      const payout = await global.api.administrator.connect.Payout.get(req)
      items.push(payout)
    }
    return items
  }
}
