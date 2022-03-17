const connect = require('../../../../../index.js')

module.exports = {
  get: async (req) => {
    if (!req.query || !req.query.personid) {
      throw new Error('invalid-personid')
    }
    const personInfo = await connect.Storage.Person.findOne({
      where: {
        personid: req.query.personid
      }
    })
    if (!personInfo) {
      throw new Error('invalid-personid')
    }
    if (personInfo.dataValues.accountid !== req.account.accountid) {
      throw new Error('invalid-account')
    }
    const person = {}
    for (const field of personInfo._options.attributes) {
      person[field] = personInfo.get(field)
    }
    return person
  }
}
