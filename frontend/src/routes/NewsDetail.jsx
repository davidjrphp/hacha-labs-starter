import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import http from "../api/http.js";

export default function NewsDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [news, setNews] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    http
      .get("/news/show", { params: { id } })
      .then((response) => setNews(response.data))
      .catch((err) => setError(err.response?.data?.message || "Unable to load news."))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div className="container py-5 min-vh-75">
      <button className="btn btn-outline-secondary btn-sm mb-4" onClick={() => navigate(-1)}>
        ← Back
      </button>
      {loading && (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
        </div>
      )}
      {error && !loading && <div className="alert alert-warning">{error}</div>}
      {news && !loading && !error && (
        <article className="news-article">
          <h1 className="mb-3">{news.title}</h1>
          <p className="text-muted small mb-4">{news.created_at ? new Date(news.created_at).toLocaleString() : ""}</p>
          {news.cover_path && (
            <img src={news.cover_path} alt={news.title} className="img-fluid rounded mb-4 w-100" loading="lazy" />
          )}
          <p style={{ whiteSpace: "pre-line", fontSize: "1.05rem", lineHeight: 1.65 }}>{news.body}</p>
        </article>
      )}
    </div>
  );
}
