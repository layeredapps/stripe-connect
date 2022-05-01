const { Sequelize } = require('sequelize')
const Log = require('@layeredapps/dashboard/src/log.js')('sequelize-stripe-connect-postgresql')

module.exports = async () => {
  const prefixedDatabaseURL = process.env.CONNECT_POSTGRESQL_DATABASE_URL || process.env.POSTGRESQL_DATABASE_URL
  const sequelize = new Sequelize(prefixedDatabaseURL, {
    logging: (sql) => {
      return Log.info(sql)
    }
  })
  return sequelize
}
