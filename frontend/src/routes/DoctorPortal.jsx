import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PortalLayout from "../components/PortalLayout.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import http from "../api/http.js";

const STATUS_BADGE = {
  pending: "warning",
  approved: "success",
  declined: "danger",
  completed: "secondary",
  rescheduled: "info",
  cancelled: "danger",
};

const TYPE_LABELS = {
  new: "New patient",
  returning: "Returning",
  referral: "Referral",
};

const formatDateTime = (value) => {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
};

const normalizeStatus = (appointment) => {
  const reason = (appointment.status_reason || "").toLowerCase();
  if (appointment.status === "pending" && reason.includes("reschedule")) {
    return { label: "rescheduled", variant: "rescheduled" };
  }
  if (appointment.status === "declined" && reason.includes("cancel")) {
    return { label: "cancelled", variant: "cancelled" };
  }
  return { label: appointment.status, variant: appointment.status };
};

export default function DoctorPortal() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [activePanel, setActivePanel] = useState("schedule");
  const [notifications, setNotifications] = useState({ total: 0, items: [] });
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [schedule, setSchedule] = useState([]);
  const [patients, setPatients] = useState([]);
  const [patientsLoading, setPatientsLoading] = useState(false);
  const [patientsError, setPatientsError] = useState(null);
  const [patientPage, setPatientPage] = useState(1);
  const PATIENTS_PER_PAGE = 8;
  const [stats, setStats] = useState({
    today_confirmed: 0,
    pending_referrals: 0,
    unread_messages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const fetchSchedule = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await http.get("/doctor/appointments");
        if (cancelled) return;
        setSchedule(Array.isArray(data?.appointments) ? data.appointments : []);
        setStats((prev) => ({ ...prev, ...(data?.stats || {}) }));
      } catch (err) {
        if (cancelled) return;
        setSchedule([]);
        setError(err.response?.data?.message || "Unable to load your appointments.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchSchedule();
    const fetchNotifications = async () => {
      try {
        const { data } = await http.get("/doctor/notifications");
        if (cancelled) return;
        setNotifications({
          total: data?.total ?? 0,
          items: Array.isArray(data?.items) ? data.items : [],
        });
      } catch {
        if (cancelled) return;
        setNotifications({ total: 0, items: [] });
      }
    };
    fetchNotifications();
    const fetchPatients = async () => {
      setPatientsLoading(true);
      setPatientsError(null);
      try {
        const { data } = await http.get("/doctor/patients");
        if (cancelled) return;
        setPatients(Array.isArray(data?.data) ? data.data : []);
      } catch (err) {
        if (cancelled) return;
        setPatients([]);
        setPatientsError(err.response?.data?.message || "Unable to load patients.");
      } finally {
        if (!cancelled) setPatientsLoading(false);
      }
    };
    fetchPatients();
    return () => {
      cancelled = true;
    };
  }, []);

  const statCards = useMemo(
    () => [
      { label: "Today's confirmed", value: stats.today_confirmed, color: "#0dcaf0", icon: "bi-check2-square" },
      { label: "Pending referrals", value: stats.pending_referrals, color: "#845ef7", icon: "bi-clipboard-data" },
      { label: "Unread messages", value: stats.unread_messages, color: "#51cf66", icon: "bi-envelope-open" },
    ],
    [stats]
  );

  const renderSchedulePanel = () => (
    <>
      <div className="row g-4 mb-4">
        {statCards.map((card) => (
          <div className="col-md-4" key={card.label}>
            <div className="portal-stat-card" style={{ background: card.color }}>
              <div>
                <div className="stat-label">{card.label}</div>
                <div className="stat-value">{card.value}</div>
              </div>
              <div className="stat-icon">
                <i className={`bi ${card.icon}`}></i>
              </div>
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="alert alert-warning" role="alert">
          {error}
        </div>
      )}

      <div className="row g-4">
        <div className="col-lg-7">
          <div className="card portal-card h-100">
            <div className="card-body">
              <div className="portal-section-title mb-2">Upcoming appointments</div>
              <p className="text-muted">Review and confirm your next sessions.</p>
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status"></div>
                  <div className="text-muted mt-3">Loading your schedule…</div>
                </div>
              ) : schedule.length === 0 ? (
                <div className="text-center text-muted py-4">No upcoming appointments assigned.</div>
              ) : (
                <div className="list-group list-group-flush">
                  {schedule
                    .filter((session) =>
                      (session.patient_name || "").toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((session) => (
                    <div className="list-group-item d-flex justify-content-between align-items-center" key={session.id}>
                      <div>
                        <div className="fw-semibold">{session.patient_name || "Patient"}</div>
                        <div className="text-muted small">
                          {formatDateTime(session.slot_start)} • {TYPE_LABELS[session.type] || session.type || "—"}
                        </div>
                        {session.facility_name && (
                          <div className="text-muted small">Facility: {session.facility_name}</div>
                        )}
                      </div>
                      {(() => {
                        const { label, variant } = normalizeStatus(session);
                        return (
                          <span className={`badge text-bg-${STATUS_BADGE[variant] || "light"}`}>
                            {label}
                          </span>
                        );
                      })()}
                    </div>
                  ))}
                </div>
              )}
              <button
                className="btn btn-outline-primary w-100 mt-3"
                onClick={() => navigate("/doctor/schedule")}
                disabled={loading}
              >
                Open scheduling
              </button>
            </div>
          </div>
        </div>
        <div className="col-lg-5">
          <div className="card portal-card h-100">
            <div className="card-body">
              <div className="portal-section-title mb-2">Messaging queue</div>
              <p className="text-muted">Respond to patients and referral partners securely.</p>
              <div className="text-center text-muted py-4">
                Launch your inbox to chat with patients and referral partners.
              </div>
              <button className="btn btn-success w-100 mt-3" onClick={() => navigate("/doctor/messages")}>
                <i className="bi bi-chat-text me-1"></i>Launch inbox
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  const paginatedPatients = useMemo(() => {
    const filtered = patients.filter((p) =>
      (p.full_name || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
    const start = (patientPage - 1) * PATIENTS_PER_PAGE;
    return {
      rows: filtered.slice(start, start + PATIENTS_PER_PAGE),
      totalPages: Math.max(1, Math.ceil(filtered.length / PATIENTS_PER_PAGE)),
    };
  }, [patients, searchTerm, patientPage]);

  const renderActivePanel = () => {
    switch (activePanel) {
      case "schedule":
        return renderSchedulePanel();
      case "patients":
        return (
          <div className="card portal-card">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <div className="portal-section-title mb-1">Patients</div>
                  <small className="text-muted">Your Patients/appointments.</small>
                </div>
                <div className="d-flex gap-2">
                  <input
                    type="search"
                    className="form-control form-control-sm"
                    placeholder="Search patients..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              {patientsError && <div className="alert alert-warning">{patientsError}</div>}
              {patientsLoading ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status"></div>
                  <div className="text-muted mt-2">Loading patients…</div>
                </div>
              ) : paginatedPatients.rows.length === 0 ? (
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
                        {paginatedPatients.rows.map((p) => (
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
                  <div className="d-flex justify-content-between align-items-center">
                    <small className="text-muted">
                      Page {patientPage} of {paginatedPatients.totalPages}
                    </small>
                    <div className="btn-group btn-group-sm">
                      <button
                        className="btn btn-outline-secondary"
                        disabled={patientPage <= 1}
                        onClick={() => setPatientPage((p) => p - 1)}
                      >
                        Prev
                      </button>
                      <button
                        className="btn btn-outline-secondary"
                        disabled={patientPage >= paginatedPatients.totalPages}
                        onClick={() => setPatientPage((p) => p + 1)}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        );
      case "messages":
        navigate("/doctor/messages");
        return null;
      case "reports":
        return null;
      default:
        return renderSchedulePanel();
    }
  };

  return (
    <PortalLayout
      title="Clinical Practice Hub"
      subtitle="Track today's sessions, pending referrals, and communications."
      onLogout={async () => {
        await logout();
        navigate("/login", { replace: true });
      }}
      menuItems={[
        { key: "schedule", icon: "bi-calendar-week", label: "Schedule" },
        { key: "patients", icon: "bi-person-vcard", label: "Patients" },
        { key: "messages", icon: "bi-chat-dots", label: "Messages" },
        { key: "reports", icon: "bi-bar-chart-line", label: "Reports" },
      ]}
      onMenuSelect={setActivePanel}
      headerActions={
        <div className="position-relative d-flex align-items-center gap-2">
          <input
            type="search"
            className="form-control form-control-sm"
            placeholder="Search patient…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ minWidth: "180px" }}
          />
          <button
            className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2"
            type="button"
            onClick={() => setShowNotifications((prev) => !prev)}
          >
            <i className="bi bi-bell"></i>
            Notifications
            {notifications.total > 0 && (
              <span className="badge text-bg-danger rounded-pill">{notifications.total}</span>
            )}
          </button>
          {showNotifications && (
            <div className="card shadow position-absolute end-0 mt-2" style={{ minWidth: "260px", zIndex: 5 }}>
              <div className="card-header d-flex justify-content-between align-items-center">
                <span>Notifications</span>
                <button className="btn-close btn-close-sm" onClick={() => setShowNotifications(false)}></button>
              </div>
              <div className="list-group list-group-flush" style={{ maxHeight: "300px", overflowY: "auto" }}>
                {notifications.items.length === 0 ? (
                  <div className="list-group-item text-muted small">No new notifications.</div>
                ) : (
                  notifications.items.map((item, idx) => (
                    <button
                      key={`${item.type}-${item.id}-${idx}`}
                      className="list-group-item list-group-item-action small text-start"
                      onClick={() => {
                        setShowNotifications(false);
                        setNotifications((prev) => {
                          const nextItems = prev.items.filter(
                            (n, i) => !(n.id === item.id && n.type === item.type && i === idx)
                          );
                          return { total: nextItems.length, items: nextItems };
                        });
                        if (item.type === "appointment") {
                          navigate(`/doctor/appointments/${item.id}`);
                        } else {
                          setActivePanel("messages");
                        }
                      }}
                    >
                      <div className="fw-semibold text-capitalize">{item.type}</div>
                      <div className="text-muted">
                        {item.patient_name ? `${item.patient_name} • ` : ""}
                        {item.label || (item.type === "appointment" ? "Appointment update" : "New message")}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      }
    >
      {renderActivePanel()}
    </PortalLayout>
  );
}
