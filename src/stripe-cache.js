const Log = require('@layeredapps/dashboard/src/log.js')('stripe-connect')
const packageJSON = require('../package.json')
const stripe = require('stripe')({
  apiVersion: global.stripeAPIVersion,
  telemetry: false,
  maxNetworkRetries: global.maximumStripeRetries || 0,
  appInfo: {
    version: packageJSON.version,
    name: '@layeredapps/stripe-connect',
    url: 'https://github.com/layeredapps/stripe-connect'
  }
})
const util = require('util')

function retriableError (error) {
  if (global.testEnded) {
    return false
  }
  if (error.type === 'StripeConnectionError') {
    return true
  }
  if (error.type === 'StripeAPIError') {
    return true
  }
  if (error.message === 'An error occurred with our connection to Stripe.') {
    return true
  }
  if (!error.raw || !error.raw.code) {
    return false
  }
  if (error.raw.code === 'lock_timeout') {
    return true
  }
  if (error.raw.code === 'rate_limit') {
    return true
  }
  if (error.raw.code === 'idempotency_key_in_use') {
    return true
  }
  if (error.raw.code === 'resource_missing') {
    if (error.raw.param === 'account_token') {
      return false
    }
    if (error.raw.param === 'person_token') {
      return false
    }
    return true
  }
  if (process.env.NODE_ENV === 'testing' && error.raw.code === 'account_invalid') {
    return true
  }
  return false
}

function formatError (error) {
  Log.error('stripe cache error', error)
  if (error.raw && error.raw.param) {
    if (error.raw.param === 'account_token' ||
        error.raw.param === 'person_token') {
      return 'invalid-token'
    }
    let property = error.raw.param.split('[').join('.').split(']').join('')
    switch (property) {
      case 'mcc':
        property = 'business_profile_mcc'
        break
      case 'title':
        property = 'relationship.title'
        break
      case 'percent_ownership':
        property = 'relationship.percent_ownership'
        break
    }
    return `invalid-${property}`
  }
  if (error.raw.code === 'account_invalid') {
    return 'invalid-stripeid'
  }
  return 'unknown-error'
}

function execute (group, method, p1, p2, p3, p4, p5, callback) {
  if (!callback) {
    if (p5) {
      callback = p5
      p5 = null
    } else if (p4) {
      callback = p4
      p4 = null
    } else if (p3) {
      callback = p3
      p3 = null
    } else if (p2) {
      callback = p2
      p2 = null
    } else if (p1) {
      callback = p1
      p1 = null
    }
  }
  Log.info('stripe query', group, method, p1, p2, p3, p4, p5)
  if (p5) {
    return stripe[group][method](p1, p2, p3, p4, p5, (error, result) => {
      if (!error) {
        return callback(null, result)
      }
      const retry = retriableError(error)
      if (retry) {
        return execute(group, method, p1, p2, p3, p4, p5, callback)
      }
      return callback(new Error(formatError(error)))
    })
  } else if (p4) {
    return stripe[group][method](p1, p2, p3, p4, (error, result) => {
      if (!error) {
        return callback(null, result)
      }
      const retry = retriableError(error)
      if (retry) {
        return execute(group, method, p1, p2, p3, p4, p5, callback)
      }
      return callback(new Error(formatError(error)))
    })
  } else if (p3) {
    return stripe[group][method](p1, p2, p3, (error, result) => {
      if (!error) {
        return callback(null, result)
      }
      const retry = retriableError(error)
      if (retry) {
        return execute(group, method, p1, p2, p3, p4, p5, callback)
      }
      return callback(new Error(formatError(error)))
    })
  } else if (p2) {
    return stripe[group][method](p1, p2, (error, result) => {
      if (!error) {
        return callback(null, result)
      }
      const retry = retriableError(error)
      if (retry) {
        return execute(group, method, p1, p2, p3, p4, p5, callback)
      }
      return callback(new Error(formatError(error)))
    })
  } else if (p1) {
    return stripe[group][method](p1, (error, result) => {
      if (!error) {
        return callback(null, result)
      }
      const retry = retriableError(error)
      if (retry) {
        return execute(group, method, p1, p2, p3, p4, p5, callback)
      }
      return callback(new Error(formatError(error)))
    })
  }
}

const stripeCache = module.exports = {
  execute: util.promisify(execute),
  retrieve: async (id, group, stripeKey) => {
    if (global.testEnded) {
      return
    }
    const object = await stripeCache.execute(group, 'retrieve', id, stripeKey)
    return object
  },
  retrievePerson: async (stripeid, personid, stripeKey) => {
    if (global.testEnded) {
      return
    }
    const object = await stripeCache.execute('accounts', 'retrievePerson', stripeid, personid, stripeKey)
    return object
  }
}
