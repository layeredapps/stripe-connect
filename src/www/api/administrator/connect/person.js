const connect = require('../../../../../index.js')
const dashboard = require('@layeredapps/dashboard')

module.exports = {
  get: async (req) => {
    if (!req.query || !req.query.personid) {
      throw new Error('invalid-personid')
    }
    let person = await dashboard.StorageCache.get(req.query.personid)
    if (!person) {
      const personInfo = await connect.Storage.Person.findOne({
        where: {
          personid: req.query.personid
        }
      })
      if (!personInfo) {
        throw new Error('invalid-personid')
      }
      person = {}
      for (const field of personInfo._options.attributes) {
        person[field] = personInfo.get(field)
      }
      await dashboard.StorageCache.set(req.query.personid, person)
    }
    return person
  }
}
