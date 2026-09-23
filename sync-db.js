const { sequelize, User, Author, Book } = require('./models');
const seedDatabase = require('./seed');

async function init() {
  console.log("Starting DB Initialization...");
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    
    // Check if table schemas match the current models
    let needsForceSync = false;
    try {
      await sequelize.sync();
      await User.findOne();
      await Author.findOne();
      await Book.findOne();
    } catch (schemaErr) {
      console.warn("Detected outdated or incompatible database schema. Recreating tables...", schemaErr.message);
      needsForceSync = true;
    }

    if (needsForceSync) {
      await sequelize.sync({ force: true });
    }
    
    const userCount = await User.count();
    const authorCount = await Author.count();
    const bookCount = await Book.count();
    
    if (userCount === 0 || authorCount === 0 || bookCount === 0) {
      console.log('Database empty or incomplete. Running automatic seed on boot...');
      await seedDatabase();
      console.log('Database seeding completed successfully.');
    } else {
      console.log('Database already populated. Skipping auto-seed.');
    }
  } catch (err) {
    console.error("DB Init Error:", err);
    process.exit(1);
  }
}
init();
