import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PortalLayout from "../components/PortalLayout.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import http from "../api/http.js";

const STATUS_BADGE = {
  pending: "warning",
  approved: "success",
  declined: "danger",
  completed: "secondary",
  overdue: "danger",
  rescheduled: "info",
  cancelled: "danger",
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

const Modal = ({ show, title, onClose, children }) => {
  if (!show) return null;
  return (
    <div className="portal-modal-backdrop">
      <div className="portal-modal card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <span>{title}</span>
          <button type="button" className="btn-close" onClick={onClose}></button>
        </div>
        <div className="card-body">{children}</div>
      </div>
    </div>
  );
};

export default function DoctorSchedule() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionState, setActionState] = useState({ id: null, action: null });
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [notifications, setNotifications] = useState({ total: 0, items: [] });
  const [showNotifications, setShowNotifications] = useState(false);

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await http.get("/doctor/appointments/list", { params: { limit: 50 } });
      setAppointments(Array.isArray(data) ? data : []);
    } catch (err) {
      setAppointments([]);
      setError(err.response?.data?.message || "Unable to load appointments.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAppointments();
    const fetchNotifications = async () => {
      try {
        const { data } = await http.get("/doctor/notifications");
        setNotifications({
          total: data?.total ?? 0,
          items: Array.isArray(data?.items) ? data.items : [],
        });
      } catch {
        setNotifications({ total: 0, items: [] });
      }
    };
    fetchNotifications();
  }, [loadAppointments]);

  const handleRespond = async (appointment, action) => {
    const verb = action === "approve" ? "approve" : "decline";
    if (!window.confirm(`Are you sure you want to ${verb} this appointment?`)) {
      return;
    }
    let note = "";
    if (action === "decline") {
      note = window.prompt("Add an optional note to the patient/referrer:", "") || "";
    }
    setActionState({ id: appointment.id, action });
    try {
      await http.post(
        "/doctor/appointments/respond",
        { appointment_id: appointment.id, action, note },
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      await loadAppointments();
    } catch (err) {
      alert(err.response?.data?.message || "Unable to update appointment.");
    } finally {
      setActionState({ id: null, action: null });
    }
  };

  const tableRows = useMemo(() => {
    if (!searchTerm.trim()) return appointments;
    const term = searchTerm.toLowerCase();
    return appointments.filter((appt) => (appt.patient_name || "").toLowerCase().includes(term));
  }, [appointments, searchTerm]);

  const menuItems = [
    { key: "schedule", icon: "bi-calendar-week", label: "Schedule" },
    { key: "patients", icon: "bi-person-vcard", label: "Patients" },
    { key: "messages", icon: "bi-chat-dots", label: "Messages" },
    { key: "reports", icon: "bi-bar-chart-line", label: "Reports" },
  ];

  return (
    <PortalLayout
      title="Scheduling & Appointments"
      subtitle="Review every appointment assigned to you, approve/decline."
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
        <div className="d-flex align-items-center gap-2 position-relative">
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
            <div className="card shadow position-absolute end-0 mt-2" style={{ minWidth: "260px", zIndex: 5, top: "100%" }}>
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
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <div>
          <div className="portal-section-title mb-1">All appointments</div>
         
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary btn-sm" onClick={() => navigate("/doctor")}>
            <i className="bi bi-arrow-left"></i> Back to overview
          </button>
          <button className="btn btn-primary btn-sm" onClick={loadAppointments} disabled={loading}>
            <i className="bi bi-arrow-repeat me-1"></i>
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-warning" role="alert">
          {error}
        </div>
      )}

      <div className="card portal-card">
        <div className="card-body">
          <div className="table-responsive">
            <table className="table portal-table align-middle">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Type</th>
                  <th>Service</th>
                  <th>Slot</th>
                  <th>Status</th>
                  <th style={{ width: "200px" }}></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="text-center py-4">
                      <div className="spinner-border text-primary" role="status"></div>
                      <div className="text-muted mt-2 small">Loading appointments…</div>
                    </td>
                  </tr>
                ) : tableRows.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center text-muted py-4">
                      No appointments found.
                    </td>
                  </tr>
                ) : (
                  tableRows.map((appt) => (
                    <tr key={appt.id}>
                      <td>{appt.patient_name || "Patient"}</td>
                      <td>{TYPE_LABELS[appt.type] || appt.type || "—"}</td>
                      <td>{SERVICE_LABELS[appt.service_code] || appt.service_code || "—"}</td>
                      <td>{formatDateTime(appt.slot_start)}</td>
                      <td>
                        {(() => {
                          const { label, variant } = normalizeStatus(appt);
                          const showOverdue = appt.is_overdue && appt.status !== "completed";
                          return (
                            <div className="d-flex flex-wrap gap-1">
                              <span className={`badge text-bg-${STATUS_BADGE[variant] || "light"}`}>
                                {label}
                              </span>
                              {showOverdue && <span className="badge text-bg-danger">overdue</span>}
                            </div>
                          );
                        })()}
                      </td>
                      <td>
                        <div className="btn-group btn-group-sm w-100">
                          <button className="btn btn-outline-secondary" onClick={() => setSelectedAppointment(appt)}>
                            Details
                          </button>
                          <button
                            className="btn btn-outline-success"
                            disabled={actionState.id === appt.id || appt.status === "approved"}
                            onClick={() => handleRespond(appt, "approve")}
                          >
                            {actionState.id === appt.id && actionState.action === "approve" ? "Approving…" : "Approve"}
                          </button>
                          <button
                            className="btn btn-outline-secondary"
                            disabled={actionState.id === appt.id || appt.status === "completed"}
                            onClick={() => handleRespond(appt, "close")}
                          >
                            {actionState.id === appt.id && actionState.action === "close" ? "Closing…" : "Close"}
                          </button>
                          <button
                            className="btn btn-outline-danger"
                            disabled={actionState.id === appt.id || appt.status === "declined"}
                            onClick={() => handleRespond(appt, "decline")}
                          >
                            {actionState.id === appt.id && actionState.action === "decline" ? "Declining…" : "Decline"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal
        show={!!selectedAppointment}
        title="Appointment details"
        onClose={() => setSelectedAppointment(null)}
      >
        {selectedAppointment && (
          <div className="small">
            <div className="mb-2">
              <strong>Patient:</strong> {selectedAppointment.patient_name} ({selectedAppointment.patient_email})
            </div>
            <div className="mb-2">
              <strong>Type:</strong> {TYPE_LABELS[selectedAppointment.type] || selectedAppointment.type}
            </div>
            <div className="mb-2">
              <strong>Service:</strong> {SERVICE_LABELS[selectedAppointment.service_code] || selectedAppointment.service_code || "—"}
            </div>
            <div className="mb-2">
              <strong>Slot:</strong> {formatDateTime(selectedAppointment.slot_start)}
            </div>
            <div className="mb-2">
              <strong>Status:</strong>{" "}
              {(() => {
                const { label, variant } = normalizeStatus(selectedAppointment);
                const showOverdue = selectedAppointment.is_overdue && selectedAppointment.status !== "completed";
                return (
                  <>
                    <span className={`badge text-bg-${STATUS_BADGE[variant] || "light"}`}>{label}</span>
                    {showOverdue && <span className="badge text-bg-danger ms-1">overdue</span>}
                  </>
                );
              })()}
            </div>
            {selectedAppointment.referring_facility_id && (
              <div className="mb-2">
                <strong>Referring facility:</strong> {selectedAppointment.facility_name || "—"}
              </div>
            )}
            {selectedAppointment.provider_name && (
              <div className="mb-2">
                <strong>Provider:</strong> {selectedAppointment.provider_title} {selectedAppointment.provider_name}
              </div>
            )}
            {selectedAppointment.referral_note && (
              <div className="mb-2">
                <strong>Referral note:</strong>
                <p className="mb-0">{selectedAppointment.referral_note}</p>
              </div>
            )}
            {selectedAppointment.referral_file && (
              <div className="mb-2">
                <strong>Attachment:</strong>{" "}
                <a href={selectedAppointment.referral_file} target="_blank" rel="noreferrer">
                  View document
                </a>
              </div>
            )}
            {selectedAppointment.status_reason && (
              <div className="mb-2">
                <strong>Status notes:</strong>
                <p className="mb-0">{selectedAppointment.status_reason}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </PortalLayout>
  );
}
