const express = require("express");
const Movie = require("../models/Movie");
const Show = require("../models/Show");
const { protect, adminOnly } = require("../middleware/auth");

const router = express.Router();

// GET /api/movies?search=...
router.get("/", async (req, res) => {
  try {
    const { search } = req.query;
    const filter = search ? { title: { $regex: search, $options: "i" } } : {};
    const movies = await Movie.find(filter).sort({ createdAt: -1 });
    res.json(movies);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/movies/:id  (movie + its upcoming shows)
router.get("/:id", async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) return res.status(404).json({ message: "Movie not found" });
    const shows = await Show.find({ movie: movie._id, startTime: { $gte: new Date() } }).sort({
      startTime: 1,
    });
    res.json({ movie, shows });
  } catch (err) {
    res.status(400).json({ message: "Invalid movie id" });
  }
});

// POST /api/movies  (admin)
router.post("/", protect, adminOnly, async (req, res) => {
  try {
    if (!req.body.title) return res.status(400).json({ message: "Title is required" });
    const movie = await Movie.create(req.body);
    res.status(201).json(movie);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/movies/:id  (admin)
router.put("/:id", protect, adminOnly, async (req, res) => {
  try {
    const movie = await Movie.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!movie) return res.status(404).json({ message: "Movie not found" });
    res.json(movie);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/movies/:id  (admin) - also removes its shows
router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    const movie = await Movie.findByIdAndDelete(req.params.id);
    if (!movie) return res.status(404).json({ message: "Movie not found" });
    await Show.deleteMany({ movie: movie._id });
    res.json({ message: "Movie deleted" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
