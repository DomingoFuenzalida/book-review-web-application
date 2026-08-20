const { Sequelize } = require('sequelize');
const path = require('path');

const dbPath = process.env.DB_STORAGE_PATH || path.join(__dirname, '..', 'data', 'database.sqlite');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: false,
  // Enforce SQLite Foreign Key constraints in SQL engine
  dialectOptions: {
    // Enables PRAGMA foreign_keys = ON; for SQLite connections
    mode: undefined
  }
});

// Hook to ensure foreign keys are active on every SQLite connection
sequelize.addHook('afterConnect', (connection, config) => {
  if (config.dialect === 'sqlite') {
    connection.run('PRAGMA foreign_keys = ON;');
  }
});

module.exports = sequelize;