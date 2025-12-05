import { useEffect, useState } from "react";
import http from "../api/http.js";

export default function SpecializedAgri() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await http.get("/agri");
        if (cancelled) return;
        setPosts(Array.isArray(data) ? data : []);
      } catch (err) {
        if (cancelled) return;
        setError(err.response?.data?.message || "Unable to load agri content.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="container py-5" style={{ minHeight: "70vh" }}>
      <h1 className="mb-3">Agri-services</h1>
      {/* <p className="lead text-muted mb-4">
        Dedicated diagnostics and consulting tailored for agriculture and food systems.
      </p> */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
        </div>
      ) : error ? (
        <div className="alert alert-warning" role="alert">
          {error}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-muted">No agri content published yet.</div>
      ) : (
        <div className="vstack gap-4">
          {posts.map((post) => (
            <div className="row g-3 align-items-center" key={post.id}>
              <div className="col-md-6">
                <h4 className="fw-semibold">{post.title}</h4>
                <p className="mb-0">{post.description}</p>
              </div>
              <div className="col-md-6 text-center">
                {post.image_path ? (
                  <img src={post.image_path} alt={post.title} className="img-fluid rounded shadow-sm" />
                ) : (
                  <div className="text-muted small">No image provided</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
