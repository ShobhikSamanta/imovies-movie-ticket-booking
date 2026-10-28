import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import api, { errMsg } from "../api";

export default function MyBookings() {
  const location = useLocation();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = () =>
    api
      .get("/bookings/my")
      .then((res) => setBookings(res.data))
      .catch((e) => setError(errMsg(e)))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const cancel = async (id) => {
    if (!window.confirm("Cancel this booking?")) return;
    try {
      await api.put(`/bookings/${id}/cancel`);
      load();
    } catch (e) {
      setError(errMsg(e));
    }
  };

  return (
    <>
      <h1>My Bookings</h1>
      {location.state?.success && <p className="success">🎉 Booking confirmed!</p>}
      {error && <p className="error">{error}</p>}
      {loading ? (
        <p className="center">Loading...</p>
      ) : bookings.length === 0 ? (
        <p className="muted">You have no bookings yet.</p>
      ) : (
        bookings.map((b) => {
          const show = b.show;
          const upcoming = show && new Date(show.startTime) > new Date();
          return (
            <div className="card booking" key={b._id}>
              <div>
                <h3>{show?.movie?.title || "Movie removed"}</h3>
                {show && (
                  <p className="muted">
                    {show.theatre} • {show.screen} •{" "}
                    {new Date(show.startTime).toLocaleString("en-IN", {
                      day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                    })}
                  </p>
                )}
                <p>
                  Seats: <strong>{b.seats.join(", ")}</strong> • Total: ₹{b.totalPrice}
                </p>
                {b.transactionId && (
                  <p className="muted">
                    Paid via {b.paymentMethod} • Txn {b.transactionId}
                    {b.paymentStatus === "refunded" ? " • refunded" : ""}
                  </p>
                )}
              </div>
              <div className="booking-side">
                <span className={`badge ${b.status}`}>{b.status}</span>
                {b.status === "confirmed" && (
                  <Link className="btn" to={`/ticket/${b._id}`}>
                    View ticket
                  </Link>
                )}
                {b.status === "confirmed" && upcoming && (
                  <button className="btn btn-outline" onClick={() => cancel(b._id)}>
                    Cancel
                  </button>
                )}
              </div>
            </div>
          );
        })
      )}
    </>
  );
}
