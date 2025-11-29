import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PortalLayout from "../components/PortalLayout.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import http from "../api/http.js";

const services = [
  { slug: "chemistry", label: "Clinical Chemistry" },
  { slug: "haematology", label: "Haematology" },
  { slug: "serology", label: "Serology" },
  { slug: "microbiology", label: "Microbiology" },
  { slug: "molecular", label: "Molecular Diagnostics" },
  { slug: "wellness", label: "Wellness & Preventive" },
];

const sexOptions = [
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
  { value: "other", label: "Other / Prefer not to say" },
];

const statusVariants = {
  pending: "warning",
  approved: "success",
  declined: "danger",
  completed: "secondary",
};

const serviceLabelMap = services.reduce((acc, srv) => {
  acc[srv.slug] = srv.label;
  return acc;
}, {});

const formatAppointmentId = (id) => `APT-${String(id).padStart(5, "0")}`;

export default function Appointments() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [activePanel, setActivePanel] = useState("appointments");

  const [summary, setSummary] = useState({ upcoming_visits: 0, pending_approvals: 0, unread_messages: 0 });
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState(null);

  const [appointments, setAppointments] = useState([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [appointmentsError, setAppointmentsError] = useState(null);

  const [doctors, setDoctors] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [providers, setProviders] = useState([]);
  const [doctorsLoading, setDoctorsLoading] = useState(true);
  const [facilitiesLoading, setFacilitiesLoading] = useState(true);
  const [specialistAlert, setSpecialistAlert] = useState(null);
  const [doctorAvailability, setDoctorAvailability] = useState({ available: true, message: null, next_available: null });
  const [checkingDoctor, setCheckingDoctor] = useState(false);

  const [appointmentForm, setAppointmentForm] = useState({
    type: "new",
    service: services[0].slug,
    doctorId: "",
    date: "",
    note: "",
    attachment: null,
    age: "",
    phone: "",
    sex: "female",
    city: "",
    address: "",
    facilityId: "",
    providerId: "",
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formFeedback, setFormFeedback] = useState(null);

  const [cancelForm, setCancelForm] = useState({ appointmentId: "", reason: "" });
  const [rescheduleForm, setRescheduleForm] = useState({ appointmentId: "", newDate: "" });
  const formatDateTimeFriendly = useCallback((value) => {
    if (!value) return "";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, []);

  const stats = useMemo(
    () => [
      { label: "Upcoming visits", value: summary.upcoming_visits, icon: "bi-calendar-event", color: "#0d6efd" },
      { label: "Pending approvals", value: summary.pending_approvals, icon: "bi-hourglass", color: "#f76707" },
      { label: "Messages", value: summary.unread_messages, icon: "bi-chat-left-text", color: "#20c997" },
    ],
    [summary]
  );

  useEffect(() => {
    loadSummary();
    loadAppointments();
    loadDoctors();
    loadFacilities();
  }, []);

  useEffect(() => {
    if (appointments.length) {
      const defaultId = appointments[0]?.id ? formatAppointmentId(appointments[0].id) : "";
      setCancelForm((prev) => ({ ...prev, appointmentId: prev.appointmentId || defaultId }));
      setRescheduleForm((prev) => ({ ...prev, appointmentId: prev.appointmentId || defaultId }));
    }
  }, [appointments]);

  useEffect(() => {
    if (doctors.length && !appointmentForm.doctorId) {
      setAppointmentForm((prev) => ({ ...prev, doctorId: String(doctors[0].id) }));
    }
  }, [doctors, appointmentForm.doctorId]);

  useEffect(() => {
    if (appointmentForm.type !== "referral") {
      setAppointmentForm((prev) => ({ ...prev, facilityId: "", providerId: "" }));
      setProviders([]);
    } else if (appointmentForm.facilityId) {
      fetchProviders(appointmentForm.facilityId);
    }
  }, [appointmentForm.type, appointmentForm.facilityId]);

  const loadSummary = async () => {
    setSummaryLoading(true);
    setSummaryError(null);
    try {
      const { data } = await http.get("/appointments/summary");
      setSummary(data);
    } catch (error) {
      setSummaryError(error.response?.data?.message || "Unable to load dashboard metrics.");
    } finally {
      setSummaryLoading(false);
    }
  };

  const loadAppointments = async () => {
    setAppointmentsLoading(true);
    setAppointmentsError(null);
    try {
      const { data } = await http.get("/appointments/me");
      setAppointments(Array.isArray(data) ? data : []);
    } catch (error) {
      setAppointmentsError(error.response?.data?.message || "Unable to load appointments.");
      setAppointments([]);
    } finally {
      setAppointmentsLoading(false);
    }
  };

  const loadDoctors = async () => {
    setDoctorsLoading(true);
    try {
      const { data } = await http.get("/doctors/availability");
      const unique = new Map();
      data.forEach((slot) => {
        if (!unique.has(slot.doctor_id)) {
          unique.set(slot.doctor_id, {
            id: slot.doctor_id,
            name: slot.full_name,
            specialty: slot.specialty,
            status: "Available",
          });
        }
      });
      setDoctors(Array.from(unique.values()));
    } catch (error) {
      setDoctors([]);
    } finally {
      setDoctorsLoading(false);
    }
  };

  const loadFacilities = async () => {
    setFacilitiesLoading(true);
    try {
      const { data } = await http.get("/facilities");
      setFacilities(Array.isArray(data) ? data : []);
    } catch (error) {
      setFacilities([]);
    } finally {
      setFacilitiesLoading(false);
    }
  };

  const fetchProviders = async (facilityId) => {
    if (!facilityId) {
      setProviders([]);
      return;
    }
    try {
      const { data } = await http.get("/facilities/providers", { params: { facility_id: facilityId } });
      setProviders(data);
    } catch (error) {
      setProviders([]);
    }
  };

  useEffect(() => {
    if (!appointmentForm.date || !appointmentForm.doctorId) {
      setDoctorAvailability({ available: true, message: null, next_available: null });
      setSpecialistAlert(null);
      return;
    }
    let cancelled = false;
    setCheckingDoctor(true);
    http
      .get("/appointments/check", {
        params: {
          doctor_id: appointmentForm.doctorId,
          slot_start: appointmentForm.date,
        },
      })
      .then(({ data }) => {
        if (cancelled) return;
        const isAvailable = data?.available !== false;
        const message = data?.message || "";
        const nextAvailable = data?.next_available || null;
        setDoctorAvailability({ available: !!isAvailable, message, next_available: nextAvailable });
        const specialist = doctors.find((doc) => String(doc.id) === String(appointmentForm.doctorId));
        const specialistName = specialist?.name || "Selected specialist";
        const dateLabel = formatDateTimeFriendly(appointmentForm.date);
        if (isAvailable) {
          setSpecialistAlert({
            type: "success",
            message: `${specialistName} is available on ${dateLabel}.`,
          });
        } else {
          const nextLabel = nextAvailable ? formatDateTimeFriendly(nextAvailable) : null;
          setSpecialistAlert({
            type: "warning",
            message:
              `${specialistName} is already booked for ${dateLabel}.` +
              (nextLabel ? ` Next availability after ${nextLabel}.` : ""),
          });
        }
      })
      .catch((error) => {
        if (cancelled) return;
        const errMessage = error.response?.data?.message || "Unable to verify specialist availability.";
        setDoctorAvailability({ available: false, message: errMessage, next_available: null });
        setSpecialistAlert({ type: "danger", message: errMessage });
      })
      .finally(() => {
        if (!cancelled) setCheckingDoctor(false);
      });

    return () => {
      cancelled = true;
    };
  }, [appointmentForm.doctorId, appointmentForm.date, formatDateTimeFriendly, doctors]);

  const handleAppointmentChange = (field, value) => {
    setAppointmentForm((prev) => ({ ...prev, [field]: value }));
  };

  const submitAppointment = async (e) => {
    e.preventDefault();
    setFormFeedback(null);
    if (!appointmentForm.date) {
      setFormFeedback({ type: "danger", message: "Please select a desired date and time." });
      return;
    }
    if (!appointmentForm.doctorId) {
      setFormFeedback({ type: "danger", message: "Choose a doctor before submitting." });
      return;
    }
    if (appointmentForm.type === "referral" && (!appointmentForm.facilityId || !appointmentForm.providerId)) {
      setFormFeedback({ type: "danger", message: "Referral requests require facility and provider details." });
      return;
    }

    if (!doctorAvailability.available) {
      const nextLabel = doctorAvailability.next_available ? formatDateTimeFriendly(doctorAvailability.next_available) : null;
      setFormFeedback({
        type: "danger",
        message:
          (doctorAvailability.message || "Specialist already booked for that time.") +
          (nextLabel ? ` Next available slot after ${nextLabel}. Please choose another time.` : " Please choose another time."),
      });
      return;
    }

    const formData = new FormData();
    formData.append("type", appointmentForm.type);
    formData.append("service_code", appointmentForm.service);
    formData.append("doctor_id", appointmentForm.doctorId);
    formData.append("slot_start", appointmentForm.date);
    formData.append("referral_note", appointmentForm.note);
    formData.append("patient_age", appointmentForm.age);
    formData.append("patient_phone", appointmentForm.phone);
    formData.append("patient_sex", appointmentForm.sex);
    formData.append("patient_city", appointmentForm.city);
    formData.append("patient_address", appointmentForm.address);
    if (appointmentForm.type === "referral") {
      formData.append("referring_facility_id", appointmentForm.facilityId);
      formData.append("referring_provider_id", appointmentForm.providerId);
    }
    if (appointmentForm.attachment) {
      formData.append("attachment", appointmentForm.attachment);
    }

    setFormSubmitting(true);
    try {
      await http.post("/appointments", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setFormFeedback({ type: "success", message: "Appointment submitted for review." });
      setAppointmentForm((prev) => ({
        ...prev,
        date: "",
        note: "",
        attachment: null,
        age: "",
        phone: "",
        city: "",
        address: "",
        facilityId: prev.type === "referral" ? "" : prev.facilityId,
        providerId: prev.type === "referral" ? "" : prev.providerId,
      }));
      await Promise.all([loadSummary(), loadAppointments()]);
    } catch (error) {
      setFormFeedback({
        type: "danger",
        message: error.response?.data?.message || "Unable to submit appointment.",
      });
    } finally {
      setFormSubmitting(false);
    }
  };

  const submitCancel = (e) => {
    e.preventDefault();
    alert(`Appointment ${cancelForm.appointmentId} cancellation submitted (placeholder).`);
    setCancelForm({ ...cancelForm, reason: "" });
  };

  const submitReschedule = (e) => {
    e.preventDefault();
    alert(`Appointment ${rescheduleForm.appointmentId} reschedule requested (placeholder).`);
    setRescheduleForm({ ...rescheduleForm, newDate: "" });
  };

  const renderPlaceholder = (title, description, action) => (
    <div className="card portal-card">
      <div className="card-body text-center py-5">
        <h5 className="mb-2">{title}</h5>
        <p className="text-muted mb-3">{description}</p>
        {action}
      </div>
    </div>
  );

  const renderAppointmentPanel = () => (
    <>
      <div className="row g-4 mb-4">
        {stats.map((stat) => (
          <div className="col-md-4" key={stat.label}>
            <div className="portal-stat-card" style={{ background: stat.color }}>
              <div>
                <div className="stat-label text-uppercase d-flex align-items-center gap-2">
                  {stat.label}
                  {summaryLoading && <span className="spinner-border spinner-border-sm text-white"></span>}
                </div>
                <div className="stat-value">{stat.value}</div>
              </div>
              <div className="stat-icon">
                <i className={`bi ${stat.icon}`}></i>
              </div>
            </div>
          </div>
        ))}
      </div>
      {summaryError && <div className="alert alert-warning">{summaryError}</div>}

      <div className="row g-4">
        <div className="col-xl-7">
          <div className="card portal-card h-100">
            <div className="card-body">
              <div className="portal-section-title mb-2">Schedule a visit</div>
              <p className="text-muted">
                Provide your latest demographics and attach referral files. We will notify you once approved.
              </p>
              <form onSubmit={submitAppointment} className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Appointment type</label>
                  <select
                    className="form-select"
                    value={appointmentForm.type}
                    onChange={(e) => handleAppointmentChange("type", e.target.value)}
                  >
                    <option value="new">New patient</option>
                    <option value="returning">Returning</option>
                    <option value="referral">Referral</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Service</label>
                  <select
                    className="form-select"
                    value={appointmentForm.service}
                    onChange={(e) => handleAppointmentChange("service", e.target.value)}
                  >
                    {services.map((srv) => (
                      <option key={srv.slug} value={srv.slug}>
                        {srv.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label d-flex justify-content-between align-items-center">
                    <span>Preferred specialist</span>
                    {checkingDoctor && (
                      <span className="spinner-border spinner-border-sm text-primary" role="status"></span>
                    )}
                  </label>
                  <select
                    className="form-select"
                    value={appointmentForm.doctorId}
                    onChange={(e) => handleAppointmentChange("doctorId", e.target.value)}
                    disabled={doctorsLoading}
                  >
                    <option value="">Select specialist</option>
                    {doctors.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {doc.name} • {doc.specialty}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Desired date &amp; time</label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    value={appointmentForm.date}
                    onChange={(e) => handleAppointmentChange("date", e.target.value)}
                    required
                  />
                </div>
                {specialistAlert && (
                  <div className="col-12">
                    <div
                      className={`alert alert-${specialistAlert.type} d-flex align-items-center gap-2`}
                      role="alert"
                    >
                      <i
                        className={`bi ${
                          specialistAlert.type === "success" ? "bi-check-circle-fill" : "bi-exclamation-triangle-fill"
                        }`}
                      ></i>
                      <span>{specialistAlert.message}</span>
                    </div>
                  </div>
                )}
                <div className="col-md-4">
                  <label className="form-label">Age</label>
                  <input
                    type="number"
                    min="0"
                    className="form-control"
                    value={appointmentForm.age}
                    onChange={(e) => handleAppointmentChange("age", e.target.value)}
                    required
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Phone</label>
                  <input
                    type="tel"
                    className="form-control"
                    value={appointmentForm.phone}
                    onChange={(e) => handleAppointmentChange("phone", e.target.value)}
                    required
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Sex</label>
                  <select
                    className="form-select"
                    value={appointmentForm.sex}
                    onChange={(e) => handleAppointmentChange("sex", e.target.value)}
                  >
                    {sexOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">City / Town</label>
                  <input
                    className="form-control"
                    value={appointmentForm.city}
                    onChange={(e) => handleAppointmentChange("city", e.target.value)}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Physical address</label>
                  <input
                    className="form-control"
                    value={appointmentForm.address}
                    onChange={(e) => handleAppointmentChange("address", e.target.value)}
                    required
                  />
                </div>
                {appointmentForm.type === "referral" && (
                  <>
                    <div className="col-md-6">
                      <label className="form-label">Referring healthcare facility</label>
                      <select
                        className="form-select"
                        value={appointmentForm.facilityId}
                        onChange={(e) => handleAppointmentChange("facilityId", e.target.value)}
                        disabled={facilitiesLoading}
                        required
                      >
                        <option value="">Select facility</option>
                        {facilities.map((facility) => (
                          <option key={facility.id} value={facility.id}>
                            {facility.name} {facility.city ? `• ${facility.city}` : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Referring provider</label>
                      <select
                        className="form-select"
                        value={appointmentForm.providerId}
                        onChange={(e) => handleAppointmentChange("providerId", e.target.value)}
                        required
                      >
                        <option value="">Select provider</option>
                        {providers.map((provider) => (
                          <option key={provider.id} value={provider.id}>
                            {provider.provider_name} {provider.title ? `• ${provider.title}` : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}
                <div className="col-12">
                  <label className="form-label">Notes / reason</label>
                  <textarea
                    rows="3"
                    className="form-control"
                    placeholder="Describe your symptoms or referral context"
                    value={appointmentForm.note}
                    onChange={(e) => handleAppointmentChange("note", e.target.value)}
                  ></textarea>
                </div>
                <div className="col-12">
                  <label className="form-label">Referral documents</label>
                  <input
                    type="file"
                    className="form-control"
                    onChange={(e) => handleAppointmentChange("attachment", e.target.files?.[0] || null)}
                  />
                  {appointmentForm.attachment && (
                    <small className="text-muted">Attached: {appointmentForm.attachment.name}</small>
                  )}
                </div>
                {formFeedback && (
                  <div className={`alert alert-${formFeedback.type} mb-0`} role="alert">
                    {formFeedback.message}
                  </div>
                )}
                <div className="col-12">
                  <button className="btn btn-primary w-100" type="submit" disabled={formSubmitting}>
                    {formSubmitting ? "Submitting…" : "Submit request"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
        <div className="col-xl-5">
          <div className="card portal-card mb-4">
            <div className="card-body">
              <div className="portal-section-title mb-2">Available doctors</div>
              <p className="text-muted">Match schedules in real time.</p>
              {doctorsLoading ? (
                <div className="text-center py-3">
                  <div className="spinner-border text-primary" role="status"></div>
                </div>
              ) : (
                <div className="list-group list-group-flush">
                  {doctors.map((doc) => (
                    <div className="list-group-item" key={doc.id}>
                      <div className="fw-semibold">{doc.name}</div>
                      <div className="small text-muted">{doc.specialty}</div>
                      <span className="badge text-bg-light mt-2">{doc.status}</span>
                    </div>
                  ))}
                  {doctors.length === 0 && <div className="text-muted small">No doctors available.</div>}
                </div>
              )}
            </div>
          </div>
          <div className="card portal-card">
            <div className="card-body">
              <div className="portal-section-title mb-2">Quick actions</div>
              <p className="text-muted">Cancel or reschedule without calling the clinic.</p>
              <form className="mb-3" onSubmit={submitCancel}>
                <label className="form-label">Cancel appointment</label>
                <input
                  className="form-control mb-2"
                  value={cancelForm.appointmentId}
                  onChange={(e) => setCancelForm({ ...cancelForm, appointmentId: e.target.value })}
                  required
                />
                <textarea
                  className="form-control mb-2"
                  rows="2"
                  placeholder="Reason"
                  value={cancelForm.reason}
                  onChange={(e) => setCancelForm({ ...cancelForm, reason: e.target.value })}
                  required
                ></textarea>
                <button className="btn btn-outline-danger w-100" type="submit">
                  Cancel appointment
                </button>
              </form>
              <form onSubmit={submitReschedule}>
                <label className="form-label">Reschedule appointment</label>
                <input
                  className="form-control mb-2"
                  value={rescheduleForm.appointmentId}
                  onChange={(e) => setRescheduleForm({ ...rescheduleForm, appointmentId: e.target.value })}
                  required
                />
                <input
                  type="datetime-local"
                  className="form-control mb-2"
                  value={rescheduleForm.newDate}
                  onChange={(e) => setRescheduleForm({ ...rescheduleForm, newDate: e.target.value })}
                  required
                />
                <button className="btn btn-outline-primary w-100" type="submit">
                  Submit reschedule
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <div className="card portal-card mt-4">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <div>
              <div className="portal-section-title mb-1">History &amp; status</div>
              <p className="text-muted mb-0">Keep track of every touchpoint.</p>
            </div>
            <button className="btn btn-outline-secondary btn-sm" onClick={loadAppointments} disabled={appointmentsLoading}>
              <i className="bi bi-arrow-repeat me-1"></i>Refresh
            </button>
          </div>
          {appointmentsError && <div className="alert alert-warning">{appointmentsError}</div>}
          <div className="table-responsive">
            {appointmentsLoading ? (
              <div className="text-center py-4">
                <div className="spinner-border text-primary" role="status"></div>
              </div>
            ) : (
              <table className="table portal-table align-middle">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Service</th>
                    <th>Doctor</th>
                    <th>Slot</th>
                    <th>Status</th>
                    <th>Referral</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((appt) => (
                    <tr key={appt.id}>
                      <td>{formatAppointmentId(appt.id)}</td>
                      <td>{serviceLabelMap[appt.service_code] || appt.service_code || "—"}</td>
                      <td>{appt.doctor_name || "—"}</td>
                      <td>{appt.slot_start ? new Date(appt.slot_start).toLocaleString() : "—"}</td>
                      <td>
                        <span className={`badge text-bg-${statusVariants[appt.status] || "secondary"}`}>
                          {appt.status}
                        </span>
                      </td>
                      <td>
                        {appt.facility_name ? (
                          <>
                            <div className="small">{appt.facility_name}</div>
                            <div className="text-muted small">{appt.provider_name}</div>
                          </>
                        ) : (
                          <span className="text-muted small">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {appointments.length === 0 && (
                    <tr>
                      <td colSpan="6" className="text-center text-muted">
                        No appointments yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </>
  );

  const renderActivePanel = () => {
    switch (activePanel) {
      case "appointments":
        return renderAppointmentPanel();
      case "history":
        return renderPlaceholder(
          "Visit history coming soon",
          "You'll be able to see approved, cancelled, and completed appointments here.",
          <button className="btn btn-outline-primary" disabled>
            View history
          </button>
        );
      case "documents":
        return renderPlaceholder(
          "Referral documents",
          "Upload imaging, lab reports, and referral paperwork for your team.",
          <button className="btn btn-outline-secondary" disabled>
            Manage documents
          </button>
        );
      case "messages":
        return renderPlaceholder(
          "Secure inbox",
          "Chat with coordinators and specialists in one threaded experience.",
          <button className="btn btn-success" disabled>
            Launch inbox
          </button>
        );
      default:
        return renderAppointmentPanel();
    }
  };

  return (
    <PortalLayout
      title="Patient & Referral Hub"
      subtitle="Book, track, and collaborate with your care team without leaving this workspace."
      menuItems={[
        { key: "appointments", icon: "bi-calendar-heart", label: "Appointments" },
        { key: "history", icon: "bi-clock-history", label: "History" },
        { key: "documents", icon: "bi-file-earmark-arrow-up", label: "Documents" },
        { key: "messages", icon: "bi-chat-dots", label: "Messages" },
      ]}
      onMenuSelect={setActivePanel}
      onLogout={async () => {
        await logout();
        navigate("/login", { replace: true });
      }}
    >
      {renderActivePanel()}
    </PortalLayout>
  );
}
