const express = require('express');
const path = require('path');
const { sequelize, User, Author } = require('./models');
const { authenticate } = require('./middleware/auth');
const seedDatabase = require('./seed');
const { initializeSearch, syncAllBooksToSearch } = require('./utils/search');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.USE_PROXY !== 'true') {
  app.use(express.static(path.join(__dirname, 'public')));
  app.use('/uploads', express.static(process.env.STORAGE_PATH || path.join(__dirname, 'public/uploads')));
} else {
  // Only serve API, static files should be served by proxy
  app.get('/', (req, res) => res.send('API is running. Static files are served by the proxy.'));
}

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
    await sequelize.sync();

    initializeSearch().then(async (initialized) => {
      if (initialized) {
        await syncAllBooksToSearch();
        console.log('Elasticsearch books index synchronized.');
      } else {
        console.error('Elasticsearch unavailable; search indexing skipped for this startup.');
      }
    }).catch(error => {
      console.error('Elasticsearch synchronization failed:', error);
    });
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running at http://0.0.0.0:${PORT}`);
    });
  } catch (error) {
    console.error('Server startup error:', error);
  }
}

startServer();