const connect = require('../../../../../index.js')

module.exports = {
  get: async (req) => {
    if (!req.query || !req.query.payoutid) {
      throw new Error('invalid-payoutid')
    }
    const payoutInfo = await connect.Storage.Payout.findOne({
      where: {
        payoutid: req.query.payoutid
      }
    })
    if (!payoutInfo) {
      throw new Error('invalid-payoutid')
    }
    if (payoutInfo.dataValues.accountid !== req.account.accountid) {
      throw new Error('invalid-account')
    }
    const payout = {}
    for (const field of payoutInfo._options.attributes) {
      payout[field] = payoutInfo.get(field)
    }
    return payout
  }
}
