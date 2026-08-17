const express = require('express');
const router = express.Router();
const { Review } = require('../models');
const { requireAuth } = require('../middleware/auth');

// Public read
router.get('/', async (req, res) => {
  try {
    const reviews = await Review.findAll();
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create Review (Assigned automatically to logged-in user)
router.post('/', requireAuth, async (req, res) => {
  try {
    const reviewData = { ...req.body, user_id: req.user.id };
    const review = await Review.create(reviewData);
    res.status(201).json(review);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update Review (Only owner or admin)
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const review = await Review.findByPk(req.params.id);
    if (!review) return res.status(404).json({ error: 'Review not found' });

    if (review.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: You do not own this review' });
    }

    await review.update(req.body);
    res.json(review);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete Review (Only owner or admin)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const review = await Review.findByPk(req.params.id);
    if (!review) return res.status(404).json({ error: 'Review not found' });

    if (review.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: You do not own this review' });
    }

    await review.destroy();
    res.json({ message: 'Review deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;