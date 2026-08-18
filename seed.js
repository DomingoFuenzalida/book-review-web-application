const { sequelize, User, Author, Book, Review, SaleByYear } = require('./models');


function generateSummary() {
  const subjects = ['A brave knight', 'A clever detective', 'A young wizard', 'A rogue AI', 'An ordinary teacher', 'A space explorer', 'A lost prince'];
  const actions = ['uncovers a dark conspiracy', 'journeys to a distant planet', 'fights for justice', 'solves a mysterious murder', 'discovers a hidden magical world', 'tries to survive', 'seeks revenge'];
  const settings = ['in a dystopian future.', 'during the Renaissance.', 'in modern-day New York.', 'in a post-apocalyptic wasteland.', 'in a quiet suburban town.', 'in a cyberpunk city.', 'in ancient Rome.'];
  const keywords = ['magic', 'dragon', 'mystery', 'technology', 'romance', 'war', 'peace', 'aliens', 'vampires', 'zombies', 'science', 'history'];

  const sub = subjects[Math.floor(Math.random() * subjects.length)];
  const act = actions[Math.floor(Math.random() * actions.length)];
  const set = settings[Math.floor(Math.random() * settings.length)];
  const kw = keywords[Math.floor(Math.random() * keywords.length)];
  const kw2 = keywords[Math.floor(Math.random() * keywords.length)];

  return `${sub} ${act} ${set} A gripping tale full of ${kw} and ${kw2}.`;
}

function generateReview(score) {
  const positiveAdjectives = ['amazing', 'fascinating', 'mind-blowing', 'insightful', 'masterful', 'brilliant', 'captivating'];
  const negativeAdjectives = ['terrible', 'boring', 'dull', 'confusing', 'sloppy', 'predictable', 'underwhelming'];
  
  const positivePhrases = ['I could not put it down.', 'Highly recommended!', 'A true masterpiece.', 'Loved the character development.', 'Best book of the year.'];
  const negativePhrases = ['A complete waste of time.', 'Not what I expected.', 'It was okay, I guess.', 'The pacing was too slow.', 'I struggled to finish it.'];

  // Ajustamos el texto según el score aleatorio para que tenga sentido
  const isPositive = score >= 3;
  const adjs = isPositive ? positiveAdjectives : negativeAdjectives;
  const phrases = isPositive ? positivePhrases : negativePhrases;

  const adj = adjs[Math.floor(Math.random() * adjs.length)];
  const phrase = phrases[Math.floor(Math.random() * phrases.length)];

  return `The story was absolutely ${adj}. ${phrase}`;
}


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

  await User.bulkCreate(usersData, { individualHooks: true });
  const users = await User.findAll({ attributes: ['id', 'role'] });

  // 2. Create Authors
  const authorsData = [];
  const countries = ['Chile', 'USA', 'UK', 'Spain', 'Argentina', 'Japan', 'France', 'Italy'];
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
      summary: generateSummary(), 
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
      const randomScore = Math.floor(Math.random() * 5) + 1; // Generamos el score primero
      
      reviewsData.push({
        review: generateReview(randomScore), 
        score: randomScore,
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
  console.log('Database seeded with random vocabulary and hashed passwords.');
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