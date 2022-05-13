const { Sequelize } = require('sequelize')
const Log = require('@layeredapps/dashboard/src/log.js')('sequelize-stripe-connect-sqlite')

module.exports = async () => {
  const prefixedDatabaseFile = process.env.CONNECT_DATABASE_FILE || process.env.DATABASE_FILE
  const prefixedDatabaseName = process.env.CONNECT_DATABASE || process.env.DATABASE
  let sequelize
  if (prefixedDatabaseFile) {
    sequelize = new Sequelize(prefixedDatabaseName || 'connect', '', '', {
      storage: prefixedDatabaseFile,
      dialect: 'sqlite',
      logging: (sql) => {
        return Log.info(sql)
      },
      pool: {
        max: process.env.CONNECT_MAX_CONNECTIONS || process.env.MAX_CONNECTIONS || 10,
        min: 0,
        idle: process.env.CONNECT_IDLE_CONNECTION_LIMIT || process.env.IDLE_CONNECTION_LIMIT || 10000
      }
    })
  } else {
    sequelize = new Sequelize('sqlite::memory', {
      dialect: 'sqlite',
      logging: (sql) => {
        return Log.info(sql)
      },
      pool: {
        max: process.env.CONNECT_MAX_CONNECTIONS || process.env.MAX_CONNECTIONS || 10,
        min: 0,
        idle: process.env.CONNECT_IDLE_CONNECTION_LIMIT || process.env.IDLE_CONNECTION_LIMIT || 10000
      }
    })
  }
  return sequelize
}
