const mongoose = require("mongoose");

// A temporary reservation made while a user is choosing seats
const holdSchema = new mongoose.Schema(
  {
    seat: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    expiresAt: { type: Date, required: true },
  },
  { _id: false }
);

const showSchema = new mongoose.Schema(
  {
    movie: { type: mongoose.Schema.Types.ObjectId, ref: "Movie", required: true },
    theatre: { type: String, required: true, trim: true },
    screen: { type: String, default: "Screen 1" },
    startTime: { type: Date, required: true },
    price: { type: Number, required: true, min: 0 },
    rows: { type: Number, default: 6 },
    seatsPerRow: { type: Number, default: 10 },
    // seat ids like "A1", "B7" that are already booked
    bookedSeats: { type: [String], default: [] },
    // seats temporarily held by users who are still choosing
    holds: { type: [holdSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Show", showSchema);
