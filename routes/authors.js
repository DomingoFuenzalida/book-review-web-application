const express = require('express');
const router = express.Router();
const { Author, Book, Review, SaleByYear } = require('../models');
const { requireAuth } = require('../middleware/auth');
const { getCache, setCache, delCache } = require('../utils/cache');

const processAuthorStats = (author) => {
  let totalSales = 0;
  let totalScore = 0;
  let reviewCount = 0;

  (author.Books || []).forEach(book => {
    const salesArray = book.SaleByYears || book.sale_by_years || book.SalesByYears || [];
    salesArray.forEach(sale => {
      totalSales += (sale.sales || 0);
    });
    
    (book.Reviews || []).forEach(review => {
      totalScore += review.score;
      reviewCount++;
    });
  });

  const data = author.toJSON();
  data.books_count = (author.Books || []).length;
  data.average_score = reviewCount > 0 ? (totalScore / reviewCount) : 0;
  data.total_sales = totalSales;
  
  delete data.Books; 
  
  return data;
};

// GET /api/authors (Public)
router.get('/', async (req, res) => {
  try {
    const cachedData = await getCache('authors-overview');
    if (cachedData) {
      return res.json(cachedData);
    }

    const authors = await Author.findAll({
      include: [{
        model: Book,
        include: [
          { model: Review, attributes: ['score'] },
          { model: SaleByYear, attributes: ['sales'] }
        ]
      }]
    });
    
    // Mapeamos los autores para agregarles las estadísticas
    const stats = authors.map(processAuthorStats);
    await setCache('authors-overview', stats);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/authors/:id (Public)
router.get('/:id', async (req, res) => {
  try {
    const cacheKey = `author-${req.params.id}`;
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }

    const author = await Author.findByPk(req.params.id, {
      include: [{
        model: Book,
        include: [
          { model: Review, attributes: ['score'] },
          { model: SaleByYear, attributes: ['sales'] }
        ]
      }]
    });
    
    if (!author) return res.status(404).json({ error: 'Author not found' });
    
    const stats = processAuthorStats(author);
    await setCache(cacheKey, stats);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/authors (Requires Auth)
router.post('/', requireAuth, async (req, res) => {
  try {
    const author = await Author.create(req.body);
    await delCache('authors-overview');
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
    await delCache(['authors-overview', `author-${req.params.id}`]);
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
    await delCache(['authors-overview', `author-${req.params.id}`]);
    res.json({ message: 'Author deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;