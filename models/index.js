const sequelize = require('../config/database');
const User = require('./User');
const Author = require('./Author');
const Book = require('./Book');
const Review = require('./Review');
const SaleByYear = require('./SaleByYear');

// Author <-> Book
Author.hasMany(Book, { foreignKey: 'author_id', onDelete: 'CASCADE' });
Book.belongsTo(Author, { foreignKey: 'author_id' });

// Book <-> Review
Book.hasMany(Review, { foreignKey: 'book_id', onDelete: 'CASCADE' });
Review.belongsTo(Book, { foreignKey: 'book_id' });

// User <-> Review
User.hasMany(Review, { foreignKey: 'user_id', onDelete: 'CASCADE' });
Review.belongsTo(User, { foreignKey: 'user_id' });

// Book <-> SaleByYear
Book.hasMany(SaleByYear, { foreignKey: 'book_id', onDelete: 'CASCADE' });
SaleByYear.belongsTo(Book, { foreignKey: 'book_id' });

module.exports = {
  sequelize,
  User,
  Author,
  Book,
  Review,
  SaleByYear
};