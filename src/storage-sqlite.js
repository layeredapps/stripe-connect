const { Sequelize, Model, DataTypes } = require('sequelize')

module.exports = async () => {
  const prefixedDatabaseFile = process.env.CONNECT_SQLITE_DATABASE_FILE || process.env.SQLITE_DATABASE_FILE
  const prefixedDatabaseName = process.env.CONNECT_SQLITE_DATABASE || process.env.SQLITE_DATABASE
  let sequelize
  if (prefixedDatabaseFile) {
    sequelize = new Sequelize(prefixedDatabaseName || 'connect', '', '', {
      storage: prefixedDatabaseFile,
      dialect: 'sqlite',
      logging: false,
      pool: {
        max: process.env.CONNECT_MAX_CONNECTIONS || process.env.MAX_CONNECTIONS || 10,
        min: 0,
        idle: process.env.CONNECT_IDLE_CONNECTION_LIMIT || process.env.IDLE_CONNECTION_LIMIT || 10000
      }
    })
  } else {
    sequelize = new Sequelize('sqlite::memory', {
      dialect: 'sqlite',
      logging: false,
      pool: {
        max: process.env.CONNECT_MAX_CONNECTIONS || process.env.MAX_CONNECTIONS || 10,
        min: 0,
        idle: process.env.CONNECT_IDLE_CONNECTION_LIMIT || process.env.IDLE_CONNECTION_LIMIT || 10000
      }
    })
  }
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
    tokenUpdate: DataTypes.DATE,
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
    tokenUpdate: DataTypes.DATE,
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
  await sequelize.sync({ force: true, alter: true })
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
