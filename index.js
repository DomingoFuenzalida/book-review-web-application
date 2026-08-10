const express = require('express');
const { Sequelize, DataTypes } = require('sequelize');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// 1. Configurar Sequelize
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './data/database.sqlite', // Guardado en la carpeta /data
  logging: false // Cambia a true para ver las consultas SQL en consola
});

// 2. Definir un Modelo (Equivalente a una tabla)
const User = sequelize.define('User', {
  nombre: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    unique: true
  }
});

// 3. Rutas de la API
app.get('/users', async (req, res) => {
  const users = await User.findAll();
  res.json(users);
});

app.post('/users', async (req, res) => {
  try {
    const user = await User.create(req.body);
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 4. Sincronizar ORM e iniciar servidor
sequelize.sync().then(() => {
  console.log('Base de datos sincronizada.');
  app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
  });
});