// Checks a seat id like "A1" against the show's layout
const seatIsValid = (seat, show) => {
  const m = /^([A-Z])(\d+)$/.exec(seat);
  if (!m) return false;
  const row = m[1].charCodeAt(0) - 64; // A = 1
  const num = parseInt(m[2], 10);
  return row >= 1 && row <= show.rows && num >= 1 && num <= show.seatsPerRow;
};

// How long a selected-but-not-confirmed seat stays reserved for that user
const HOLD_MINUTES = 3;

module.exports = { seatIsValid, HOLD_MINUTES };
