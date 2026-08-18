const express = require('express');
const path = require('path');
const { sequelize, Author } = require('./models');
const { authenticate } = require('./middleware/auth');
const seedDatabase = require('./seed');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Global Auth Header Middleware
app.use(authenticate);

// Mount Routes
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
    await sequelize.sync({ alter: true });

    const authorCount = await Author.count();
    if (authorCount === 0) {
      console.log('Database empty. Running seed with encrypted admin/users...');
      await seedDatabase();
    }

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Server startup error:', error);
  }
}

startServer();