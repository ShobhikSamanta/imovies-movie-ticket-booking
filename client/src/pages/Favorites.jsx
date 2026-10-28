import { useEffect, useState } from "react";
import api, { errMsg } from "../api";
import MovieCard from "../components/MovieCard";

export default function Favorites() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/favorites")
      .then((r) => setMovies(r.data))
      .catch((e) => setError(errMsg(e)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <h1>My Watchlist</h1>
      {error && <p className="error">{error}</p>}
      {loading ? (
        <p className="center">Loading...</p>
      ) : movies.length === 0 ? (
        <p className="muted">No saved movies yet. Open a movie and tap “Add to watchlist”.</p>
      ) : (
        <div className="grid">
          {movies.map((m) => (
            <MovieCard key={m._id} movie={m} />
          ))}
        </div>
      )}
    </>
  );
}
