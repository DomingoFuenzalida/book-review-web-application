const express = require('express');
const path = require('path');
const { sequelize, User, Author } = require('./models');
const { authenticate } = require('./middleware/auth');
const seedDatabase = require('./seed');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Global Auth Header Middleware
app.use(authenticate);

// API CRUD Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/authors', require('./routes/authors'));
app.use('/api/books', require('./routes/books'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/sales', require('./routes/sales'));
app.use('/api/users', require('./routes/users'));
app.use('/api/reports', require('./routes/reports'));

async function startServer() {
  try {
    await sequelize.authenticate();
    // Sync schemas automatically
    await sequelize.sync({ alter: true });

    // Check if seeding is needed
    const userCount = await User.count();
    const authorCount = await Author.count();

    if (userCount === 0 || authorCount === 0) {
      console.log('Database empty. Running automatic seed on boot...');
      await seedDatabase();
    } else {
      console.log('Database already populated. Skipping auto-seed.');
    }

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running at http://0.0.0.0:${PORT}`);
    });
  } catch (error) {
    console.error('Server startup error:', error);
  }
}

startServer();