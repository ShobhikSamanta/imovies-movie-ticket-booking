const express = require("express");
const User = require("../models/User");
const Movie = require("../models/Movie");
const Show = require("../models/Show");
const Booking = require("../models/Booking");
const { protect, adminOnly } = require("../middleware/auth");

const router = express.Router();
router.use(protect, adminOnly);

// GET /api/admin/stats -> totals + revenue report
router.get("/stats", async (req, res) => {
  try {
    const [users, movies, shows, confirmed, cancelled, revenueAgg, perMovie] = await Promise.all([
      User.countDocuments(),
      Movie.countDocuments(),
      Show.countDocuments(),
      Booking.countDocuments({ status: "confirmed" }),
      Booking.countDocuments({ status: "cancelled" }),
      Booking.aggregate([
        { $match: { status: "confirmed" } },
        { $group: { _id: null, revenue: { $sum: "$totalPrice" }, tickets: { $sum: { $size: "$seats" } } } },
      ]),
      Booking.aggregate([
        { $match: { status: "confirmed" } },
        { $lookup: { from: "shows", localField: "show", foreignField: "_id", as: "show" } },
        { $unwind: "$show" },
        { $group: { _id: "$show.movie", revenue: { $sum: "$totalPrice" }, tickets: { $sum: { $size: "$seats" } } } },
        { $lookup: { from: "movies", localField: "_id", foreignField: "_id", as: "movie" } },
        { $unwind: "$movie" },
        { $project: { title: "$movie.title", revenue: 1, tickets: 1 } },
        { $sort: { revenue: -1 } },
        { $limit: 10 },
      ]),
    ]);
    res.json({
      users, movies, shows,
      bookings: { confirmed, cancelled },
      revenue: revenueAgg[0]?.revenue || 0,
      ticketsSold: revenueAgg[0]?.tickets || 0,
      topMovies: perMovie,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/users
router.get("/users", async (req, res) => {
  try {
    res.json(await User.find().select("-password").sort({ createdAt: -1 }));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/admin/users/:id  (cannot delete yourself)
router.delete("/users/:id", async (req, res) => {
  try {
    if (String(req.params.id) === String(req.user._id))
      return res.status(400).json({ message: "You cannot delete your own account" });
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// GET /api/admin/bookings -> all bookings
router.get("/bookings", async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("user", "name email")
      .populate({ path: "show", populate: { path: "movie", select: "title" } })
      .sort({ createdAt: -1 })
      .limit(200);
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
