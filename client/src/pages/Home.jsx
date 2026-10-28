import { useEffect, useMemo, useState } from "react";
import api, { errMsg } from "../api";
import Hero from "../components/Hero";
import MovieRow from "../components/MovieRow";
import MovieCard from "../components/MovieCard";

// Colours for the "Browse by genre" tiles (unknown genres fall back to grey)
const GENRE_STYLE = {
  Action: ["#b91c1c", "#7f1d1d"],
  Adventure: ["#c2410c", "#9a3412"],
  Comedy: ["#d97706", "#92400e"],
  Drama: ["#0f766e", "#134e4a"],
  Family: ["#0284c7", "#075985"],
  Horror: ["#6d28d9", "#2e1065"],
  Mystery: ["#57534e", "#292524"],
  Romance: ["#db2777", "#9d174d"],
  "Sci-Fi": ["#4f46e5", "#312e81"],
  Thriller: ["#1d4ed8", "#1e3a8a"],
};

export default function Home() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [language, setLanguage] = useState("");
  const [genre, setGenre] = useState("");

  useEffect(() => {
    api
      .get("/movies")
      .then((res) => setMovies(res.data))
      .catch((e) => setError(errMsg(e)))
      .finally(() => setLoading(false));
  }, []);

  const languages = useMemo(() => [...new Set(movies.map((m) => m.language))].sort(), [movies]);
  const genres = useMemo(() => [...new Set(movies.map((m) => m.genre))].sort(), [movies]);
  const bigLanguages = useMemo(
    () => languages.filter((l) => movies.filter((m) => m.language === l).length >= 3),
    [languages, movies]
  );
  const topRated = useMemo(() => [...movies].sort((a, b) => b.rating - a.rating), [movies]);

  const filtersActive = Boolean(search || language || genre);
  const filtered = useMemo(
    () =>
      movies.filter(
        (m) =>
          (!search || m.title.toLowerCase().includes(search.toLowerCase())) &&
          (!language || m.language === language) &&
          (!genre || m.genre === genre)
      ),
    [movies, search, language, genre]
  );

  const clearFilters = () => {
    setSearch("");
    setLanguage("");
    setGenre("");
  };

  const pickGenre = (g) => {
    setGenre(g);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading) return <p className="center">Loading movies...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <>
      {!filtersActive && <Hero movies={topRated.slice(0, 5)} />}

      <div className="filters">
        <input
          className="input search"
          placeholder="Search for movies..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="chips">
          <span className="chips-label">Language</span>
          <button className={`chip ${!language ? "active" : ""}`} onClick={() => setLanguage("")}>
            All
          </button>
          {languages.map((l) => (
            <button key={l} className={`chip ${language === l ? "active" : ""}`} onClick={() => setLanguage(l)}>
              {l}
            </button>
          ))}
        </div>
        <div className="chips">
          <span className="chips-label">Genre</span>
          <button className={`chip ${!genre ? "active" : ""}`} onClick={() => setGenre("")}>
            All
          </button>
          {genres.map((g) => (
            <button key={g} className={`chip ${genre === g ? "active" : ""}`} onClick={() => setGenre(g)}>
              {g}
            </button>
          ))}
        </div>
      </div>

      {filtersActive ? (
        <section className="section">
          <div className="page-head">
            <h2 className="section-title">
              {filtered.length} movie{filtered.length === 1 ? "" : "s"} found
            </h2>
            <button className="btn btn-outline" onClick={clearFilters}>
              Clear filters
            </button>
          </div>
          {filtered.length === 0 ? (
            <p className="center muted">No movies match your filters.</p>
          ) : (
            <div className="grid">
              {filtered.map((m) => (
                <MovieCard key={m._id} movie={m} />
              ))}
            </div>
          )}
        </section>
      ) : (
        <>
          <MovieRow title="Recommended Movies" movies={topRated.slice(0, 10)} />

          <section className="section">
            <h2 className="section-title">Browse by Genre</h2>
            <div className="genre-tiles">
              {genres.map((g) => {
                const [a, b] = GENRE_STYLE[g] || ["#475569", "#1e293b"];
                const count = movies.filter((m) => m.genre === g).length;
                return (
                  <button
                    key={g}
                    className="genre-tile"
                    style={{ background: `linear-gradient(135deg, ${a}, ${b})` }}
                    onClick={() => pickGenre(g)}
                  >
                    <strong>{g}</strong>
                    <span>
                      {count} movie{count === 1 ? "" : "s"}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* One row per language; languages with only 1-2 movies share a "Regional Cinema" row */}
          {bigLanguages.map((l) => (
            <MovieRow key={l} title={`${l} Movies`} movies={movies.filter((m) => m.language === l)} />
          ))}
          <MovieRow
            title="Regional Cinema"
            movies={movies.filter((m) => !bigLanguages.includes(m.language))}
          />
        </>
      )}
    </>
  );
}
