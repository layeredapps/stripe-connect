const { Model, DataTypes } = require('sequelize')
const metrics = require('@layeredapps/dashboard/src/metrics.js')

module.exports = async () => {
  let storage, dateType
  const prefixedStorage = process.env.CONNECT_STORAGE || process.env.STORAGE
  switch (prefixedStorage) {
    case 'postgresql':
    case 'postgres':
      storage = require('./storage-postgresql.js')
      dateType = DataTypes.DATE
      break
    case 'mariadb':
      storage = require('./storage-mariadb.js')
      dateType = DataTypes.DATE(6)
      break
    case 'mysql':
      storage = require('./storage-mysql.js')
      dateType = DataTypes.DATE(6)
      break
    case 'db2':
      storage = require('./storage-db2.js')
      dateType = DataTypes.DATE
      break
    case 'mssql':
      storage = require('./storage-mssql.js')
      dateType = DataTypes.DATE
      break
    case 'sqlite':
    default:
      storage = require('./storage-sqlite.js')
      dateType = DataTypes.DATE
      break
  }
  const sequelize = await storage()
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
  await sequelize.sync({ force: true, alter: true })
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
        await Payout.destroy({ where: {} })
        await Person.destroy({ where: {} })
        await StripeAccount.destroy({ where: {} })
      }
    },
    CountrySpec,
    Payout,
    Person,
    StripeAccount
  }
}
