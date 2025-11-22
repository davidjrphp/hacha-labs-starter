import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

const defaultMenu = [
  { key: "dashboard", icon: "bi-speedometer2", label: "Dashboard" },
  { key: "people", icon: "bi-people", label: "People" },
  { key: "content", icon: "bi-card-image", label: "Content Studio" },
  { key: "appointments", icon: "bi-calendar-event", label: "Appointments" },
  { key: "system", icon: "bi-gear", label: "System" },
];

export default function PortalLayout({
  title,
  subtitle,
  menuItems = defaultMenu,
  onLogout,
  children,
}) {
  const { user } = useAuth();
  const [activeKey, setActiveKey] = useState(menuItems[0]?.key ?? "dashboard");

  return (
    <div className="portal-shell">
      <aside className="portal-sidebar">
        <div className="portal-brand">
          <img src="/hacha-logo.png" alt="Hacha Labs" />
          <div>
            <div className="fw-semibold">Hacha Labs</div>
            <small className="text-white-50 text-uppercase">Control Center</small>
          </div>
        </div>
        <div className="portal-menu">
          {menuItems.map((item) => (
            <button
              key={item.key}
              type="button"
              className={item.key === activeKey ? "active" : ""}
              onClick={() => setActiveKey(item.key)}
            >
              <i className={`bi ${item.icon}`}></i>
              {item.label}
            </button>
          ))}
        </div>
        <div className="p-3 border-top border-light border-opacity-10 small text-center text-white-50">
          <div className="fw-semibold text-white">{user?.full_name}</div>
          <div className="text-uppercase">{user?.role}</div>
          {onLogout && (
            <button className="btn btn-outline-light btn-sm mt-2" onClick={onLogout}>
              Sign Out
            </button>
          )}
        </div>
      </aside>

      <main className="portal-main">
        <header className="portal-header">
          <div>
            <h1 className="mb-1">{title}</h1>
            {subtitle && <small>{subtitle}</small>}
          </div>
          <div className="d-flex align-items-center gap-3">
            <button className="btn btn-outline-secondary btn-sm">
              <i className="bi bi-bell me-1"></i>
              Notifications
            </button>
            <div className="user-pill">
              <i className="bi bi-person-circle fs-4"></i>
              <span>{user?.full_name}</span>
            </div>
            {onLogout && (
              <button className="btn btn-danger btn-sm d-flex align-items-center gap-2" onClick={onLogout}>
                <i className="bi bi-box-arrow-right"></i>
                Sign out
              </button>
            )}
          </div>
        </header>

        <div className="portal-content">{children}</div>
        <footer className="portal-footer">
          <div>© {new Date().getFullYear()} Hacha Labs. All rights reserved.</div>
          <div className="text-uppercase text-muted">Fostering Health &amp; Wellbeing</div>
        </footer>
      </main>
    </div>
  );
}
