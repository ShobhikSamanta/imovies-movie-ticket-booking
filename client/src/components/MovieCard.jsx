import { Link } from "react-router-dom";

const FALLBACK = "https://placehold.co/300x450/334155/ffffff?text=No+Poster";

export default function MovieCard({ movie }) {
  return (
    <Link to={`/movie/${movie._id}`} className="movie-card">
      <div className="poster-wrap">
        <img
          src={movie.poster || FALLBACK}
          alt={movie.title}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = FALLBACK;
          }}
        />
      </div>
      <div className="movie-card-info">
        <h3>{movie.title}</h3>
        <p className="muted">
          <span className="star">★</span> {Number(movie.rating).toFixed(1)} • {movie.genre}
        </p>
      </div>
    </Link>
  );
}
