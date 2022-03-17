const connect = require('../../../../../index.js')

module.exports = {
  get: async (req) => {
    if (!req.query || !req.query.countryid) {
      throw new Error('invalid-countryid')
    }
    const countryInfo = await connect.Storage.CountrySpec.findOne({
      where: {
        countryid: req.query.countryid
      }
    })
    if (!countryInfo) {
      throw new Error('invalid-countryid')
    }
    const country = {}
    for (const field of countryInfo._options.attributes) {
      country[field] = countryInfo.get(field)
    }
    return country
  }
}
