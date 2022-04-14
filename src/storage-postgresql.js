const { Sequelize } = require('sequelize')

module.exports = async () => {
  const prefixedDatabaseURL = process.env.CONNECT_POSTGRESQL_DATABASE_URL || process.env.POSTGRESQL_DATABASE_URL
  const sequelize = new Sequelize(prefixedDatabaseURL, {
    logging: false
  })
  return sequelize
}
