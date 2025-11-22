import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PortalLayout from "../components/PortalLayout.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const services = [
  { slug: "chemistry", label: "Clinical Chemistry" },
  { slug: "haematology", label: "Haematology" },
  { slug: "serology", label: "Serology" },
  { slug: "microbiology", label: "Microbiology" },
  { slug: "molecular", label: "Molecular Diagnostics" },
  { slug: "wellness", label: "Wellness & Preventive" },
];

export default function Appointments() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const doctors = useMemo(
    () => [
      { name: "Dr. Maya Patel", specialty: "Haematology", status: "Available Today" },
      { name: "Dr. Lungi Nkosi", specialty: "Molecular", status: "Available Wed" },
      { name: "Dr. Sofia Mwansa", specialty: "Microbiology", status: "On leave" },
    ],
    []
  );

  const stats = useMemo(
    () => [
      { label: "Upcoming visits", value: 2, icon: "bi-calendar-event", color: "#0d6efd" },
      { label: "Pending approvals", value: 1, icon: "bi-hourglass", color: "#f76707" },
      { label: "Messages", value: 3, icon: "bi-chat-left-text", color: "#20c997" },
    ],
    []
  );

  const [appointmentForm, setAppointmentForm] = useState({
    type: "new",
    service: services[0].slug,
    doctor: "Dr. Maya Patel",
    date: "",
    note: "",
    attachment: "",
  });
  const [cancelForm, setCancelForm] = useState({ appointmentId: "APT-2024-0092", reason: "" });
  const [rescheduleForm, setRescheduleForm] = useState({ appointmentId: "APT-2024-0093", newDate: "" });

  const submitAppointment = (e) => {
    e.preventDefault();
    alert("Appointment request queued (placeholder).");
    setAppointmentForm({ ...appointmentForm, date: "", note: "", attachment: "" });
  };

  const submitCancel = (e) => {
    e.preventDefault();
    alert(`Appointment ${cancelForm.appointmentId} cancellation submitted.`);
    setCancelForm({ ...cancelForm, reason: "" });
  };

  const submitReschedule = (e) => {
    e.preventDefault();
    alert(`Appointment ${rescheduleForm.appointmentId} reschedule requested.`);
    setRescheduleForm({ ...rescheduleForm, newDate: "" });
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
      onLogout={async () => {
        await logout();
        navigate("/login", { replace: true });
      }}
    >
      <div className="row g-4 mb-4">
        {stats.map((stat) => (
          <div className="col-md-4" key={stat.label}>
            <div className="portal-stat-card" style={{ background: stat.color }}>
              <div>
                <div className="stat-label text-uppercase">{stat.label}</div>
                <div className="stat-value">{stat.value}</div>
              </div>
              <div className="stat-icon">
                <i className={`bi ${stat.icon}`}></i>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="row g-4">
        <div className="col-xl-7">
          <div className="card portal-card h-100">
            <div className="card-body">
              <div className="portal-section-title mb-2">Schedule a visit</div>
              <p className="text-muted">
                Choose the appointment type, service line, preferred doctor, and attach referral documents if needed.
              </p>
              <form onSubmit={submitAppointment} className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Appointment type</label>
                  <select
                    className="form-select"
                    value={appointmentForm.type}
                    onChange={(e) => setAppointmentForm({ ...appointmentForm, type: e.target.value })}
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
                    onChange={(e) => setAppointmentForm({ ...appointmentForm, service: e.target.value })}
                  >
                    {services.map((srv) => (
                      <option key={srv.slug} value={srv.slug}>{srv.label}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Preferred doctor</label>
                  <select
                    className="form-select"
                    value={appointmentForm.doctor}
                    onChange={(e) => setAppointmentForm({ ...appointmentForm, doctor: e.target.value })}
                  >
                    {doctors.map((doc) => (
                      <option key={doc.name} value={doc.name}>{doc.name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Desired date &amp; time</label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    value={appointmentForm.date}
                    onChange={(e) => setAppointmentForm({ ...appointmentForm, date: e.target.value })}
                    required
                  />
                </div>
                <div className="col-12">
                  <label className="form-label">Notes / reason</label>
                  <textarea
                    rows="3"
                    className="form-control"
                    placeholder="Describe your symptoms or referral context"
                    value={appointmentForm.note}
                    onChange={(e) => setAppointmentForm({ ...appointmentForm, note: e.target.value })}
                  ></textarea>
                </div>
                <div className="col-12">
                  <label className="form-label">Referral documents</label>
                  <input
                    type="file"
                    className="form-control"
                    onChange={(e) =>
                      setAppointmentForm({
                        ...appointmentForm,
                        attachment: e.target.files?.[0]?.name || "",
                      })
                    }
                  />
                  {appointmentForm.attachment && (
                    <small className="text-muted">Attached: {appointmentForm.attachment}</small>
                  )}
                </div>
                <div className="col-12">
                  <button className="btn btn-primary w-100" type="submit">
                    Submit request
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
              <div className="list-group list-group-flush">
                {doctors.map((doc) => (
                  <div className="list-group-item" key={doc.name}>
                    <div className="fw-semibold">{doc.name}</div>
                    <div className="small text-muted">{doc.specialty}</div>
                    <span className="badge text-bg-light mt-2">{doc.status}</span>
                  </div>
                ))}
              </div>
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
          <div className="portal-section-title mb-2">History &amp; status</div>
          <p className="text-muted">Keep track of every touchpoint.</p>
          <div className="table-responsive">
            <table className="table portal-table align-middle">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Service</th>
                  <th>Doctor</th>
                  <th>Slot</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>APT-2024-0092</td>
                  <td>Haematology</td>
                  <td>Dr. Maya Patel</td>
                  <td>Nov 30 • 09:00</td>
                  <td><span className="badge text-bg-warning">Pending approval</span></td>
                </tr>
                <tr>
                  <td>APT-2024-0093</td>
                  <td>Molecular</td>
                  <td>Dr. Lungi Nkosi</td>
                  <td>Dec 02 • 11:30</td>
                  <td><span className="badge text-bg-success">Confirmed</span></td>
                </tr>
                <tr>
                  <td>APT-2024-0090</td>
                  <td>Microbiology</td>
                  <td>Dr. Sofia Mwansa</td>
                  <td>Nov 10 • 10:15</td>
                  <td><span className="badge text-bg-secondary">Completed</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
