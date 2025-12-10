import { useNavigate } from "react-router-dom";
import PortalLayout from "../components/PortalLayout.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function DoctorReports() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const menuItems = [
    { key: "schedule", icon: "bi-calendar-week", label: "Schedule" },
    { key: "patients", icon: "bi-person-vcard", label: "Patients" },
    { key: "messages", icon: "bi-chat-dots", label: "Messages" },
    { key: "reports", icon: "bi-bar-chart-line", label: "Reports" },
  ];

  return (
    <PortalLayout
      title="Reports"
      subtitle="Analytics and performance metrics will appear here."
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
    >
      <div className="card portal-card">
        <div className="card-body text-center py-5">
          <h5 className="mb-2">Reports coming soon</h5>
          <p className="text-muted">Track turnaround times, productivity, and quality metrics.</p>
        </div>
      </div>
    </PortalLayout>
  );
}
