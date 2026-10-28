import { useEffect, useState } from "react";
import api, { errMsg } from "../api";

const emptyMovie = {
  title: "", description: "", genre: "", language: "English", duration: 120, rating: 7, poster: "",
};
const emptyShow = { movie: "", theatre: "", screen: "Screen 1", startTime: "", price: 200 };

export default function Admin() {
  const [movies, setMovies] = useState([]);
  const [movieForm, setMovieForm] = useState(emptyMovie);
  const [showForm, setShowForm] = useState(emptyShow);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);

  const loadReports = () => {
    api.get("/admin/stats").then((r) => setStats(r.data)).catch(() => {});
    api.get("/admin/users").then((r) => setUsers(r.data)).catch(() => {});
    api.get("/admin/bookings").then((r) => setBookings(r.data)).catch(() => {});
  };

  const deleteUser = async (id) => {
    if (!window.confirm("Delete this user?")) return;
    try {
      await api.delete(`/admin/users/${id}`);
      flash("success", "User deleted");
      loadReports();
    } catch (err) {
      flash("error", errMsg(err));
    }
  };

  const loadMovies = () => api.get("/movies").then((res) => setMovies(res.data));

  useEffect(() => {
    loadMovies().catch((e) => setMsg({ type: "error", text: errMsg(e) }));
    loadReports();
  }, []);

  const flash = (type, text) => setMsg({ type, text });

  const addMovie = async (e) => {
    e.preventDefault();
    try {
      await api.post("/movies", movieForm);
      setMovieForm(emptyMovie);
      flash("success", "Movie added");
      loadMovies();
    } catch (err) {
      flash("error", errMsg(err));
    }
  };

  const addShow = async (e) => {
    e.preventDefault();
    try {
      await api.post("/shows", { ...showForm, startTime: new Date(showForm.startTime).toISOString() });
      setShowForm({ ...emptyShow, movie: showForm.movie, theatre: showForm.theatre });
      flash("success", "Show added");
    } catch (err) {
      flash("error", errMsg(err));
    }
  };

  const deleteMovie = async (id) => {
    if (!window.confirm("Delete this movie and all its shows?")) return;
    try {
      await api.delete(`/movies/${id}`);
      flash("success", "Movie deleted");
      loadMovies();
    } catch (err) {
      flash("error", errMsg(err));
    }
  };

  const setM = (k) => (e) => setMovieForm({ ...movieForm, [k]: e.target.value });
  const setS = (k) => (e) => setShowForm({ ...showForm, [k]: e.target.value });

  return (
    <>
      <h1>Admin Panel</h1>
      {msg.text && <p className={msg.type}>{msg.text}</p>}

      {stats && (
        <>
          <div className="stat-grid">
            <div className="card stat"><small className="muted">Revenue</small><strong>₹{stats.revenue}</strong></div>
            <div className="card stat"><small className="muted">Tickets sold</small><strong>{stats.ticketsSold}</strong></div>
            <div className="card stat"><small className="muted">Bookings</small><strong>{stats.bookings.confirmed}</strong><small className="muted">{stats.bookings.cancelled} cancelled</small></div>
            <div className="card stat"><small className="muted">Users</small><strong>{stats.users}</strong></div>
            <div className="card stat"><small className="muted">Movies / Shows</small><strong>{stats.movies} / {stats.shows}</strong></div>
          </div>
          {stats.topMovies.length > 0 && (
            <div className="card">
              <h3>Top movies by revenue</h3>
              {stats.topMovies.map((m) => (
                <p key={m._id}>{m.title} — ₹{m.revenue} ({m.tickets} tickets)</p>
              ))}
            </div>
          )}
        </>
      )}

      <div className="admin-grid">
        <form className="card form" onSubmit={addMovie}>
          <h2>Add movie</h2>
          <input className="input" placeholder="Title" required value={movieForm.title} onChange={setM("title")} />
          <textarea className="input" placeholder="Description" rows={3} value={movieForm.description} onChange={setM("description")} />
          <input className="input" placeholder="Genre" value={movieForm.genre} onChange={setM("genre")} />
          <input className="input" placeholder="Language" value={movieForm.language} onChange={setM("language")} />
          <input className="input" type="number" placeholder="Duration (min)" min={1} value={movieForm.duration} onChange={setM("duration")} />
          <input className="input" type="number" placeholder="Rating (0-10)" min={0} max={10} step={0.1} value={movieForm.rating} onChange={setM("rating")} />
          <input className="input" placeholder="Poster image URL" value={movieForm.poster} onChange={setM("poster")} />
          <button className="btn">Add movie</button>
        </form>

        <form className="card form" onSubmit={addShow}>
          <h2>Add show</h2>
          <select className="input" required value={showForm.movie} onChange={setS("movie")}>
            <option value="">Select movie</option>
            {movies.map((m) => (
              <option key={m._id} value={m._id}>{m.title}</option>
            ))}
          </select>
          <input className="input" placeholder="Theatre" required value={showForm.theatre} onChange={setS("theatre")} />
          <input className="input" placeholder="Screen" value={showForm.screen} onChange={setS("screen")} />
          <input className="input" type="datetime-local" required value={showForm.startTime} onChange={setS("startTime")} />
          <input className="input" type="number" placeholder="Price (₹)" min={0} required value={showForm.price} onChange={setS("price")} />
          <button className="btn">Add show</button>
        </form>
      </div>

      <h2>All movies</h2>
      {movies.map((m) => (
        <div className="card booking" key={m._id}>
          <div>
            <h3>{m.title}</h3>
            <p className="muted">{m.genre} • {m.language} • {m.duration} min</p>
          </div>
          <button className="btn btn-danger" onClick={() => deleteMovie(m._id)}>Delete</button>
        </div>
      ))}

      <h2>Users</h2>
      {users.map((u) => (
        <div className="card booking" key={u._id}>
          <div>
            <h3>{u.name}</h3>
            <p className="muted">{u.email} • {u.role}</p>
          </div>
          {u.role !== "admin" && (
            <button className="btn btn-danger" onClick={() => deleteUser(u._id)}>Delete</button>
          )}
        </div>
      ))}

      <h2>All bookings</h2>
      {bookings.length === 0 && <p className="muted">No bookings yet.</p>}
      {bookings.map((b) => (
        <div className="card booking" key={b._id}>
          <div>
            <h3>{b.show?.movie?.title || "Movie removed"}</h3>
            <p className="muted">
              {b.user?.name} ({b.user?.email}) • Seats {b.seats.join(", ")} • ₹{b.totalPrice} • {b.paymentMethod}
            </p>
          </div>
          <span className={`badge ${b.status}`}>{b.status}</span>
        </div>
      ))}
    </>
  );
}
