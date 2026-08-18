const express = require('express');
const router = express.Router();
const { Review } = require('../models');
const { requireAuth } = require('../middleware/auth');

// GET /api/reviews (Public Read)
router.get('/', async (req, res) => {
  try {
    const { book_id } = req.query;
    const whereClause = {};
    if (book_id) {
      whereClause.book_id = book_id;
    }

    const reviews = await Review.findAll({
      where: whereClause
    });
    
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/reviews/:id/vote (Mark Review as Useful / Up-vote)
router.post('/:id/vote', requireAuth, async (req, res) => {
  try {
    const review = await Review.findByPk(req.params.id);
    if (!review) return res.status(404).json({ error: 'Review not found' });

    // Prevent authors from upvoting their own review
    if (review.user_id === req.user.id) {
      return res.status(400).json({ error: 'You cannot vote on your own review' });
    }

    await review.increment('number_of_votes', { by: 1 });
    await review.reload();

    res.json({
      message: 'Vote recorded successfully',
      id: review.id,
      number_of_votes: review.number_of_votes
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/reviews (Create Review - Assigned automatically to logged-in user)
router.post('/', requireAuth, async (req, res) => {
  try {
    const reviewData = { ...req.body, user_id: req.user.id };
    const review = await Review.create(reviewData);
    res.status(201).json(review);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/reviews/:id (Update Review - Owner or Admin)
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

// DELETE /api/reviews/:id (Delete Review - Owner or Admin)
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