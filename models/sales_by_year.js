'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Sales_by_year extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Sales_by_year.init({
    book_id: DataTypes.INTEGER,
    year: DataTypes.INTEGER,
    sales: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Sales_by_year',
  });
  return Sales_by_year;
};