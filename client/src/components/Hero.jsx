import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

// Big rotating banner for the top-rated movies
export default function Hero({ movies }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || movies.length < 2) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % movies.length), 5000);
    return () => clearInterval(t);
  }, [paused, movies.length]);

  if (!movies.length) return null;
  const m = movies[index % movies.length];

  return (
    <section
      className="hero"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="hero-bg" style={{ backgroundImage: `url(${m.poster})` }} />
      <div className="hero-content" key={m._id}>
        <div className="hero-text">
          <span className="hero-tag">⭐ {Number(m.rating).toFixed(1)}/10 • {m.language}</span>
          <h1>{m.title}</h1>
          <p className="muted">
            {m.genre} • {m.duration} min
          </p>
          <p className="hero-desc">{m.description}</p>
          <Link to={`/movie/${m._id}`} className="btn">
            Book tickets
          </Link>
        </div>
        <img className="hero-poster" src={m.poster} alt={m.title} />
      </div>
      <div className="dots">
        {movies.map((x, i) => (
          <button
            key={x._id}
            className={`dot ${i === index ? "active" : ""}`}
            onClick={() => setIndex(i)}
            aria-label={`Show ${x.title}`}
          />
        ))}
      </div>
    </section>
  );
}
