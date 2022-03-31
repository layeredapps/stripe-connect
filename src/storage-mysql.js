const { Sequelize, Model, DataTypes } = require('sequelize')

module.exports = async () => {
  const prefixedDatabase = process.env.CONNECT_MYSQL_DATABASE || process.env.MYSQL_DATABASE
  const prefixedUsername = process.env.CONNECT_MYSQL_USERNAME || process.env.MYSQL_USERNAME
  const prefixedPassword = process.env.CONNECT_MYSQL_PASSWORD || process.env.MYSQL_PASSWORD
  const prefixedHost = process.env.CONNECT_MYSQL_HOST || process.env.MYSQL_HOST
  const prefixedPort = process.env.CONNECT_MYSQL_PORT || process.env.MYSQL_PORT
  const sequelize = new Sequelize(prefixedDatabase, prefixedUsername, prefixedPassword, {
    logging: true,
    dialect: 'mysql',
    host: prefixedHost,
    port: prefixedPort
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
