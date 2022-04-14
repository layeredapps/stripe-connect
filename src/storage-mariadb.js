const { Sequelize } = require('sequelize')

module.exports = async () => {
  const prefixedDatabase = process.env.CONNECT_MARIADB_DATABASE || process.env.MARIADB_DATABASE
  const prefixedUsername = process.env.CONNECT_MARIADB_USERNAME || process.env.MARIADB_USERNAME
  const prefixedPassword = process.env.CONNECT_MARIADB_PASSWORD || process.env.MARIADB_PASSWORD
  const prefixedHost = process.env.CONNECT_MARIADB_HOST || process.env.MARIADB_HOST
  const prefixedPort = process.env.CONNECT_MARIADB_PORT || process.env.MARIADB_PORT
  const sequelize = new Sequelize(prefixedDatabase, prefixedUsername, prefixedPassword, {
    logging: false,
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
