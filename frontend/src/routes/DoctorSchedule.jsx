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

const buildAttachmentUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const base = http.defaults.baseURL?.replace(/\/api\/?$/, "") || "";
  return base + path;
};

export default function DoctorSchedule() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionState, setActionState] = useState({ id: null, action: null });
  const [selectedAppointment, setSelectedAppointment] = useState(null);

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

  const tableRows = useMemo(() => appointments, [appointments]);

  return (
    <PortalLayout
      title="Scheduling & Appointments"
      subtitle="Review every appointment assigned to you, approve, decline, or review documents."
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
    >
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <div>
          <div className="portal-section-title mb-1">All appointments</div>
          <p className="text-muted mb-0">Use the controls below to act on referrals and visits.</p>
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
                        <span className={`badge text-bg-${STATUS_BADGE[appt.status] || "light"}`}>
                          {appt.status}
                        </span>
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
              <span className={`badge text-bg-${STATUS_BADGE[selectedAppointment.status] || "light"}`}>
                {selectedAppointment.status}
              </span>
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
                <a href={buildAttachmentUrl(selectedAppointment.referral_file)} target="_blank" rel="noreferrer">
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
