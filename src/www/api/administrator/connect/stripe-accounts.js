const connect = require('../../../../../index.js')

module.exports = {
  get: async (req) => {
    req.query = req.query || {}
    const where = {
      appid: req.appid || global.appid
    }
    if (req.query.accountid) {
      const account = await global.api.administrator.Account.get(req)
      if (!account) {
        throw new Error('invalid-accountid')
      }
      where.accountid = req.query.accountid
    }
    let stripeids
    if (req.query.all) {
      stripeids = await connect.Storage.StripeAccount.findAll({
        where,
        attributes: ['stripeid'],
        order: [
          ['createdAt', 'DESC']
        ]
      })
    } else {
      const offset = req.query.offset ? parseInt(req.query.offset, 10) : 0
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : global.pageSize
      stripeids = await connect.Storage.StripeAccount.findAll({
        where,
        attributes: ['stripeid'],
        offset,
        limit,
        order: [
          ['createdAt', 'DESC']
        ]
      })
    }
    if (!stripeids || !stripeids.length) {
      return null
    }
    const items = []
    for (const stripeAccountInfo of stripeids) {
      req.query.stripeid = stripeAccountInfo.dataValues.stripeid
      const stripeAccount = await global.api.administrator.connect.StripeAccount.get(req)
      items.push(stripeAccount)
    }
    return items
  }
}
