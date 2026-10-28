const express = require("express");
const Show = require("../models/Show");
const Movie = require("../models/Movie");
const { protect, optionalAuth, adminOnly } = require("../middleware/auth");
const { seatIsValid, HOLD_MINUTES } = require("../utils/seats");

const router = express.Router();

// Shapes a show for the client: hides who holds what, and splits holds into
// "held by someone else" and "held by me".
const serializeShow = (show, userId) => {
  const obj = show.toObject();
  const now = new Date();
  const active = (obj.holds || []).filter((h) => h.expiresAt > now);
  const mine = active.filter((h) => userId && String(h.user) === String(userId));
  const others = active.filter((h) => !userId || String(h.user) !== String(userId));
  delete obj.holds;
  return {
    ...obj,
    heldSeats: others.map((h) => h.seat),
    myHeldSeats: mine.map((h) => h.seat),
    holdMinutes: HOLD_MINUTES,
  };
};

// GET /api/shows/:id  (show details + movie, used by the seat selection page)
router.get("/:id", optionalAuth, async (req, res) => {
  try {
    const show = await Show.findById(req.params.id).populate("movie");
    if (!show) return res.status(404).json({ message: "Show not found" });
    res.json(serializeShow(show, req.user?._id));
  } catch (err) {
    res.status(400).json({ message: "Invalid show id" });
  }
});

// POST /api/shows/:id/hold   body: { seats: ["A1","A2"] }
// Replaces this user's current holds on the show with the given seats.
// Send an empty array to release everything.
router.post("/:id/hold", protect, async (req, res) => {
  try {
    const seats = Array.isArray(req.body.seats) ? req.body.seats : [];
    if (seats.length > 8) return res.status(400).json({ message: "You can select at most 8 seats" });
    if (new Set(seats).size !== seats.length)
      return res.status(400).json({ message: "Duplicate seats selected" });

    const show = await Show.findById(req.params.id);
    if (!show) return res.status(404).json({ message: "Show not found" });
    if (show.startTime < new Date())
      return res.status(400).json({ message: "This show has already started" });
    if (!seats.every((s) => seatIsValid(s, show)))
      return res.status(400).json({ message: "Invalid seat selected" });

    const now = new Date();

    // 1) Drop expired holds and this user's old holds. Only other users' live holds remain.
    await Show.updateOne(
      { _id: show._id },
      { $pull: { holds: { $or: [{ expiresAt: { $lte: now } }, { user: req.user._id }] } } }
    );

    // 2) Add the new holds only if none of the seats are booked or held by someone else.
    if (seats.length > 0) {
      const expiresAt = new Date(now.getTime() + HOLD_MINUTES * 60 * 1000);
      const updated = await Show.findOneAndUpdate(
        {
          _id: show._id,
          bookedSeats: { $nin: seats },
          holds: { $not: { $elemMatch: { seat: { $in: seats } } } },
        },
        { $push: { holds: { $each: seats.map((seat) => ({ seat, user: req.user._id, expiresAt })) } } }
      );
      if (!updated) {
        const fresh = await Show.findById(show._id).populate("movie");
        return res.status(409).json({
          message: "One of those seats was just taken by someone else.",
          show: serializeShow(fresh, req.user._id),
        });
      }
    }

    const fresh = await Show.findById(show._id).populate("movie");
    res.json(serializeShow(fresh, req.user._id));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/shows  (admin)
router.post("/", protect, adminOnly, async (req, res) => {
  try {
    const { movie, theatre, startTime, price } = req.body;
    if (!movie || !theatre || !startTime || price === undefined)
      return res.status(400).json({ message: "movie, theatre, startTime and price are required" });
    if (!(await Movie.findById(movie)))
      return res.status(404).json({ message: "Movie not found" });

    const show = await Show.create(req.body);
    res.status(201).json(show);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/shows/:id  (admin)
router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    const show = await Show.findByIdAndDelete(req.params.id);
    if (!show) return res.status(404).json({ message: "Show not found" });
    res.json({ message: "Show deleted" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
