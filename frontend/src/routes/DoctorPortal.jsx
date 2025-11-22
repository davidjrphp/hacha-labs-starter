import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import PortalLayout from "../components/PortalLayout.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function DoctorPortal() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const todaySessions = useMemo(
    () => [
      { patient: "Thato S.", slot: "09:30 • Molecular", status: "Confirmed" },
      { patient: "Nandi B.", slot: "11:15 • Referral", status: "Awaiting Docs" },
      { patient: "Ivan K.", slot: "14:00 • Review", status: "Pending Approval" },
    ],
    []
  );

  return (
    <PortalLayout
      title="Clinical Practice Hub"
      subtitle="Track today’s chair time, patient requests, and ongoing conversations at a glance."
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
      <div className="row g-4 mb-4">
        <div className="col-md-4">
          <div className="portal-stat-card" style={{ background: "#0dcaf0" }}>
            <div>
              <div className="stat-label">Today&apos;s confirmed</div>
              <div className="stat-value">04</div>
            </div>
            <div className="stat-icon">
              <i className="bi bi-check2-square"></i>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="portal-stat-card" style={{ background: "#845ef7" }}>
            <div>
              <div className="stat-label">Pending referrals</div>
              <div className="stat-value">07</div>
            </div>
            <div className="stat-icon">
              <i className="bi bi-clipboard-data"></i>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="portal-stat-card" style={{ background: "#51cf66" }}>
            <div>
              <div className="stat-label">Unread messages</div>
              <div className="stat-value">12</div>
            </div>
            <div className="stat-icon">
              <i className="bi bi-envelope-open"></i>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-lg-7">
          <div className="card portal-card h-100">
            <div className="card-body">
              <div className="portal-section-title mb-2">Today&apos;s timeline</div>
              <p className="text-muted">Confirm seat time or reschedule directly from here.</p>
              <div className="list-group list-group-flush">
                {todaySessions.map((session) => (
                  <div className="list-group-item d-flex justify-content-between align-items-center" key={session.patient}>
                    <div>
                      <div className="fw-semibold">{session.patient}</div>
                      <div className="text-muted small">{session.slot}</div>
                    </div>
                    <span className="badge text-bg-light">{session.status}</span>
                  </div>
                ))}
              </div>
              <button className="btn btn-outline-primary w-100 mt-3">Open scheduling</button>
            </div>
          </div>
        </div>
        <div className="col-lg-5">
          <div className="card portal-card h-100">
            <div className="card-body">
              <div className="portal-section-title mb-2">Messaging queue</div>
              <p className="text-muted">Respond to patients and referral partners securely.</p>
              <ul className="list-group list-group-flush">
                <li className="list-group-item">
                  <div className="fw-semibold">Referral: Dr. Lee</div>
                  <small className="text-muted">Sent lab notes for review · 4 mins ago</small>
                </li>
                <li className="list-group-item">
                  <div className="fw-semibold">Patient: Zinhle P.</div>
                  <small className="text-muted">Requested clarification on meds · 12 mins ago</small>
                </li>
                <li className="list-group-item">
                  <div className="fw-semibold">Patient: David O.</div>
                  <small className="text-muted">Uploaded referral documents · 45 mins ago</small>
                </li>
              </ul>
              <button className="btn btn-success w-100 mt-3">
                <i className="bi bi-chat-text me-1"></i>Enter inbox
              </button>
            </div>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
