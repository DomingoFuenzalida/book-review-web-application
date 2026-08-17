const express = require('express');
const router = express.Router();
const { Author } = require('../models');
const { requireAuth } = require('../middleware/auth');

// GET /api/authors (Public)
router.get('/', async (req, res) => {
  try {
    const authors = await Author.findAll();
    res.json(authors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/authors/:id (Public)
router.get('/:id', async (req, res) => {
  try {
    const author = await Author.findByPk(req.params.id);
    if (!author) return res.status(404).json({ error: 'Author not found' });
    res.json(author);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/authors (Requires Auth)
router.post('/', requireAuth, async (req, res) => {
  try {
    const author = await Author.create(req.body);
    res.status(201).json(author);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/authors/:id (Requires Auth)
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const author = await Author.findByPk(req.params.id);
    if (!author) return res.status(404).json({ error: 'Author not found' });

    await author.update(req.body);
    res.json(author);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/authors/:id (Requires Auth)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const deleted = await Author.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).json({ error: 'Author not found' });
    res.json({ message: 'Author deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;