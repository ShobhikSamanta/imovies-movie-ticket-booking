import { useEffect, useRef, useState } from "react";
import MovieCard from "./MovieCard";

// A titled, horizontally scrolling row of movie cards with left/right arrow buttons.
// The arrows only appear when there are more cards than fit on screen.
export default function MovieRow({ title, movies }) {
  const scroller = useRef(null);
  const [overflow, setOverflow] = useState(false);

  useEffect(() => {
    const check = () => {
      const el = scroller.current;
      if (el) setOverflow(el.scrollWidth > el.clientWidth + 4);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [movies]);

  const scroll = (dir) => {
    const el = scroller.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
  };

  if (!movies.length) return null;

  return (
    <section className="section">
      <h2 className="section-title">{title}</h2>
      <div className="row-wrap">
        {overflow && (
          <button className="row-arrow left" onClick={() => scroll(-1)} aria-label="Scroll left">
            ‹
          </button>
        )}
        <div className="row" ref={scroller}>
          {movies.map((m) => (
            <MovieCard key={m._id} movie={m} />
          ))}
        </div>
        {overflow && (
          <button className="row-arrow right" onClick={() => scroll(1)} aria-label="Scroll right">
            ›
          </button>
        )}
      </div>
    </section>
  );
}
