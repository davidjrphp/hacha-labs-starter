import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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

const SERVICE_LABELS = {
  chemistry: "Clinical Chemistry",
  haematology: "Haematology",
  serology: "Serology",
  microbiology: "Microbiology",
  molecular: "Molecular Diagnostics",
  wellness: "Wellness & Preventive",
};

const formatDateTime = (value) => {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
};

export default function DoctorAppointmentDetail() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const [appt, setAppt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notifications, setNotifications] = useState({ total: 0, items: [] });
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    let cancelled = false;
    const fetchDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await http.get("/doctor/appointments/show", { params: { id } });
        if (cancelled) return;
        setAppt(data);
      } catch (err) {
        if (cancelled) return;
        setError(err.response?.data?.message || "Unable to load appointment.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchDetail();
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
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <PortalLayout
      title="Appointment detail"
      subtitle="Review the selected visit details."
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
      onMenuSelect={(key) => {
        if (key === "schedule") navigate("/doctor/schedule");
        else if (key === "messages") navigate("/doctor");
        else navigate("/doctor");
      }}
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
            <div
              className="card shadow position-absolute end-0 mt-2"
              style={{ minWidth: "260px", zIndex: 5, top: "100%" }}
            >
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
                        navigate(`/doctor/appointments/${item.id}`);
                      }}
                    >
                      <div className="fw-semibold">{item.patient_name || "Patient"} </div>
                      <div className="text-muted">
                        {(TYPE_LABELS[item.visit_type] || item.visit_type || "Visit") +
                          (item.slot_start ? ` • ${formatDateTime(item.slot_start)}` : "")}
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
      <div className="card portal-card">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <button className="btn btn-outline-secondary btn-sm" onClick={() => navigate("/doctor/schedule")}>
              <i className="bi bi-arrow-left"></i> Back to schedule
            </button>
          </div>
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status"></div>
              <div className="text-muted mt-2">Loading appointment…</div>
            </div>
          ) : error ? (
            <div className="alert alert-warning" role="alert">
              {error}
            </div>
          ) : (
            appt && (
              <div className="row g-3">
                <div className="col-md-6">
                  <div className="fw-semibold">Patient</div>
                  <div>{appt.patient_name} ({appt.patient_email})</div>
                  {appt.patient_phone && <div className="text-muted">Phone: {appt.patient_phone}</div>}
                </div>
                <div className="col-md-3">
                  <div className="fw-semibold">Type</div>
                  <div>{TYPE_LABELS[appt.type] || appt.type}</div>
                </div>
                <div className="col-md-3">
                  <div className="fw-semibold">Service</div>
                  <div>{SERVICE_LABELS[appt.service_code] || appt.service_code || "—"}</div>
                </div>
                <div className="col-md-4">
                  <div className="fw-semibold">Slot</div>
                  <div>{formatDateTime(appt.slot_start)}</div>
                </div>
                <div className="col-md-4">
                  <div className="fw-semibold">Status</div>
                  <span className={`badge text-bg-${STATUS_BADGE[appt.status] || "light"}`}>{appt.status}</span>
                  {appt.is_overdue && appt.status !== "completed" && (
                    <span className="badge text-bg-danger ms-2">Overdue</span>
                  )}
                </div>
                {appt.facility_name && (
                  <div className="col-md-4">
                    <div className="fw-semibold">Referring facility</div>
                    <div>{appt.facility_name}</div>
                  </div>
                )}
                {appt.provider_name && (
                  <div className="col-md-4">
                    <div className="fw-semibold">Provider</div>
                    <div>{appt.provider_title} {appt.provider_name}</div>
                  </div>
                )}
                {appt.referral_note && (
                  <div className="col-12">
                    <div className="fw-semibold">Referral note</div>
                    <p className="mb-0">{appt.referral_note}</p>
                  </div>
                )}
                {appt.referral_file && (
                  <div className="col-12">
                    <div className="fw-semibold">Attachment</div>
                    <a href={appt.referral_file} target="_blank" rel="noreferrer">
                      View document
                    </a>
                  </div>
                )}
                {appt.status_reason && (
                  <div className="col-12">
                    <div className="fw-semibold">Status notes</div>
                    <p className="mb-0">{appt.status_reason}</p>
                  </div>
                )}
              </div>
            )
          )}
        </div>
      </div>
    </PortalLayout>
  );
}
