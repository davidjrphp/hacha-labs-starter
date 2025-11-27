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
  onMenuSelect,
  children,
}) {
  const { user } = useAuth();
  const [activeKey, setActiveKey] = useState(menuItems[0]?.key ?? "dashboard");
  const [expanded, setExpanded] = useState({});

  const handleMenuClick = (key) => {
    setActiveKey(key);
    if (onMenuSelect) onMenuSelect(key);
  };

  const toggleGroup = (key) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="portal-shell">
      <aside className="portal-sidebar">
        <div className="portal-brand">
          <img src="/hacha-logo.png" alt="Hacha Labs" />
          <div>
            <div className="fw-semibold">Hacha Labs</div>
            <small className="text-white-50 text-uppercase">Control Portal</small>
          </div>
        </div>
        <div className="portal-menu">
          {menuItems.map((item) =>
            item.children ? (
              <div key={item.key} className="w-100">
                <button
                  type="button"
                  className={`d-flex justify-content-between align-items-center ${expanded[item.key] ? "active" : ""}`}
                  onClick={() => toggleGroup(item.key)}
                >
                  <span>
                    <i className={`bi ${item.icon} me-2`}></i>
                    {item.label}
                  </span>
                  <i className={`bi ${expanded[item.key] ? "bi-chevron-up" : "bi-chevron-down"}`}></i>
                </button>
                {expanded[item.key] && (
                  <div className="portal-submenu">
                    {item.children.map((child) => (
                      <button
                        key={child.key}
                        type="button"
                        className={child.key === activeKey ? "active" : ""}
                        onClick={() => handleMenuClick(child.key)}
                      >
                        <i className={`bi ${child.icon} me-2`}></i>
                        {child.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <button
                key={item.key}
                type="button"
                className={item.key === activeKey ? "active" : ""}
                onClick={() => handleMenuClick(item.key)}
              >
                <i className={`bi ${item.icon}`}></i>
                {item.label}
              </button>
            )
          )}
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
