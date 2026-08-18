const express = require('express');
const router = express.Router();
const { Book, Author } = require('../models');
const { requireAuth } = require('../middleware/auth');

// GET /api/books (Public)
router.get('/', async (req, res) => {
  try {
    const { author_id } = req.query;
    const whereClause = {};
    if (author_id) {
      whereClause.author_id = author_id;
    }
    const books = await Book.findAll({
      where: whereClause,
      include: [{ model: Author, attributes: ['id', 'name', 'country'] }]
    });
    
    res.json(books);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/books/:id (Public)
router.get('/:id', async (req, res) => {
  try {
    const book = await Book.findByPk(req.params.id, {
      include: [{ model: Author, attributes: ['id', 'name', 'country'] }]
    });
    if (!book) return res.status(404).json({ error: 'Book not found' });
    res.json(book);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/books (Requires Auth)
router.post('/', requireAuth, async (req, res) => {
  try {
    const book = await Book.create(req.body);
    res.status(201).json(book);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/books/:id (Requires Auth)
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const book = await Book.findByPk(req.params.id);
    if (!book) return res.status(404).json({ error: 'Book not found' });

    await book.update(req.body);
    res.json(book);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/books/:id (Requires Auth)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const deleted = await Book.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).json({ error: 'Book not found' });
    res.json({ message: 'Book deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;