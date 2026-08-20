const { sequelize, User, Author, Book, Review, SaleByYear } = require('./models');

async function seedDatabase() {
  console.log('Starting automated seed process...');

  // Ensure tables exist before inserting records
  await sequelize.sync();

  // 1. Create Admin and Regular Users
  const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'adminpassword123';
  
  await User.create({
    first_name: 'Admin',
    last_name: 'System',
    username: 'admin',
    email: 'admin@example.com',
    password: adminPassword,
    role: 'admin'
  });

  const usersData = [];
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
  await User.bulkCreate(usersData, { individualHooks: true });
  const users = await User.findAll({ where: { role: 'user' } });
  console.log(`Auto-seeded ${users.length + 1} users.`);

  // 2. Create 50 Authors
  const authorsData = [];
  const countries = ['Chile', 'USA', 'UK', 'Spain', 'Argentina', 'Japan', 'France', 'Germany'];
  for (let i = 1; i <= 50; i++) {
    authorsData.push({
      name: `Author ${i}`,
      birth_date: `19${50 + (i % 40)}-0${(i % 9) + 1}-15`,
      country: countries[i % countries.length],
      description: `Short biography and background for author ${i}.`
    });
  }
  await Author.bulkCreate(authorsData);
  const authors = await Author.findAll();
  console.log(`Auto-seeded ${authors.length} authors.`);

  // 3. Create 300 Books
  const booksData = [];
  const genres = ['fantasy', 'mystery', 'science fiction', 'thriller', 'historical romance'];
  for (let i = 1; i <= 300; i++) {
    const randomAuthor = authors[Math.floor(Math.random() * authors.length)];
    const pubYear = 1995 + (i % 28);
    const genre = genres[i % genres.length];
    booksData.push({
      name: `Book Title ${i}`,
      summary: `A gripping ${genre} novel exploring deep storylines and character arcs.`,
      date_of_publish: `${pubYear}-05-10`,
      author_id: randomAuthor.id
    });
  }
  await Book.bulkCreate(booksData);
  const books = await Book.findAll();
  console.log(`Auto-seeded ${books.length} books.`);

  // 4. Create Reviews & Sales
  const reviewsData = [];
  const salesData = [];

  for (const book of books) {
    const reviewCount = Math.floor(Math.random() * 10) + 1;
    for (let r = 1; r <= reviewCount; r++) {
      const randomUser = users[Math.floor(Math.random() * users.length)];
      reviewsData.push({
        review: `Review #${r} for ${book.name}. Highly engaging storyline!`,
        score: Math.floor(Math.random() * 5) + 1,
        number_of_votes: Math.floor(Math.random() * 50),
        book_id: book.id,
        user_id: randomUser.id
      });
    }

    const startYear = parseInt(book.date_of_publish.split('-')[0], 10);
    for (let y = 0; y < 5; y++) {
      salesData.push({
        year: startYear + y,
        sales: Math.floor(Math.random() * 12000) + 300,
        book_id: book.id
      });
    }
  }

  await Review.bulkCreate(reviewsData);
  await SaleByYear.bulkCreate(salesData);
  console.log('Automated database seeding complete.');
}

module.exports = seedDatabase;