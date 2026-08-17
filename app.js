const express = require('express');
const { sequelize } = require('./models');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Synchronize database schema directly on startup
async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('Database connected.');

    // sync creates tables automatically if they don't exist
    await sequelize.sync({ alter: true });
    console.log('Database synced successfully.');

    app.listen(PORT, () => {
      console.log(`Server listening on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to initialize database:', error);
  }
}

startServer();