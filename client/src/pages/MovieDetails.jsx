import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api, { errMsg } from "../api";
import { useAuth } from "../context/AuthContext";
import Reviews from "../components/Reviews";

const dayLabel = (d) =>
  new Date(d).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
const timeLabel = (d) =>
  new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

export default function MovieDetails() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [selectedDay, setSelectedDay] = useState("");
  const { user } = useAuth();
  const [fav, setFav] = useState(false);

  useEffect(() => {
    if (!user) return setFav(false);
    api.get("/favorites/ids").then((r) => setFav(r.data.includes(id))).catch(() => {});
  }, [id, user]);

  const toggleFav = async () => {
    try {
      if (fav) await api.delete(`/favorites/${id}`);
      else await api.post(`/favorites/${id}`);
      setFav(!fav);
    } catch (e) {
      setError(errMsg(e));
    }
  };

  useEffect(() => {
    api
      .get(`/movies/${id}`)
      .then((res) => setData(res.data))
      .catch((e) => setError(errMsg(e)));
  }, [id]);

  // Group shows by day, then by theatre
  const byDay = useMemo(() => {
    const groups = {};
    (data?.shows || []).forEach((s) => {
      const key = new Date(s.startTime).toDateString();
      (groups[key] = groups[key] || []).push(s);
    });
    return groups;
  }, [data]);

  const days = Object.keys(byDay);
  const activeDay = selectedDay && byDay[selectedDay] ? selectedDay : days[0];

  if (error) return <p className="error">{error}</p>;
  if (!data) return <p className="center">Loading...</p>;

  const { movie } = data;
  const theatres = {};
  (byDay[activeDay] || []).forEach((s) => {
    (theatres[s.theatre] = theatres[s.theatre] || []).push(s);
  });

  return (
    <>
      <div className="movie-hero">
        <img src={movie.poster || "https://placehold.co/300x450/334155/ffffff?text=No+Poster"} alt={movie.title} />
        <div>
          <h1>{movie.title}</h1>
          <p className="muted">
            {movie.genre} • {movie.language} • {movie.duration} min • ⭐ {movie.rating}/10
          </p>
          <p>{movie.description}</p>
          {user && (
            <button className={`btn ${fav ? "" : "btn-outline"}`} onClick={toggleFav}>
              {fav ? "♥ In watchlist" : "♡ Add to watchlist"}
            </button>
          )}
        </div>
      </div>

      <h2>Book tickets</h2>
      {days.length === 0 ? (
        <p className="muted">No upcoming shows for this movie.</p>
      ) : (
        <>
          <div className="tabs">
            {days.map((d) => (
              <button
                key={d}
                className={`tab ${d === activeDay ? "active" : ""}`}
                onClick={() => setSelectedDay(d)}
              >
                {dayLabel(d)}
              </button>
            ))}
          </div>

          {Object.entries(theatres).map(([theatre, shows]) => (
            <div className="card" key={theatre}>
              <h3>{theatre}</h3>
              <div className="show-times">
                {shows.map((s) => (
                  <Link key={s._id} to={`/show/${s._id}`} className="show-time">
                    <strong>{timeLabel(s.startTime)}</strong>
                    <small>
                      ₹{s.price} • {s.rows * s.seatsPerRow - s.bookedSeats.length} left
                    </small>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </>
      )}

      <Reviews movieId={id} />
    </>
  );
}
