const { Sequelize } = require('sequelize')
const Log = require('@layeredapps/dashboard/src/log.js')('sequelize-stripe-connect-mssql')

module.exports = async () => {
  const prefixedDatabase = process.env.CONNECT_MSSQL_DATABASE || process.env.MSSQL_DATABASE
  const prefixedUsername = process.env.CONNECT_MSSQL_USERNAME || process.env.MSSQL_USERNAME
  const prefixedPassword = process.env.CONNECT_MSSQL_PASSWORD || process.env.MSSQL_PASSWORD
  const prefixedHost = process.env.CONNECT_MSSQL_HOST || process.env.MSSQL_HOST
  const prefixedPort = process.env.CONNECT_MSSQL_PORT || process.env.MSSQL_PORT
  const sequelize = new Sequelize(prefixedDatabase, prefixedUsername, prefixedPassword, {
    logging: (sql) => {
      return Log.info(sql)
    },
    dialect: 'mssql',
    dialectOptions: {
      driver: 'SQL Server Native Client 11.0'
    },
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
