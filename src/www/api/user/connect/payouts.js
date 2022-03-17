const connect = require('../../../../../index.js')

module.exports = {
  get: async (req) => {
    if (!req.query || !req.query.accountid) {
      throw new Error('invalid-accountid')
    }
    const account = await global.api.user.Account.get(req)
    if (!account) {
      throw new Error('invalid-account')
    }
    const where = {
      accountid: req.query.accountid
    }
    if (req.query.stripeid) {
      where.stripeid = req.query.stripeid
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
      const payout = await global.api.user.connect.Payout.get(req)
      items.push(payout)
    }
    return items
  }
}
