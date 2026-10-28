import { useEffect, useState } from "react";
import api, { errMsg } from "../api";
import { useAuth } from "../context/AuthContext";

export default function Reviews({ movieId }) {
  const { user } = useAuth();
  const [data, setData] = useState({ reviews: [], average: null, count: 0 });
  const [rating, setRating] = useState(8);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");

  const load = () => api.get(`/reviews/${movieId}`).then((r) => setData(r.data)).catch(() => {});

  useEffect(() => {
    load();
  }, [movieId]);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.post(`/reviews/${movieId}`, { rating, comment });
      setComment("");
      load();
    } catch (err) {
      setError(errMsg(err));
    }
  };

  const remove = async (id) => {
    try {
      await api.delete(`/reviews/${id}`);
      load();
    } catch (err) {
      setError(errMsg(err));
    }
  };

  return (
    <section>
      <h2>
        Reviews {data.average !== null && <small className="muted">⭐ {data.average}/10 ({data.count})</small>}
      </h2>

      {user ? (
        <form className="card form" onSubmit={submit}>
          <label>
            Your rating: <strong>{rating}/10</strong>
            <input type="range" min={1} max={10} value={rating} onChange={(e) => setRating(Number(e.target.value))} />
          </label>
          <textarea className="input" rows={2} maxLength={500} placeholder="Write a review (optional)" value={comment} onChange={(e) => setComment(e.target.value)} />
          <button className="btn">Submit review</button>
        </form>
      ) : (
        <p className="muted">Log in to rate and review this movie.</p>
      )}
      {error && <p className="error">{error}</p>}

      {data.reviews.map((r) => (
        <div className="card booking" key={r._id}>
          <div>
            <strong>{r.user?.name || "User"}</strong> • ⭐ {r.rating}/10
            {r.comment && <p>{r.comment}</p>}
          </div>
          {user && (String(r.user?._id) === String(user.id) || user.role === "admin") && (
            <button className="btn btn-outline" onClick={() => remove(r._id)}>Delete</button>
          )}
        </div>
      ))}
    </section>
  );
}
