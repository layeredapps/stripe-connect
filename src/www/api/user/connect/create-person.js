const connect = require('../../../../../index.js')
const stripeCache = require('../../../../stripe-cache.js')

module.exports = {
  post: async (req) => {
    if (!req.query || !req.query.stripeid) {
      throw new Error('invalid-stripeid')
    }
    if (!req.body) {
      throw new Error('invalid-selection')
    }
    const stripeAccount = await global.api.user.connect.StripeAccount.get(req)
    if (!stripeAccount) {
      throw new Error('invalid-stripeid')
    }
    if (stripeAccount.stripeObject.business_type !== 'company') {
      throw new Error('invalid-stripe-account')
    }
    if (!req.body.relationship_representative &&
        !req.body.relationship_director &&
        !req.body.relationship_owner &&
        !req.body.relationship_executive) {
      throw new Error('invalid-selection')
    }
    // TODO: the 5000 character limit is from Stripe
    // they'll probably change it so monitor this
    if (!req.body.relationship_title ||
        !req.body.relationship_title.length ||
        req.body.relationship_title.length > 5000) {
      throw new Error('invalid-relationship_title')
    }
    if (!req.body.relationship_percent_ownership) {
      throw new Error('invalid-relationship_percent_ownership')
    }
    let percent
    try {
      percent = parseFloat(req.body.relationship_percent_ownership, 10)
    } catch (s) {
      throw new Error('invalid-relationship_percent_ownership')
    }
    // TODO: 0% ownership throws an error on Stripe if the person is not 'owner=true'
    if ((!percent && percent !== 0) || percent > 100 || percent < 0) {
      throw new Error('invalid-relationship_percent_ownership')
    }
    if (percent === 0) {
      if (req.body.relationship_owner) {
        throw new Error('invalid-relationship_percent_ownership')
      }
      delete (req.body.relationship_percent_ownership)
    }
    const personInfo = {
      relationship: {
        title: req.body.relationship_title
      }
    }
    if (req.body.relationship_percent_ownership) {
      personInfo.relationship.percent_ownership = req.body.relationship_percent_ownership
    }
    if (req.body.relationship_representative) {
      personInfo.relationship.representative = true
    }
    if (req.body.relationship_executive === 'true') {
      if (!personInfo.relationship.representative && !stripeAccount.requiresExecutives) {
        throw new Error('invalid-stripe-account')
      }
      personInfo.relationship.executive = req.body.relationship_executive || false
    }
    if (req.body.relationship_director === 'true') {
      if (!stripeAccount.requiresDirectors) {
        throw new Error('invalid-stripe-account')
      }
      personInfo.relationship.director = req.body.relationship_director || false
    }
    if (req.body.relationship_owner === 'true') {
      if (!stripeAccount.requiresOwners) {
        throw new Error('invalid-stripe-account')
      }
      personInfo.relationship.owner = req.body.relationship_owner || false
    }
    try {
      const person = await stripeCache.execute('accounts', 'createPerson', req.query.stripeid, personInfo, req.stripeKey)
      await connect.Storage.Person.create({
        appid: req.appid || global.appid,
        personid: person.id,
        accountid: req.account.accountid,
        stripeid: stripeAccount.stripeid,
        stripeObject: person
      })
      req.query.personid = person.id
      return global.api.user.connect.Person.get(req)
    } catch (error) {
      if (error.message.startsWith('invalid-')) {
        throw new Error(error.message.split('.').join('_'))
      }
      throw error
    }
  }
}
