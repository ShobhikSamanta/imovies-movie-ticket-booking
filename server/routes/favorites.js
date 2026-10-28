const express = require("express");
const Favorite = require("../models/Favorite");
const Movie = require("../models/Movie");
const { protect } = require("../middleware/auth");

const router = express.Router();

// GET /api/favorites  -> the user's watchlist (movies)
router.get("/", protect, async (req, res) => {
  try {
    const favs = await Favorite.find({ user: req.user._id }).populate("movie").sort({ createdAt: -1 });
    res.json(favs.map((f) => f.movie).filter(Boolean));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/favorites/ids -> just the movie ids (for heart icons)
router.get("/ids", protect, async (req, res) => {
  try {
    const favs = await Favorite.find({ user: req.user._id }).select("movie");
    res.json(favs.map((f) => String(f.movie)));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/favorites/:movieId -> add
router.post("/:movieId", protect, async (req, res) => {
  try {
    if (!(await Movie.findById(req.params.movieId)))
      return res.status(404).json({ message: "Movie not found" });
    await Favorite.updateOne(
      { user: req.user._id, movie: req.params.movieId },
      { $setOnInsert: { user: req.user._id, movie: req.params.movieId } },
      { upsert: true }
    );
    res.status(201).json({ message: "Added to watchlist" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/favorites/:movieId -> remove
router.delete("/:movieId", protect, async (req, res) => {
  try {
    await Favorite.deleteOne({ user: req.user._id, movie: req.params.movieId });
    res.json({ message: "Removed from watchlist" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
