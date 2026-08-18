const express = require('express');
const router = express.Router();
const { User } = require('../models');

// POST /api/auth/register (Public Account Creation)
router.post('/register', async (req, res) => {
  const { first_name, last_name, username, email, password } = req.body;

  if (!first_name || !last_name || !username || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const user = await User.create({
      first_name,
      last_name,
      username,
      email,
      password,
      role: 'user' // Default to standard user
    });

    const result = user.toJSON();
    delete result.password;
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/auth/login (Existing Login)
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ where: { username } });
    if (!user || !(await user.validPassword(password))) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    res.json({
      id: user.id,
      username: user.username,
      first_name: user.first_name,
      role: user.role
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;