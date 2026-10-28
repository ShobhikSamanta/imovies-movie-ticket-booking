const express = require("express");
const mongoose = require("mongoose");
const Review = require("../models/Review");
const Movie = require("../models/Movie");
const { protect } = require("../middleware/auth");

const router = express.Router();

// GET /api/reviews/:movieId -> reviews + average
router.get("/:movieId", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.movieId))
      return res.status(400).json({ message: "Invalid movie id" });
    const reviews = await Review.find({ movie: req.params.movieId })
      .populate("user", "name")
      .sort({ createdAt: -1 });
    const average = reviews.length
      ? Math.round((reviews.reduce((a, r) => a + r.rating, 0) / reviews.length) * 10) / 10
      : null;
    res.json({ reviews, average, count: reviews.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/reviews/:movieId  body: { rating, comment }  (creates or updates your review)
router.post("/:movieId", protect, async (req, res) => {
  try {
    const rating = Number(req.body.rating);
    if (!Number.isFinite(rating) || rating < 1 || rating > 10)
      return res.status(400).json({ message: "Rating must be between 1 and 10" });
    if (!(await Movie.findById(req.params.movieId)))
      return res.status(404).json({ message: "Movie not found" });

    const review = await Review.findOneAndUpdate(
      { user: req.user._id, movie: req.params.movieId },
      { rating, comment: String(req.body.comment || "").slice(0, 500) },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    res.status(201).json(review);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/reviews/:id  (own review, or any review if admin)
router.delete("/:id", protect, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: "Review not found" });
    if (String(review.user) !== String(req.user._id) && req.user.role !== "admin")
      return res.status(403).json({ message: "Not allowed" });
    await review.deleteOne();
    res.json({ message: "Review deleted" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
