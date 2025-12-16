import { useEffect, useMemo, useState } from "react";
import http from "../api/http.js";

export default function Locations() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const assetBase = useMemo(() => {
    const base = http.defaults.baseURL || "";
    return base.replace(/\/api\/?$/, "/");
  }, []);

  const resolveAsset = (path) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    return `${assetBase.replace(/\/$/, "")}${path}`;
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await http.get("/offices");
        if (cancelled) return;
        setItems(Array.isArray(data) ? data : []);
      } catch (err) {
        if (cancelled) return;
        setError(err.response?.data?.message || "Unable to load locations.");
        setItems([]);
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
      <h1 className="mb-3">Our Locations</h1>
      <p className="text-muted">Find our offices across provinces and districts.</p>
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
        </div>
      ) : error ? (
        <div className="alert alert-warning" role="alert">
          {error}
        </div>
      ) : items.length === 0 ? (
        <div className="text-muted">No locations published yet.</div>
      ) : (
        <div className="vstack gap-4">
          {items.map((loc, idx) => (
            <div className="row g-3 align-items-center" key={loc.id || idx}>
              <div className={`col-md-6 ${idx % 2 === 1 ? "order-md-2" : ""}`}>
                <h4 className="fw-semibold mb-1">{loc.province}</h4>
                <div className="text-muted small mb-2">{loc.district}</div>
                <p className="mb-0">{loc.description || "Visit us for more details."}</p>
              </div>
              <div className={`col-md-6 text-center ${idx % 2 === 1 ? "order-md-1" : ""}`}>
                {loc.photo_path ? (
                  <img
                    src={resolveAsset(loc.photo_path)}
                    alt={`${loc.province} ${loc.district}`}
                    className="img-fluid rounded shadow-sm"
                  />
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
