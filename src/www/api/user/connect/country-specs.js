const connect = require('../../../../../index.js')

module.exports = {
  get: async (req) => {
    let countryids
    req.query = req.query || {}
    if (req.query.all) {
      countryids = await connect.Storage.CountrySpec.findAll({
        attributes: ['countryid'],
        order: [
          ['countryid', 'ASC']
        ]
      })
    } else {
      const offset = req.query.offset ? parseInt(req.query.offset, 10) : 0
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : global.pageSize
      countryids = await connect.Storage.CountrySpec.findAll({
        attributes: ['countryid'],
        offset,
        limit,
        order: [
          ['countryid', 'ASC']
        ]
      })
    }
    if (!countryids || !countryids.length) {
      return null
    }
    const items = []
    for (const countryInfo of countryids) {
      req.query.countryid = countryInfo.dataValues.countryid
      const country = await global.api.user.connect.CountrySpec.get(req)
      items.push(country)
    }
    return items
  }
}
