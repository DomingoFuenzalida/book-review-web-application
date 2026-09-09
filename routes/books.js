const express = require('express');
const router = express.Router();
const { Book, Author, Review } = require('../models');
const { requireAuth } = require('../middleware/auth');
const { delCache } = require('../utils/cache');
const { useSearch, searchBooks, syncBookToSearch, deleteBookFromSearch } = require('../utils/search');
const { Op } = require('sequelize');

// GET /api/books/search (Public)
router.get('/search', async (req, res) => {
  try {
    const { q, page = 1 } = req.query;
    const perPage = 10;
    const currentPage = parseInt(page);

    if (useSearch) {
      const result = await searchBooks(q, currentPage, perPage);
      if (result) {
        return res.json({
          data: result.hits,
          total: result.total,
          page: currentPage,
          per_page: perPage
        });
      }
    }

    // Fallback: DB query LIKE on summary
    const whereClause = {};

    if (q && q.trim() !== '') {
      whereClause.summary = {
        [Op.like]: `%${q.trim()}%`
      };
    }

    const { count, rows } = await Book.findAndCountAll({
      where: whereClause,
      include: [
        { model: Author, attributes: ['id', 'name', 'country'] },
        { model: Review, attributes: [], required: false }
      ],
      distinct: true,
      limit: perPage,
      offset: (currentPage - 1) * perPage
    });

        res.json({
          data: rows,
          total: count,
          page: currentPage,
          per_page: perPage
        });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });

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
    await delCache([
      'authors-overview',
      'top-10-rated',
      'top-50-selling',
      `author-${book.author_id}`
    ]);

    // Sync to search
    await syncBookToSearch(book, []);

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
    const oldAuthorId = book.author_id;
    await book.update(req.body);
    await delCache([
      'authors-overview',
      'top-10-rated',
      'top-50-selling',
      `author-${oldAuthorId}`,
      `author-${book.author_id}`
    ]);

    // Sync to search
    const reviews = await Review.findAll({ where: { book_id: book.id } });
    await syncBookToSearch(book, reviews);

    res.json(book);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/books/:id (Requires Auth)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const book = await Book.findByPk(req.params.id);
    if (!book) return res.status(404).json({ error: 'Book not found' });
    const author_id = book.author_id;
    const book_id = book.id;
    await book.destroy();
    await delCache([
      'authors-overview',
      'top-10-rated',
      'top-50-selling',
      `author-${author_id}`
    ]);

    // Sync to search
    await deleteBookFromSearch(book_id);

    res.json({ message: 'Book deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;