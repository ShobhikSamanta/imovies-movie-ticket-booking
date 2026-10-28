const mongoose = require("mongoose");

const movieSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    genre: { type: String, default: "" },
    language: { type: String, default: "English" },
    duration: { type: Number, default: 120 }, // minutes
    rating: { type: Number, min: 0, max: 10, default: 0 },
    poster: { type: String, default: "" }, // image URL
  },
  { timestamps: true }
);

module.exports = mongoose.model("Movie", movieSchema);
