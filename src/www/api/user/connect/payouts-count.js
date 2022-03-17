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
    if (req.query.all) {
      return connect.Storage.Payout.count({
        where,
        attributes: ['payoutid'],
        order: [
          ['createdAt', 'DESC']
        ]
      })
    } else {
      const offset = req.query.offset ? parseInt(req.query.offset, 10) : 0
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : global.pageSize
      return connect.Storage.Payout.count({
        where,
        attributes: ['payoutid'],
        offset,
        limit,
        order: [
          ['createdAt', 'DESC']
        ]
      })
    }
  }
}
