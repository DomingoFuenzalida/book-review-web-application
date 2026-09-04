const express = require('express');
const router = express.Router();
const { SaleByYear, Book } = require('../models');
const { requireAuth } = require('../middleware/auth');
const { delCache } = require('../utils/cache');

// Helper to invalidate cache based on sale's book
const invalidateSaleCache = async (book_id) => {
  await delCache('top-50-selling');
  await delCache('authors-overview');
  if (book_id) {
    const book = await Book.findByPk(book_id);
    if (book) {
      await delCache(`author-${book.author_id}`);
    }
  }
};

// GET /api/sales (Public)
router.get('/', async (req, res) => {
  try {
    const sales = await SaleByYear.findAll({
      include: [{ model: Book, attributes: ['id', 'name'] }]
    });
    res.json(sales);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/sales/:id (Public)
router.get('/:id', async (req, res) => {
  try {
    const sale = await SaleByYear.findByPk(req.params.id, {
      include: [{ model: Book, attributes: ['id', 'name'] }]
    });
    if (!sale) return res.status(404).json({ error: 'Sale record not found' });
    res.json(sale);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/sales (Requires Auth)
router.post('/', requireAuth, async (req, res) => {
  try {
    const sale = await SaleByYear.create(req.body);
    await invalidateSaleCache(sale.book_id);
    res.status(201).json(sale);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/sales/:id (Requires Auth)
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const sale = await SaleByYear.findByPk(req.params.id);
    if (!sale) return res.status(404).json({ error: 'Sale record not found' });

    await sale.update(req.body);
    await invalidateSaleCache(sale.book_id);
    res.json(sale);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/sales/:id (Requires Auth)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const sale = await SaleByYear.findByPk(req.params.id);
    if (!sale) return res.status(404).json({ error: 'Sale record not found' });
    const book_id = sale.book_id;
    await sale.destroy();
    await invalidateSaleCache(book_id);
    res.json({ message: 'Sale record deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;