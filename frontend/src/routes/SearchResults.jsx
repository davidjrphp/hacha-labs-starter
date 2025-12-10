import { useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import http from "../api/http.js";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function SearchResults() {
  const query = useQuery();
  const term = query.get("search") || query.get("q") || "";
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!term.trim()) {
        setNews([]);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const { data } = await http.get("/news", { params: { search: term, all: 1 } });
        if (cancelled) return;
        setNews(Array.isArray(data) ? data : []);
      } catch (err) {
        if (cancelled) return;
        setError(err.response?.data?.message || "Unable to search content.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [term]);

  return (
    <div className="container py-5" style={{ minHeight: "70vh" }}>
      <h1 className="mb-3">Search results</h1>
      <p className="text-muted">Results for "{term}"</p>
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
        </div>
      ) : error ? (
        <div className="alert alert-warning" role="alert">
          {error}
        </div>
      ) : term.trim() === "" ? (
        <div className="text-muted">Enter a search term above to begin.</div>
      ) : news.length === 0 ? (
        <div className="text-muted">No matching news or research found.</div>
      ) : (
        <div className="row g-3">
          {news.map((item) => (
            <div className="col-md-6 col-lg-4" key={item.id}>
              <div className="card h-100">
                {item.cover_path && <img src={item.cover_path} className="card-img-top" alt={item.title} />}
                <div className="card-body d-flex flex-column">
                  <h5 className="card-title">{item.title}</h5>
                  <p className="card-text text-muted">{item.excerpt}</p>
                  <Link className="mt-auto btn btn-outline-primary btn-sm" to={`/news/${item.id}`}>
                    Read more
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
