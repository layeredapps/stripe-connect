const { Sequelize, Model, DataTypes } = require('sequelize')
const metrics = require('@layeredapps/dashboard/src/metrics.js')
const Log = require('@layeredapps/dashboard/src/log.js')('sequelize-stripe-connect')

module.exports = async () => {
  let dateType
  const prefixedStorage = process.env.CONNECT_STORAGE || process.env.STORAGE || 'sqlite'
  switch (prefixedStorage) {
    case 'mariadb':
    case 'mysql':
      dateType = DataTypes.DATE(6)
      break
    case 'postgresql':
    case 'postgres':
    case 'db2':
    case 'mssql':
    case 'sqlite':
    default:
      dateType = DataTypes.DATE
      break
  }
  const sequelize = await createConnection(prefixedStorage)
  class CountrySpec extends Model {}
  CountrySpec.init({
    countryid: {
      type: DataTypes.STRING(2),
      primaryKey: true,
      allowNull: false
    },
    object: {
      type: DataTypes.VIRTUAL,
      get () {
        return 'countrySpec'
      }
    },
    stripeObject: {
      type: DataTypes.TEXT,
      get () {
        const raw = this.getDataValue('stripeObject')
        if (raw) {
          return JSON.parse(raw)
        }
      },
      set (value) {
        this.setDataValue('stripeObject', JSON.stringify(value))
      }
    },
    // 'createdAt' is specified for each model because mysql/mariadb truncate
    // the ms and this makes the return order unpredictable and throws off the
    // test suites expecting the write order to match the return order
    createdAt: {
      type: dateType,
      allowNull: true,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'countrySpec'
  })
  class Person extends Model {}
  Person.init({
    personid: {
      type: DataTypes.STRING(64),
      primaryKey: true,
      allowNull: false
    },
    object: {
      type: DataTypes.VIRTUAL,
      get () {
        return 'person'
      }
    },
    accountid: DataTypes.STRING(64),
    stripeid: DataTypes.TEXT,
    tokenUpdate: dateType,
    stripeObject: {
      type: DataTypes.TEXT,
      get () {
        const raw = this.getDataValue('stripeObject')
        if (raw) {
          return JSON.parse(raw)
        }
      },
      set (value) {
        this.setDataValue('stripeObject', JSON.stringify(value))
      }
    },
    appid: {
      type: DataTypes.STRING,
      defaultValue: global.appid
    },
    // 'createdAt' is specified for each model because mysql/mariadb truncate
    // the ms and this makes the return order unpredictable and throws off the
    // test suites expecting the write order to match the return order
    createdAt: {
      type: dateType,
      allowNull: true,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'person'
  })
  class StripeAccount extends Model {}
  StripeAccount.init({
    stripeid: {
      type: DataTypes.STRING(64),
      primaryKey: true,
      allowNull: false
    },
    object: {
      type: DataTypes.VIRTUAL,
      get () {
        return 'stripeAccount'
      }
    },
    accountid: DataTypes.STRING(64),
    tokenUpdate: dateType,
    stripeObject: {
      type: DataTypes.TEXT,
      get () {
        const raw = this.getDataValue('stripeObject')
        if (raw) {
          return JSON.parse(raw)
        }
      },
      set (value) {
        this.setDataValue('stripeObject', JSON.stringify(value))
      }
    },
    requiresOwners: DataTypes.BOOLEAN,
    requiresDirectors: DataTypes.BOOLEAN,
    requiresExecutives: DataTypes.BOOLEAN,
    submittedAt: {
      type: dateType,
      get () {
        const value = this.getDataValue('submittedAt')
        return value || undefined
      }
    },
    appid: {
      type: DataTypes.STRING,
      defaultValue: global.appid
    },
    // 'createdAt' is specified for each model because mysql/mariadb truncate
    // the ms and this makes the return order unpredictable and throws off the
    // test suites expecting the write order to match the return order
    createdAt: {
      type: dateType,
      allowNull: true,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'stripeAccount'
  })
  class Payout extends Model {}
  Payout.init({
    payoutid: {
      type: DataTypes.STRING(64),
      primaryKey: true,
      allowNull: false
    },
    object: {
      type: DataTypes.VIRTUAL,
      get () {
        return 'payout'
      }
    },
    stripeObject: {
      type: DataTypes.TEXT,
      get () {
        const raw = this.getDataValue('stripeObject')
        if (raw) {
          return JSON.parse(raw)
        }
      },
      set (value) {
        this.setDataValue('stripeObject', JSON.stringify(value))
      }
    },
    accountid: DataTypes.STRING(64),
    stripeid: DataTypes.TEXT,
    appid: {
      type: DataTypes.STRING,
      defaultValue: global.appid
    },
    // 'createdAt' is specified for each model because mysql/mariadb truncate
    // the ms and this makes the return order unpredictable and throws off the
    // test suites expecting the write order to match the return order
    createdAt: {
      type: dateType,
      allowNull: true,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'payout'
  })
  // table creation
  await sequelize.sync()
  // exception logging
  const originalQuery = sequelize.query
  sequelize.query = function () {
    return originalQuery.apply(this, arguments).catch((error) => {
      Log.error(error)
      throw error
    })
  }
  // metrics
  StripeAccount.afterCreate(async (object) => {
    if (global.disableMetrics) {
      return
    }
    await metrics.aggregate(object.dataValues.appid, 'stripe-accounts-created', object.createdAt)
  })
  StripeAccount.beforeBulkUpdate(async (object) => {
    if (global.disableMetrics) {
      return
    }
    const stripeObject = JSON.parse(object.attributes.stripeObject)
    const existing = await StripeAccount.findOne({ where: object.where })
    if (!existing) {
      return
    }
    const existingStripeObject = JSON.parse(existing.dataValues.stripeObject)
    if (stripeObject.payouts_enabled && !existingStripeObject.payouts_enabled) {
      await metrics.aggregate(existing.dataValues.appid, 'stripe-accounts-approved', new Date())
    }
  })
  Payout.afterCreate(async (object) => {
    if (global.disableMetrics) {
      return
    }
    const stripeObject = JSON.parse(object.dataValues.stripeObject)
    await metrics.aggregate(object.dataValues.appid, 'payouts-created', object.createdAt)
    await metrics.aggregate(object.dataValues.appid, 'payouts-amount', object.createdAt, stripeObject.amount)
  })
  return {
    sequelize,
    flush: async () => {
      if (process.env.NODE_ENV === 'testing') {
        await Payout.sync({ force: true })
        await Person.sync({ force: true })
        await StripeAccount.sync({ force: true })
      }
    },
    CountrySpec,
    Payout,
    Person,
    StripeAccount
  }
}

async function createConnection (dialect) {
  // sqlite
  if (dialect === 'sqlite') {
    const databaseFile = process.env.CONNECT_DATABASE_FILE || process.env.DATABASE_FILE
    if (databaseFile) {
      return new Sequelize(process.env.DATABASE || 'dashboard', '', '', {
        storage: databaseFile,
        dialect: 'sqlite',
        logging: (sql) => {
          return Log.info(sql)
        }
      })
    } else {
      return new Sequelize('sqlite::memory', {
        dialect: 'sqlite',
        logging: (sql) => {
          return Log.info(sql)
        }
      })
    }
  }
  // all other databases
  let url = global.connectDatabaseURL || process.env.CONNECT_DATABASE_URL || global.databaseURL || process.env.DATABASE_URL
  const sslModeRequiredIndex = url.indexOf('?sslmode=require')
  const dialectOptions = {}
  if (sslModeRequiredIndex > -1) {
    url = url.substring(0, sslModeRequiredIndex)
    dialectOptions.ssl = {
      require: true,
      rejectUnauthorized: false
    }
    dialectOptions.keepAlive = true
  }
  if (dialect === 'mssql') {
    dialectOptions.driver = 'SQL Server Native Client 11.0'
  }
  const pool = {
    max: process.env.CONNECT_MAX_CONNECTIONS || process.env.MAX_CONNECTIONS || 10,
    min: 0,
    idle: process.env.CONNECT_IDLE_CONNECION_LIMIT || process.env.IDLE_CONNECTION_LIMIT || 10000
  }
  const replicationEnabled = process.env.CONNECT_REPLICATION || process.env.STORAGE_REPLICATION
  if (replicationEnabled) {
    const replication = {
      read: [],
      write: parseConnectionString(url)
    }
    let i = 1
    while (true) {
      if (!global[`connectReadDatabaseURL${i}`] && !process.env[`CONNECT_READ_DATABASE_URL${i}`] && !global[`readDatabaseURL${i}`] && !process.env[`READ_DATABASE_URL${i}`]) {
        break
      }
      replication.read.push(parseConnectionString(
        global[`connectReadDatabaseURL${i}`] || process.env[`CONNECT_READ_DATABASE_URL${i}`] || global[`readDatabaseURL${i}`] || process.env[`READ_DATABASE_URL${i}`]
      ))
      i++
    }
    const sequelize = new Sequelize({
      dialect,
      dialectOptions,
      replication,
      pool,
      logging: (sql) => {
        return Log.info(sql)
      }
    })
    return sequelize
  }

  const sequelize = new Sequelize(url, {
    dialect,
    dialectOptions,
    pool,
    logging: (sql) => {
      return Log.info(sql)
    }
  })
  return sequelize
}

function parseConnectionString (url) {
  // dialect://username:password@host:port/database
  if (url.indexOf('://') > -1) {
    const urlParts = url.parse(url, true)
    const object = {}
    object.host = urlParts.hostname
    if (urlParts.pathname) {
      object.database = urlParts.pathname.replace(/^\//, '')
    }
    if (urlParts.port) {
      object.port = urlParts.port
    }
    if (urlParts.auth) {
      const authParts = urlParts.auth.split(':')
      object.username = authParts[0]
      if (authParts.length > 1) {
        object.password = authParts.slice(1).join(':')
      }
    }
    return object
  }
  // User Id=X;Password=X;Server=X;Database=X;Port=X
  const params = url.split(';')
  const rawParams = {}
  for (const param of params) {
    const parts = param.split('=')
    rawParams[parts[0]] = parts.slice(1).join('=')
  }
  const object = {}
  object.host = rawParams.Server || rawParams.server
  object.username = rawParams['User Id'] || rawParams['user id']
  object.password = rawParams.Password || rawParams.password
  object.database = rawParams.Database || rawParams.database
  object.port = rawParams.Port || rawParams.port
  return object
}
