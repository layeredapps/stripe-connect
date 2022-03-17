const { Sequelize, Model, DataTypes } = require('sequelize')

module.exports = async () => {
  const prefixedDatabase = process.env.CONNECT_MARIADB_DATABASE || process.env.MARIADB_DATABASE
  const prefixedUsername = process.env.CONNECT_MARIADB_USERNAME || process.env.MARIADB_USERNAME
  const prefixedPassword = process.env.CONNECT_MARIADB_PASSWORD || process.env.MARIADB_PASSWORD
  const prefixedHost = process.env.CONNECT_MARIADB_HOST || process.env.MARIADB_HOST
  const prefixedPort = process.env.CONNECT_MARIADB_PORT || process.env.MARIADB_PORT
  const sequelize = new Sequelize(prefixedDatabase, prefixedUsername, prefixedPassword, {
    logging: true,
    dialect: 'mysql',
    host: prefixedHost,
    port: prefixedPort
  })
  class Charge extends Model {}
  Charge.init({
    chargeid: {
      type: DataTypes.STRING,
      primaryKey: true
    },
    accountid: DataTypes.UUID,
    subscriptionid: DataTypes.STRING,
    customerid: DataTypes.STRING,
    paymentmethodid: DataTypes.STRING,
    invoiceid: DataTypes.STRING,
    refundRequested: DataTypes.DATE,
    refundReason: DataTypes.TEXT,
    refundDenied: DataTypes.DATE,
    refundDeniedReason: DataTypes.TEXT,
    object: {
      type: DataTypes.VIRTUAL,
      get () {
        return 'charge'
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
    modelName: 'charge'
  })
  class Coupon extends Model {}
  Coupon.init({
    couponid: {
      type: DataTypes.STRING,
      primaryKey: true
    },
    object: {
      type: DataTypes.VIRTUAL,
      get () {
        return 'coupon'
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
    publishedAt: DataTypes.DATE,
    unpublishedAt: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'coupon'
  })
  class Customer extends Model {}
  Customer.init({
    customerid: {
      type: DataTypes.STRING,
      primaryKey: true
    },
    object: {
      type: DataTypes.VIRTUAL,
      get () {
        return 'customer'
      }
    },
    accountid: DataTypes.UUID,
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
    modelName: 'customer'
  })
  class Dispute extends Model {}
  Dispute.init({
    disputeid: {
      type: DataTypes.STRING,
      primaryKey: true
    },
    object: {
      type: DataTypes.VIRTUAL,
      get () {
        return 'dispute'
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
    modelName: 'dispute'
  })
  class PaymentIntent extends Model {}
  PaymentIntent.init({
    paymentintentid: {
      type: DataTypes.STRING,
      primaryKey: true
    },
    object: {
      type: DataTypes.VIRTUAL,
      get () {
        return 'paymentintent'
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
    accountid: DataTypes.UUID,
    customerid: DataTypes.STRING,
    paymentmethodid: DataTypes.STRING,
    subscriptionid: DataTypes.STRING,
    invoiceid: DataTypes.STRING,
    status: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'paymentintent'
  })
  class SetupIntent extends Model {}
  SetupIntent.init({
    setupintentid: {
      type: DataTypes.STRING,
      primaryKey: true
    },
    accountid: DataTypes.UUID,
    customerid: DataTypes.STRING,
    paymentmethodid: DataTypes.STRING,
    object: {
      type: DataTypes.VIRTUAL,
      get () {
        return 'setupintent'
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
    modelName: 'setupintent'
  })
  class Payout extends Model {}
  Payout.init({
    payoutid: {
      type: DataTypes.STRING,
      primaryKey: true
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
    }
  }, {
    sequelize,
    modelName: 'payout'
  })
  class Refund extends Model {}
  Refund.init({
    refundid: {
      type: DataTypes.STRING,
      primaryKey: true
    },
    object: {
      type: DataTypes.VIRTUAL,
      get () {
        return 'refund'
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
    accountid: DataTypes.UUID,
    subscriptionid: DataTypes.STRING,
    customerid: DataTypes.STRING,
    invoiceid: DataTypes.STRING,
    planid: DataTypes.STRING,
    productid: DataTypes.STRING,
    paymentmethodid: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'refund'
  })
  class PaymentMethod extends Model {}
  PaymentMethod.init({
    paymentmethodid: {
      type: DataTypes.STRING,
      primaryKey: true
    },
    object: {
      type: DataTypes.VIRTUAL,
      get () {
        return 'paymentmethod'
      }
    },
    accountid: DataTypes.UUID,
    customerid: DataTypes.STRING,
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
    modelName: 'paymentmethod'
  })
  class Product extends Model {}
  Product.init({
    productid: {
      type: DataTypes.STRING,
      primaryKey: true
    },
    object: {
      type: DataTypes.VIRTUAL,
      get () {
        return 'product'
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
    publishedAt: DataTypes.DATE,
    unpublishedAt: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'product'
  })
  class Invoice extends Model {}
  Invoice.init({
    invoiceid: {
      type: DataTypes.STRING,
      primaryKey: true
    },
    object: {
      type: DataTypes.VIRTUAL,
      get () {
        return 'invoice'
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
    customerid: DataTypes.STRING,
    subscriptionid: DataTypes.STRING,
    accountid: DataTypes.UUID
  }, {
    sequelize,
    modelName: 'invoice'
  })
  class Plan extends Model {}
  Plan.init({
    planid: {
      type: DataTypes.STRING,
      primaryKey: true
    },
    object: {
      type: DataTypes.VIRTUAL,
      get () {
        return 'plan'
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
    productid: DataTypes.STRING,
    publishedAt: DataTypes.DATE,
    unpublishedAt: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'plan'
  })
  class Subscription extends Model {}
  Subscription.init({
    subscriptionid: {
      type: DataTypes.STRING,
      primaryKey: true
    },
    object: {
      type: DataTypes.VIRTUAL,
      get () {
        return 'subscription'
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
    customerid: DataTypes.STRING,
    accountid: DataTypes.UUID,
    paymentmethodid: DataTypes.STRING,
    productid: DataTypes.STRING,
    planid: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'subscription'
  })
  class UsageRecord extends Model {}
  UsageRecord.init({
    usagerecordid: {
      type: DataTypes.STRING,
      primaryKey: true
    },
    object: {
      type: DataTypes.VIRTUAL,
      get () {
        return 'usagerecord'
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
    customerid: DataTypes.STRING,
    accountid: DataTypes.UUID,
    productid: DataTypes.STRING,
    planid: DataTypes.STRING,
    subscriptionid: DataTypes.STRING,
    subscriptionitemid: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'usagerecord'
  })
  await sequelize.sync()
  return {
    sequelize,
    flush: async () => {
      await Charge.destroy({ where: {} })
      await Coupon.destroy({ where: {} })
      await Customer.destroy({ where: {} })
      await Dispute.destroy({ where: {} })
      await PaymentIntent.destroy({ where: {} })
      await SetupIntent.destroy({ where: {} })
      await Payout.destroy({ where: {} })
      await Refund.destroy({ where: {} })
      await PaymentMethod.destroy({ where: {} })
      await Product.destroy({ where: {} })
      await Invoice.destroy({ where: {} })
      await Plan.destroy({ where: {} })
      await Subscription.destroy({ where: {} })
      await UsageRecord.destroy({ where: {} })
    },
    Charge,
    Coupon,
    Customer,
    Dispute,
    PaymentIntent,
    SetupIntent,
    Payout,
    Refund,
    PaymentMethod,
    Product,
    Invoice,
    Plan,
    Subscription,
    UsageRecord
  }
}
