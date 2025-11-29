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

const PlaceholderCard = ({ title, description, action }) => (
  <div className="card portal-card">
    <div className="card-body text-center py-5">
      <h5 className="mb-2">{title}</h5>
      <p className="text-muted mb-3">{description}</p>
      {action}
    </div>
  </div>
);

export default function DoctorPortal() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [activePanel, setActivePanel] = useState("schedule");
  const [schedule, setSchedule] = useState([]);
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
                  {schedule.map((session) => (
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
                      <span className={`badge text-bg-${STATUS_BADGE[session.status] || "light"}`}>
                        {session.status}
                      </span>
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
              <div className="text-center text-muted py-4">Messaging integration coming soon.</div>
              <button className="btn btn-success w-100 mt-3" disabled>
                <i className="bi bi-chat-text me-1"></i>Enter inbox
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  const renderActivePanel = () => {
    switch (activePanel) {
      case "schedule":
        return renderSchedulePanel();
      case "patients":
        return (
          <PlaceholderCard
            title="Patient management coming soon"
            description="Track assignments, histories, and handovers without leaving the hub."
            action={
              <button className="btn btn-outline-primary" disabled>
                Manage patients
              </button>
            }
          />
        );
      case "messages":
        return (
          <PlaceholderCard
            title="Secure messaging"
            description="Chat with patients and referral partners in a HIPAA-ready inbox."
            action={
              <button className="btn btn-success" disabled>
                Launch inbox
              </button>
            }
          />
        );
      case "reports":
        return (
          <PlaceholderCard
            title="Analytics dashboard"
            description="Productivity, turnaround, and quality metrics will surface here soon."
            action={
              <button className="btn btn-outline-secondary" disabled>
                View reports
              </button>
            }
          />
        );
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
    >
      {renderActivePanel()}
    </PortalLayout>
  );
}
