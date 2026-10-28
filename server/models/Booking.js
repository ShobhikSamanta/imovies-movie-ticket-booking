const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    show: { type: mongoose.Schema.Types.ObjectId, ref: "Show", required: true },
    seats: { type: [String], required: true },
    totalPrice: { type: Number, required: true },
    paymentMethod: { type: String, enum: ["card", "upi", "netbanking", "wallet"], default: "card" },
    paymentStatus: { type: String, enum: ["paid", "refunded"], default: "paid" },
    transactionId: { type: String, default: "" },
    status: { type: String, enum: ["confirmed", "cancelled"], default: "confirmed" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Booking", bookingSchema);
