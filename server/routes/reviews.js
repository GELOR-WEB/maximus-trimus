const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const { authenticateToken, isAdmin } = require('../middleware/authMiddleware');

// GET /api/reviews — Public: fetch all reviews (newest first)
router.get('/', async (req, res) => {
    try {
        const reviews = await Review.find()
            .sort({ createdAt: -1 })
            .lean();
        res.json(reviews);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch reviews', error: err.message });
    }
});

// POST /api/reviews — Protected: submit a review (one per user)
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { rating, comment } = req.body;

        if (!rating || !comment) {
            return res.status(400).json({ message: 'Rating and comment are required.' });
        }
        if (rating < 1 || rating > 5) {
            return res.status(400).json({ message: 'Rating must be between 1 and 5.' });
        }

        // Check if user already left a review
        const existing = await Review.findOne({ user: req.user._id });
        if (existing) {
            return res.status(409).json({ message: 'You have already submitted a review.' });
        }

        const review = new Review({
            user: req.user._id,
            fullName: req.user.fullName || req.user.username,
            rating: Math.round(rating),
            comment: comment.trim().substring(0, 500)
        });

        await review.save();
        res.status(201).json(review);
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({ message: 'You have already submitted a review.' });
        }
        res.status(500).json({ message: 'Failed to submit review', error: err.message });
    }
});

// DELETE /api/reviews/:id — Admin only: delete a review
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const review = await Review.findByIdAndDelete(req.params.id);
        if (!review) {
            return res.status(404).json({ message: 'Review not found.' });
        }
        res.json({ message: 'Review deleted.' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to delete review', error: err.message });
    }
});

module.exports = router;
