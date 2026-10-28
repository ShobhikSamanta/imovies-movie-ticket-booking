import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import api, { errMsg } from "../api";

export default function Ticket() {
  const { id } = useParams();
  const location = useLocation();
  const [b, setB] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get(`/bookings/${id}`)
      .then((r) => setB(r.data))
      .catch((e) => setError(errMsg(e)));
  }, [id]);

  if (error) return <p className="error">{error}</p>;
  if (!b) return <p className="center">Loading...</p>;

  const show = b.show;
  const movie = show?.movie;
  const when = show
    ? new Date(show.startTime).toLocaleString("en-IN", {
        weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
      })
    : "-";

  return (
    <>
      <div className="no-print">
        {location.state?.success && <p className="success">🎉 Booking confirmed! Here is your ticket.</p>}
        <div className="ticket-actions">
          <button className="btn" onClick={() => window.print()}>🖨️ Print / Save as PDF</button>
          <Link className="btn btn-outline" to="/my-bookings">My Bookings</Link>
        </div>
        <p className="muted">Tip: in the print window set Destination to “Save as PDF”.</p>
      </div>

      <div className="ticket">
        <div className="ticket-head">
          <strong>🎬 IMovies</strong>
          <span className={`badge ${b.status}`}>{b.status}</span>
        </div>
        <div className="ticket-body">
          {movie?.poster && <img src={movie.poster} alt={movie.title} />}
          <div className="ticket-info">
            <h1>{movie?.title || "Movie removed"}</h1>
            {movie && (
              <p className="muted">
                {movie.genre} • {movie.language} • {movie.duration} min
              </p>
            )}
            <dl>
              <dt>Theatre</dt><dd>{show?.theatre} • {show?.screen}</dd>
              <dt>Date &amp; time</dt><dd>{when}</dd>
              <dt>Seats</dt><dd><strong>{b.seats.join(", ")}</strong></dd>
              <dt>Booked by</dt><dd>{b.user?.name} ({b.user?.email})</dd>
              <dt>Amount paid</dt><dd>₹{b.totalPrice} via {b.paymentMethod}{b.paymentStatus === "refunded" ? " (refunded)" : ""}</dd>
              <dt>Transaction</dt><dd>{b.transactionId || "-"}</dd>
            </dl>
          </div>
        </div>
        <div className="ticket-foot">
          <span>Booking ID: {b._id}</span>
          <span>Please show this ticket at the theatre entrance.</span>
        </div>
      </div>
    </>
  );
}
