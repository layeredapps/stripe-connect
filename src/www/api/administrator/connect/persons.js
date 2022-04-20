const connect = require('../../../../../index.js')

module.exports = {
  get: async (req) => {
    req.query = req.query || {}
    let where
    if (req.query.stripeid) {
      const stripeAccount = await global.api.administrator.connect.StripeAccount.get(req)
      if (!stripeAccount) {
        throw new Error('invalid-stripeid')
      }
      if (stripeAccount.stripeObject.business_type !== 'company') {
        throw new Error('invalid-stripe-account')
      }
      where = {
        stripeid: req.query.stripeid
      }
    }
    let personids
    if (req.query.all) {
      personids = await connect.Storage.Person.findAll({
        where,
        attributes: ['personid'],
        order: [
          ['createdAt', 'DESC']
        ]
      })
    } else {
      const offset = req.query.offset ? parseInt(req.query.offset, 10) : 0
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : global.pageSize
      personids = await connect.Storage.Person.findAll({
        where,
        attributes: ['personid'],
        offset,
        limit,
        order: [
          ['createdAt', 'DESC']
        ]
      })
    }
    if (!personids || !personids.length) {
      return null
    }
    const items = []
    for (const personInfo of personids) {
      req.query.personid = personInfo.dataValues.personid
      const person = await global.api.administrator.connect.Person.get(req)
      items.push(person)
    }
    return items
  }
}
