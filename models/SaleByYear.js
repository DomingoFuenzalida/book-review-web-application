const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SaleByYear = sequelize.define('SaleByYear', {
  year: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  sales: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  book_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'books',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
  }
}, {
  tableName: 'sales_by_years',
  timestamps: true,
  indexes: [
    {
      // SQL Unique constraint: a book only has one sales figure per year
      unique: true,
      fields: ['book_id', 'year']
    }
  ]
});

module.exports = SaleByYear;