import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function NavbarX({ theme, setTheme }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const portalPath = user
    ? user.role === "admin"
      ? "/admin"
      : user.role === "doctor"
        ? "/doctor"
        : "/appointments"
    : "/login";

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <nav className="navbar navbar-expand-lg bg-body-tertiary sticky-top border-bottom shadow-sm">
      <div className="container">
        {/* BRAND pinned left */}
        <Link to="/" className="navbar-brand d-flex align-items-center me-3">
          <img src="/hacha-logo.png" alt="Hacha Labs" className="brand-logo me-2" />
          <span className="fw-semibold d-none d-sm-inline">Hacha Labs</span>
        </Link>

        {/* Toggler */}
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#nav"
          aria-controls="nav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* MENU pushed to right */}
        <div className="collapse navbar-collapse" id="nav">
          <ul className="navbar-nav ms-auto align-items-lg-center gap-lg-2">
            <li className="nav-item">
              <NavLink end className="nav-link" to="/">Home</NavLink>
            </li>

            <li className="nav-item dropdown">
              <button className="nav-link dropdown-toggle bg-transparent border-0" data-bs-toggle="dropdown">
                Lab Services
              </button>
              <ul className="dropdown-menu dropdown-menu-end">
                <li><Link className="dropdown-item" to="/services/chemistry">Clinical Chemistry</Link></li>
                <li><Link className="dropdown-item" to="/services/haematology">Haematology</Link></li>
                <li><Link className="dropdown-item" to="/services/serology">Serology</Link></li>
                <li><Link className="dropdown-item" to="/services/microbiology">Microbiology</Link></li>
                <li><Link className="dropdown-item" to="/services/molecular">Molecular</Link></li>
                <li><Link className="dropdown-item" to="/services/wellness">Wellness Programs</Link></li>
              </ul>
            </li>

            <li className="nav-item dropdown">
              <button className="nav-link dropdown-toggle bg-transparent border-0" data-bs-toggle="dropdown">
                Research
              </button>
              <ul className="dropdown-menu dropdown-menu-end">
                <li><Link className="dropdown-item" to="/research/human">Human-based</Link></li>
                <li><Link className="dropdown-item" to="/research/socio">Socio-based</Link></li>
                <li><Link className="dropdown-item" to="/research/adaptive">Adaptive</Link></li>
              </ul>
            </li>

            <li className="nav-item dropdown">
              <button className="nav-link dropdown-toggle bg-transparent border-0" data-bs-toggle="dropdown">
                Specialized services
              </button>
              <ul className="dropdown-menu dropdown-menu-end">
                <li><Link className="dropdown-item" to="/specialized/agri">Agri-services</Link></li>
                <li><Link className="dropdown-item" to="/specialized/other">Other</Link></li>
              </ul>
            </li>

            <li className="nav-item"><NavLink className="nav-link" to="/about">About Us</NavLink></li>
            <li className="nav-item"><NavLink className="nav-link" to="/contact">Contact</NavLink></li>

            {/* Actions */}
            {user ? (
              <>
                <li className="nav-item">
                  <Link className="nav-link fw-semibold" to={portalPath}>
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)} Portal
                  </Link>
                </li>
                <li className="nav-item">
                  <button className="nav-link btn btn-link px-0" type="button" onClick={handleLogout}>
                    Sign Out
                  </button>
                </li>
              </>
            ) : (
              <li className="nav-item"><NavLink className="nav-link" to="/login">Sign-In</NavLink></li>
            )}
          </ul>

          {/* Mobile actions */}
          <div className="d-lg-none mt-3 d-flex gap-2">
            {user ? (
              <>
                <Link className="btn btn-outline-primary flex-grow-1" to={portalPath}>Go to Portal</Link>
                <button className="btn btn-secondary" type="button" onClick={handleLogout}>Sign Out</button>
              </>
            ) : (
              <>
                <Link className="btn btn-outline-secondary" to="/login">Sign-In</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
