import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api, { errMsg } from "../api";

const MAX_SEATS = 8;
const REFRESH_MS = 4000; // how often the seat map refreshes

export default function SeatSelection() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [show, setShow] = useState(null);
  const [selected, setSelected] = useState([]);
  const [error, setError] = useState("");
  const [booking, setBooking] = useState(false);
  const [payMethod, setPayMethod] = useState("card");
  const [holding, setHolding] = useState(false); // a hold request is in flight
  const holdingRef = useRef(false);

  // Seats that are no longer available to me (booked, or held by another user)
  const takenByOthers = (s) => [...s.bookedSeats, ...s.heldSeats];

  const applyShow = (s) => {
    setShow(s);
    // If someone else took a seat I had selected, remove it from my selection
    setSelected((prev) => prev.filter((seat) => !takenByOthers(s).includes(seat)));
  };

  const loadShow = () =>
    api
      .get(`/shows/${id}`)
      .then((res) => {
        if (!holdingRef.current) applyShow(res.data); // skip while a click is being processed
      })
      .catch((e) => setError(errMsg(e)));

  // Load once, then refresh every few seconds so other users' seats show up
  useEffect(() => {
    loadShow();
    const timer = setInterval(loadShow, REFRESH_MS);
    return () => {
      clearInterval(timer);
      // leaving the page: free the seats I was holding
      if (localStorage.getItem("token")) api.post(`/shows/${id}/hold`, { seats: [] }).catch(() => {});
    };
  }, [id]);

  if (error && !show) return <p className="error">{error}</p>;
  if (!show) return <p className="center">Loading seats...</p>;

  const rowLetters = Array.from({ length: show.rows }, (_, i) => String.fromCharCode(65 + i));
  const seatNumbers = Array.from({ length: show.seatsPerRow }, (_, i) => i + 1);

  const toggle = async (seat) => {
    if (holdingRef.current) return;
    setError("");
    if (takenByOthers(show).includes(seat)) return;

    let next;
    if (selected.includes(seat)) next = selected.filter((s) => s !== seat);
    else if (selected.length >= MAX_SEATS) return setError(`You can select at most ${MAX_SEATS} seats`);
    else next = [...selected, seat];

    holdingRef.current = true;
    setHolding(true);
    try {
      // Ask the server to hold these seats for me
      const res = await api.post(`/shows/${show._id}/hold`, { seats: next });
      setShow(res.data);
      setSelected(next);
    } catch (e) {
      const data = e.response?.data;
      setError(errMsg(e));
      if (data?.show) {
        setShow(data.show);
        setSelected(selected.filter((s) => !takenByOthers(data.show).includes(s)));
      }
    } finally {
      holdingRef.current = false;
      setHolding(false);
    }
  };

  const confirm = async () => {
    setBooking(true);
    setError("");
    try {
      const res = await api.post("/bookings", { showId: show._id, seats: selected, paymentMethod: payMethod });
      navigate(`/ticket/${res.data._id}`, { state: { success: true } });
    } catch (e) {
      setError(errMsg(e));
      setSelected([]);
      loadShow(); // refresh so newly taken seats show up
    } finally {
      setBooking(false);
    }
  };

  const when = new Date(show.startTime).toLocaleString("en-IN", {
    weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });

  return (
    <>
      <h1>{show.movie.title}</h1>
      <p className="muted">
        {show.theatre} • {show.screen} • {when} • ₹{show.price} per seat
      </p>

      <div className="screen">SCREEN THIS WAY</div>

      <div className="seat-map">
        {rowLetters.map((r) => (
          <div className="seat-row" key={r}>
            <span className="row-label">{r}</span>
            {seatNumbers.map((n) => {
              const seat = `${r}${n}`;
              const booked = show.bookedSeats.includes(seat);
              const held = show.heldSeats.includes(seat);
              const isSelected = selected.includes(seat);
              return (
                <button
                  key={seat}
                  title={booked ? `${seat} (booked)` : held ? `${seat} (someone is choosing this)` : seat}
                  disabled={booked || held}
                  className={`seat ${booked ? "booked" : ""} ${held ? "held" : ""} ${isSelected ? "selected" : ""}`}
                  onClick={() => toggle(seat)}
                >
                  {n}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div className="legend">
        <span><i className="seat" /> Available</span>
        <span><i className="seat selected" /> Selected</span>
        <span><i className="seat held" /> Being chosen</span>
        <span><i className="seat booked" /> Booked</span>
      </div>
      <p className="muted center-text">
        Seats you select are held for {show.holdMinutes} minutes while you complete the booking.
      </p>

      {error && <p className="error">{error}</p>}

      <div className="summary card">
        <div>
          <strong>{selected.length ? selected.join(", ") : "No seats selected"}</strong>
          <p className="muted">Total: ₹{selected.length * show.price}</p>
        </div>
        <div className="pay-box">
          <select className="input" value={payMethod} onChange={(e) => setPayMethod(e.target.value)}>
            <option value="card">Credit / Debit card</option>
            <option value="upi">UPI</option>
            <option value="netbanking">Net banking</option>
            <option value="wallet">Wallet</option>
          </select>
          <button className="btn" disabled={!selected.length || booking || holding} onClick={confirm}>
            {booking ? "Processing payment..." : `Pay ₹${selected.length * show.price} & book`}
          </button>
        </div>
      </div>
    </>
  );
}
