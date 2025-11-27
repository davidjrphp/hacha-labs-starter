import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import http from "../api/http.js";

export default function NewsFeed() {
  const [items, setItems] = useState([]);
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    http
      .get(showAll ? "/news?all=1" : "/news")
      .then((r) => setItems(r.data))
      .finally(() => setLoading(false));
  }, [showAll]);

  return (
    <section className="container py-5" data-aos="fade-up">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="mb-0">Latest News</h3>
        <small className="text-muted">{loading ? "Refreshing…" : `${items.length} stories`}</small>
      </div>
      <div className="row g-3">
        {items.map((n) => (
          <div className="col-md-4" key={n.id}>
            <Link to={`/news/${n.id}`} className="card h-100 card-hover text-decoration-none text-reset">
              {n.cover_path && <img src={n.cover_path} className="card-img-top" alt="cover" />}
              <div className="card-body">
                <h5 className="card-title">{n.title}</h5>
                <p className="card-text small">{n.excerpt}...</p>
                <span className="text-primary small fw-semibold">Read more →</span>
              </div>
            </Link>
          </div>
        ))}
      </div>
      <div className="text-center mt-3">
        <button className="btn btn-outline-primary btn-sm" onClick={() => setShowAll((v) => !v)}>
          {showAll ? "Show latest" : "View more"}
        </button>
      </div>
    </section>
  );
}
