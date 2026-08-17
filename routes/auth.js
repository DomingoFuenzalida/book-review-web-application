const express = require('express');
const router = express.Router();
const { User } = require('../models');

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