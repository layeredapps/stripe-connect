const { Sequelize, Model, DataTypes } = require('sequelize')

module.exports = async () => {
  const prefixedDatabase = process.env.CONNECT_DB2_DATABASE || process.env.DB2_DATABASE
  const prefixedUsername = process.env.CONNECT_DB2_USERNAME || process.env.DB2_USERNAME
  const prefixedPassword = process.env.CONNECT_DB2_PASSWORD || process.env.DB2_PASSWORD
  const prefixedHost = process.env.CONNECT_DB2_HOST || process.env.DB2_HOST
  const prefixedPort = process.env.CONNECT_DB2_PORT || process.env.DB2_PORT
  const sequelize = new Sequelize(prefixedDatabase, prefixedUsername, prefixedPassword, {
    logging: true,
    dialect: 'db2',
    host: prefixedHost,
    port: prefixedPort,
    pool: {
      max: process.env.CONNECT_MAX_CONNECTIONS || process.env.MAX_CONNECTIONS || 10,
      min: 0,
      idle: process.env.CONNECT_IDLE_CONNECTION_LIMIT || process.env.IDLE_CONNECTION_LIMIT || 10000
    }
  })
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
    }
  }, {
    sequelize,
    modelName: 'countrySpec'
  })
  class Person extends Model {}
  Person.init({
    personid: {
      type: DataTypes.STRING(32),
      primaryKey: true,
      allowNull: false
    },
    object: {
      type: DataTypes.VIRTUAL,
      get () {
        return 'person'
      }
    },
    accountid: DataTypes.STRING(32),
    stripeid: DataTypes.TEXT,
    token: DataTypes.TEXT,
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
    }
  }, {
    sequelize,
    modelName: 'person'
  })
  class StripeAccount extends Model {}
  StripeAccount.init({
    stripeid: {
      type: DataTypes.STRING(32),
      primaryKey: true,
      allowNull: false
    },
    object: {
      type: DataTypes.VIRTUAL,
      get () {
        return 'stripeAccount'
      }
    },
    accountid: DataTypes.STRING(32),
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
      type: DataTypes.DATE,
      get () {
        const value = this.getDataValue('submittedAt')
        return value || undefined
      }
    }
  }, {
    sequelize,
    modelName: 'stripeAccount'
  })
  class Payout extends Model {}
  Payout.init({
    payoutid: {
      type: DataTypes.STRING(32),
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
    accountid: DataTypes.STRING(32),
    stripeid: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'payout'
  })
  await sequelize.sync()
  return {
    sequelize,
    flush: async () => {
      await StripeAccount.destroy({ where: {} })
      await Person.destroy({ where: {} })
      await Payout.destroy({ where: {} })
    },
    CountrySpec,
    Person,
    StripeAccount,
    Payout
  }
}
