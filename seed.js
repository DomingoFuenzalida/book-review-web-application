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

  // --- ARRAYS PARA DESCRIPCIONES PSEUDOALEATORIAS ---
  const adjectives = [
    'gripping', 'thought-provoking', 'dark', 'heartwarming', 'mysterious', 
    'action-packed', 'thrilling', 'fast-paced', 'slow-burn', 'romantic', 
    'chilling', 'mind-bending', 'epic', 'quirky', 'emotional', 
    'intense', 'atmospheric', 'hilarious', 'suspenseful', 'magical', 
    'surreal', 'gritty', 'uplifting', 'heartbreaking', 'unpredictable', 
    'spellbinding', 'haunting', 'nostalgic', 'pulse-pounding', 'whimsical'
  ];

  const settings = [
    'in a dystopian future', 'in a small, quiet town', 'across the galaxy', 
    'in 19th-century London', 'in a magical realm', 'in modern-day New York',
    'aboard a derelict spaceship', 'deep within an enchanted forest', 'during the height of the Roman Empire',
    'in a sprawling cyberpunk metropolis', 'on a remote, fog-covered island', 'in a haunted Victorian mansion',
    'in a world where magic is strictly outlawed', 'under the neon lights of Tokyo', 'in the harsh wilderness of the Yukon',
    'in a post-apocalyptic wasteland', 'in a secret subterranean city', 'across a war-torn continent',
    'in a sleepy coastal village with dark secrets', 'on an uncharted planet', 'during the Roaring Twenties',
    'in a parallel universe', 'in a medieval kingdom on the brink of war'
  ];

  const plots = [
    'a detective tries to solve a cold case', 'a group of unlikely heroes must save the world', 
    'long-lost enemies are forced to work together', 'a scientist makes a terrifying discovery', 
    'ordinary people face extraordinary circumstances', 'an ancient prophecy threatens to destroy the kingdom',
    'a young orphan discovers a hidden and dangerous power', 'a seasoned spy is betrayed by their own agency',
    'two star-crossed lovers fight against an unforgiving fate', 'a crew of smugglers takes on one last impossible job',
    'a historian uncovers a conspiracy that rewrites time', 'an artificial intelligence begins to feel human emotions',
    'a family must survive a cataclysmic natural disaster', 'a legendary monster hunter becomes the hunted',
    'a brilliant hacker tries to take down a corrupt mega-corporation', 'a royal heir fights to reclaim their stolen throne',
    'a grieving parent goes to extreme lengths for vengeance', 'an eccentric explorer searches for a mythical lost city',
    'a ghost tries to solve the mystery of its own murder', 'a secret society attempts to summon an ancient deity'
  ];

  const conclusions = [
    'with shocking twists.', 'that will keep you on the edge of your seat.', 
    'challenging everything you know about loyalty.', 'with an unforgettable ending.', 
    'exploring the depths of human nature.', 'blurring the lines between right and wrong.',
    'full of heart-stopping action sequences.', 'that explores the true meaning of family and sacrifice.',
    'leaving you eagerly begging for a sequel.', 'with a romance that transcends the boundaries of time.',
    'that will make you question the fabric of reality itself.', 'leading to a devastating and unexpected betrayal.',
    'culminating in an epic and bloody final battle.', 'with a deeply satisfying and emotional resolution.',
    'packed with dark humor and witty banter.', 'that shines a glaring light on modern societal flaws.',
    'featuring incredibly complex characters and rich world-building.', 'where absolutely nothing is as it seems.',
    'delivering a powerful and timeless message of hope.', 'steeped in layers of mystery and historical intrigue.'
  ];
  // Función para combinar los fragmentos al azar
  const getRandomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];
  
  // 3. Create 300 Books
  const booksData = [];
  const genres = ['fantasy', 'mystery', 'science fiction', 'thriller', 'historical romance'];
  
  for (let i = 1; i <= 300; i++) {
    const randomAuthor = authors[Math.floor(Math.random() * authors.length)];
    const pubYear = 1995 + (i % 28);
    const genre = genres[i % genres.length];
    
    // Generar la descripción pseudoaleatoria
    const randomSummary = `A ${getRandomElement(adjectives)} ${genre} novel set ${getRandomElement(settings)}, where ${getRandomElement(plots)} ${getRandomElement(conclusions)}`;

    booksData.push({
      name: `Book Title ${i}`,
      summary: randomSummary,
      date_of_publish: `${pubYear}-05-10`,
      author_id: randomAuthor.id
    });
  }
  await Book.bulkCreate(booksData);
  const books = await Book.findAll();
  console.log(`Auto-seeded ${books.length} books.`);

  // --- ARRAYS PARA RESEÑAS ---
  const reviewFragments = {
    1: {
      intros: ['Terrible.', 'A complete waste of time.', 'I couldn\'t even finish it.', 'Awful from start to finish.', 'Huge disappointment.', 'Do not read this.', 'I regret buying it.', 'Absolute garbage.'],
      details: ['The plot made no sense at all.', 'Characters were flat and unlikable.', 'The writing was incredibly lazy.', 'It felt like a rough draft.', 'Not worth the paper it\'s printed on.', 'There were plot holes everywhere.'],
      outros: ['Save your money.', 'Avoid at all costs.', 'I am returning my copy.', 'Never reading this author again.', 'A total letdown.', 'Just pretend this book doesn\'t exist.']
    },
    2: {
      intros: ['Not great.', 'Had potential but fell flat.', 'Barely okay.', 'A bit of a letdown.', 'I struggled to get through it.', 'Pretty boring.', 'Underwhelming.', 'Just bad.'],
      details: ['Pacing was all over the place.', 'The ending felt rushed and unearned.', 'It started strong but lost me halfway.', 'Characters made stupid decisions.', 'Needs a lot of editing.', 'I lost interest very quickly.'],
      outros: ['Wait for a sale if you really must read it.', 'Maybe their next book will be better.', 'Disappointing overall.', 'I\'d skip this one.', 'Hard pass.', 'Two stars is being generous.']
    },
    3: {
      intros: ['It was okay.', 'An average read.', 'Right down the middle.', 'Nothing special.', 'A decent way to pass the time.', 'Mixed feelings.', 'Not bad, not great.', 'Serviceable.'],
      details: ['It had some good moments, but dragged in parts.', 'The concept was good, but the execution was just fine.', 'I liked the characters, but the plot was predictable.', 'Forgettable, but not terrible.', 'It\'s exactly what you\'d expect, nothing more.', 'A bit cliché, but readable.'],
      outros: ['Borrow it from a library instead of buying.', 'Good for a lazy Sunday.', 'Take it or leave it.', 'Might appeal to some, but not totally for me.', 'A perfectly average experience.', 'Glad I read it, but won\'t read it again.']
    },
    4: {
      intros: ['Really enjoyed this!', 'A very solid read.', 'Great book overall.', 'Highly entertaining.', 'I was pleasantly surprised.', 'Very good!', 'A page-turner.', 'Worth the time.'],
      details: ['The characters were well-developed.', 'The plot kept me guessing until the very end.', 'A thoroughly enjoyable experience.', 'Very well written with great pacing.', 'I will definitely read more from this author.', 'The world-building was fantastic.'],
      outros: ['Glad I picked it up.', 'Looking forward to the sequel.', 'Would definitely recommend.', 'A solid addition to my shelf.', 'You won\'t regret reading this one.', 'Definitely check it out.']
    },
    5: {
      intros: ['A masterpiece!', 'Absolutely incredible.', 'One of my all-time favorites.', 'Flawless.', 'Simply brilliant.', 'A breathtaking read.', 'I am obsessed!', 'Perfection.'],
      details: ['Every single page was a joy to read.', 'The story will stay with me for a very long time.', 'I couldn\'t recommend this enough.', 'A stunning achievement in writing.', 'Everything about it was perfect.', 'I couldn\'t put it down and stayed up all night reading.'],
      outros: ['Buy it right now.', 'A must-read for everyone.', '10/10 would read again.', 'Already re-reading it!', 'I will be buying copies for all my friends.', 'An instant classic.']
    }
  };

  // 4. Create Reviews & Sales
  const reviewsData = [];
  const salesData = [];

  for (const book of books) {
    // Generar un número aleatorio de reseñas por libro (entre 1 y 10)
    const reviewCount = Math.floor(Math.random() * 10) + 1;
    
    for (let r = 1; r <= reviewCount; r++) {
      const randomUser = users[Math.floor(Math.random() * users.length)];
      
      // 1. Generar la nota (1 al 5)
      const randomScore = Math.floor(Math.random() * 5) + 1;
      
      // 2. Extraer fragmentos basados en esa nota
      const possibleIntros = reviewFragments[randomScore].intros;
      const possibleDetails = reviewFragments[randomScore].details;
      const possibleOutros = reviewFragments[randomScore].outros; // Extraemos los outros
      
      const intro = getRandomElement(possibleIntros);
      const detail = getRandomElement(possibleDetails);
      const outro = getRandomElement(possibleOutros); // Elegimos un outro al azar
      
      reviewsData.push({
        // 3. Juntamos las tres partes
        review: `${intro} ${detail} ${outro}`, 
        score: randomScore,
        number_of_votes: Math.floor(Math.random() * 50),
        book_id: book.id,
        user_id: randomUser.id
      });
    }

    // Generar ventas (se mantiene igual)
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