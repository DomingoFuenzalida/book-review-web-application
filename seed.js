const { sequelize, User, Author, Book, Review, SaleByYear } = require('./models');

async function seedDatabase() {
  console.log('Seeding database with admin & hashed passwords...');

  // 1. Create Admin and Regular Users
  const usersData = [
    {
      first_name: 'Admin',
      last_name: 'System',
      username: 'admin',
      email: 'admin@example.com',
      password: 'adminpassword123',
      role: 'admin'
    }
  ];

  for (let i = 1; i <= 20; i++) {
    usersData.push({
      first_name: `UserFirst${i}`,
      last_name: `UserLast${i}`,
      username: `user_${i}`,
      email: `user${i}@example.com`,
      password: 'password123',
      role: 'user'
    });
  }

  // Use individualHooks: true so the bcrypt beforeCreate hook runs
  await User.bulkCreate(usersData, { individualHooks: true });
  const users = await User.findAll({ attributes: ['id', 'role'] });

  // 2. Create Authors
  const authorsData = [];
  const countries = ['Chile', 'USA', 'UK', 'Spain', 'Argentina', 'Japan'];
  for (let i = 1; i <= 50; i++) {
    authorsData.push({
      name: `Author ${i}`,
      birth_date: `19${50 + (i % 40)}-0${(i % 9) + 1}-15`,
      country: countries[i % countries.length],
      description: `Short biography for author ${i}.`
    });
  }
  await Author.bulkCreate(authorsData);
  const authors = await Author.findAll({ attributes: ['id'] });

  // 3. Create Books
  const booksData = [];
  for (let i = 1; i <= 300; i++) {
    const randomAuthor = authors[Math.floor(Math.random() * authors.length)];
    const pubYear = 1995 + (i % 28);
    booksData.push({
      name: `Book Title ${i}`,
      summary: `Summary of Book ${i} with deep storylines.`,
      date_of_publish: `${pubYear}-06-15`,
      author_id: randomAuthor.id
    });
  }
  await Book.bulkCreate(booksData);
  const books = await Book.findAll({ attributes: ['id', 'date_of_publish'] });

  // 4. Create Reviews & Sales
  const reviewsData = [];
  const salesData = [];
  const regularUsers = users.filter(u => u.role === 'user');

  for (const book of books) {
    const reviewCount = Math.floor(Math.random() * 10) + 1;
    for (let r = 1; r <= reviewCount; r++) {
      const randomUser = regularUsers[Math.floor(Math.random() * regularUsers.length)];
      reviewsData.push({
        review: `Review #${r} for book ID ${book.id}`,
        score: Math.floor(Math.random() * 5) + 1,
        number_of_votes: Math.floor(Math.random() * 100),
        book_id: book.id,
        user_id: randomUser.id
      });
    }

    const startYear = parseInt(book.date_of_publish.split('-')[0], 10);
    for (let y = 0; y < 5; y++) {
      salesData.push({
        year: startYear + y,
        sales: Math.floor(Math.random() * 15000) + 200,
        book_id: book.id
      });
    }
  }

  await Review.bulkCreate(reviewsData);
  await SaleByYear.bulkCreate(salesData);
  console.log('Database seeded with hashed passwords.');
}

if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = seedDatabase;