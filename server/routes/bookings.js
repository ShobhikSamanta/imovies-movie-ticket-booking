const express = require("express");
const Booking = require("../models/Booking");
const Show = require("../models/Show");
const { protect } = require("../middleware/auth");

const router = express.Router();

const { seatIsValid } = require("../utils/seats");

const METHODS = ["card", "upi", "netbanking", "wallet"];
const makeTxnId = () => "TXN" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 7).toUpperCase();

// POST /api/bookings   body: { showId, seats: ["A1","A2"] }
router.post("/", protect, async (req, res) => {
  try {
    const { showId, seats, paymentMethod = "card" } = req.body;
    if (!METHODS.includes(paymentMethod))
      return res.status(400).json({ message: "Invalid payment method" });
    if (!showId || !Array.isArray(seats) || seats.length === 0)
      return res.status(400).json({ message: "showId and at least one seat are required" });
    if (seats.length > 8) return res.status(400).json({ message: "You can book at most 8 seats" });
    if (new Set(seats).size !== seats.length)
      return res.status(400).json({ message: "Duplicate seats selected" });

    const show = await Show.findById(showId);
    if (!show) return res.status(404).json({ message: "Show not found" });
    if (show.startTime < new Date())
      return res.status(400).json({ message: "This show has already started" });
    if (!seats.every((s) => seatIsValid(s, show)))
      return res.status(400).json({ message: "Invalid seat selected" });

    // Atomic update: only succeeds if none of the seats are already booked AND
    // none are currently held by a different user. This prevents double booking.
    // The booking user's own holds on these seats are removed in the same update.
    const now = new Date();
    const updated = await Show.findOneAndUpdate(
      {
        _id: showId,
        bookedSeats: { $nin: seats },
        holds: {
          $not: {
            $elemMatch: {
              seat: { $in: seats },
              user: { $ne: req.user._id },
              expiresAt: { $gt: now },
            },
          },
        },
      },
      {
        $push: { bookedSeats: { $each: seats } },
        $pull: { holds: { user: req.user._id } },
      },
      { new: true }
    );
    if (!updated)
      return res.status(409).json({ message: "Some of those seats were just booked. Please pick again." });

    const booking = await Booking.create({
      user: req.user._id,
      show: show._id,
      seats,
      totalPrice: seats.length * show.price,
      paymentMethod,
      paymentStatus: "paid", // simulated payment: always succeeds
      transactionId: makeTxnId(),
    });
    res.status(201).json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/bookings/my
router.get("/my", protect, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate({ path: "show", populate: { path: "movie", select: "title poster" } })
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/bookings/:id  (one booking, for the ticket page; owner or admin only)
router.get("/:id", protect, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("user", "name email")
      .populate({ path: "show", populate: { path: "movie", select: "title poster genre language duration" } });
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (String(booking.user._id) !== String(req.user._id) && req.user.role !== "admin")
      return res.status(403).json({ message: "Not allowed" });
    res.json(booking);
  } catch (err) {
    res.status(400).json({ message: "Invalid booking id" });
  }
});

// PUT /api/bookings/:id/cancel
router.put("/:id/cancel", protect, async (req, res) => {
  try {
    const booking = await Booking.findOne({ _id: req.params.id, user: req.user._id });
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (booking.status === "cancelled")
      return res.status(400).json({ message: "Already cancelled" });

    const show = await Show.findById(booking.show);
    if (show && show.startTime < new Date())
      return res.status(400).json({ message: "Cannot cancel after the show has started" });

    await Show.updateOne({ _id: booking.show }, { $pull: { bookedSeats: { $in: booking.seats } } });
    booking.status = "cancelled";
    booking.paymentStatus = "refunded";
    await booking.save();
    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
