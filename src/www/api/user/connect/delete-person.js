const connect = require('../../../../../index.js')
const stripeCache = require('../../../../stripe-cache.js')

module.exports = {
  delete: async (req) => {
    if (!req.query || !req.query.personid) {
      throw new Error('invalid-personid')
    }
    const person = await global.api.user.connect.Person.get(req)
    if (!person) {
      throw new Error('invalid-personid')
    }
    if (person.stripeObject.relationship.representative) {
      throw new Error('invalid-person')
    }
    await stripeCache.execute('accounts', 'deletePerson', person.stripeid, req.query.personid, req.stripeKey)
    await connect.Storage.Person.destroy({
      where: {
        personid: req.query.personid
      }
    })
    return true
  }
}
