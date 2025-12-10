import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PortalLayout from "../components/PortalLayout.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import http from "../api/http.js";

export default function DoctorPatients() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const PER_PAGE = 10;

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await http.get("/doctor/patients");
        if (cancelled) return;
        setPatients(Array.isArray(data?.data) ? data.data : []);
      } catch (err) {
        if (cancelled) return;
        setError(err.response?.data?.message || "Unable to load patients.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return patients.filter((p) => (p.full_name || "").toLowerCase().includes(term));
  }, [patients, searchTerm]);

  const paged = useMemo(() => {
    const start = (page - 1) * PER_PAGE;
    return {
      rows: filtered.slice(start, start + PER_PAGE),
      totalPages: Math.max(1, Math.ceil(filtered.length / PER_PAGE)),
    };
  }, [filtered, page]);

  const menuItems = [
    { key: "schedule", icon: "bi-calendar-week", label: "Schedule" },
    { key: "patients", icon: "bi-person-vcard", label: "Patients" },
    { key: "messages", icon: "bi-chat-dots", label: "Messages" },
    { key: "reports", icon: "bi-bar-chart-line", label: "Reports" },
  ];

  return (
    <PortalLayout
      title="Patients"
      subtitle="All patients and historical appointments assigned to you."
      onLogout={async () => {
        await logout();
        navigate("/login", { replace: true });
      }}
      menuItems={menuItems}
      onMenuSelect={(key) => {
        if (key === "schedule") navigate("/doctor/schedule");
        if (key === "patients") navigate("/doctor/patients");
        if (key === "messages") navigate("/doctor/messages");
        if (key === "reports") navigate("/doctor/reports");
      }}
      headerActions={
        <input
          type="search"
          className="form-control form-control-sm"
          placeholder="Search patient..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ minWidth: "200px" }}
        />
      }
    >
      {error && <div className="alert alert-warning">{error}</div>}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
        </div>
      ) : paged.rows.length === 0 ? (
        <div className="text-center text-muted py-4">No patients found.</div>
      ) : (
        <>
          <div className="table-responsive">
            <table className="table portal-table align-middle">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Last visit</th>
                  <th>Total appointments</th>
                </tr>
              </thead>
              <tbody>
                {paged.rows.map((p) => (
                  <tr key={p.patient_id}>
                    <td>{p.full_name}</td>
                    <td>{p.email || "—"}</td>
                    <td>{p.phone || "—"}</td>
                    <td>{p.last_visit ? new Date(p.last_visit).toLocaleString() : "—"}</td>
                    <td>{p.total_appointments || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="d-flex justify-content-between align-items-center mt-3">
            <small className="text-muted">
              Page {page} of {paged.totalPages}
            </small>
            <div className="btn-group btn-group-sm">
              <button className="btn btn-outline-secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Prev
              </button>
              <button
                className="btn btn-outline-secondary"
                disabled={page >= paged.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </PortalLayout>
  );
}
