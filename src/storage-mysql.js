const { Sequelize } = require('sequelize')
const Log = require('@layeredapps/dashboard/src/log.js')('sequelize-stripe-connect-mysql')

module.exports = async () => {
  const prefixedDatabase = process.env.CONNECT_MYSQL_DATABASE || process.env.MYSQL_DATABASE
  const prefixedUsername = process.env.CONNECT_MYSQL_USERNAME || process.env.MYSQL_USERNAME
  const prefixedPassword = process.env.CONNECT_MYSQL_PASSWORD || process.env.MYSQL_PASSWORD
  const prefixedHost = process.env.CONNECT_MYSQL_HOST || process.env.MYSQL_HOST
  const prefixedPort = process.env.CONNECT_MYSQL_PORT || process.env.MYSQL_PORT
  const sequelize = new Sequelize(prefixedDatabase, prefixedUsername, prefixedPassword, {
    logging: (sql) => {
      return Log.info(sql)
    },
    dialect: 'mysql',
    host: prefixedHost,
    port: prefixedPort,
    pool: {
      max: process.env.CONNECT_MAX_CONNECTIONS || process.env.MAX_CONNECTIONS || 10,
      min: 0,
      idle: process.env.CONNECT_IDLE_CONNECTION_LIMIT || process.env.IDLE_CONNECTION_LIMIT || 10000
    }
  })
  return sequelize
}
