import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PortalLayout from "../components/PortalLayout.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import http from "../api/http.js";

const COLORS = ["#0d6efd", "#20c997", "#ffc107", "#d63384", "#6f42c1", "#fd7e14"];

export default function AdminPortal() {
  const [uploading, setUploading] = useState(false);
  const [heroForm, setHeroForm] = useState({ title: "", type: "image" });
  const [heroFile, setHeroFile] = useState(null);
  const [heroFeedback, setHeroFeedback] = useState(null);
  const [newsForm, setNewsForm] = useState({ title: "", body: "" });
  const [newsCover, setNewsCover] = useState(null);
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsFeedback, setNewsFeedback] = useState(null);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const stats = useMemo(
    () => [
      { label: "Pending Approvals", value: 5, icon: "bi-hourglass-split", color: COLORS[0] },
      { label: "Published Staff", value: 18, icon: "bi-people", color: COLORS[1] },
      { label: "Live Media Items", value: 24, icon: "bi-collection-play", color: COLORS[3] },
      { label: "Hero Slides", value: 6, icon: "bi-easel2", color: COLORS[5] },
    ],
    []
  );

  const appointments = [
    { patient: "Lungile D.", type: "Referral", doctor: "Dr. Patel", status: "Awaiting", slot: "Nov 28 • 09:00" },
    { patient: "Kamogelo T.", type: "New", doctor: "Dr. Patel", status: "Approved", slot: "Nov 29 • 13:00" },
    { patient: "Brenda M.", type: "Returning", doctor: "Dr. Okoye", status: "Declined", slot: "Dec 02 • 10:00" },
  ];

  const handleHeroSubmit = async (e) => {
    e.preventDefault();
    setHeroFeedback(null);
    if (!heroFile) {
      setHeroFeedback({ type: "danger", message: "Please attach an image or video." });
      return;
    }
    const formData = new FormData();
    formData.append("caption", heroForm.title);
    formData.append("type", heroForm.type);
    formData.append("is_hero", "1");
    formData.append("media", heroFile);
    setUploading(true);
    try {
      await http.post("/admin/media", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setHeroFeedback({ type: "success", message: "Hero media uploaded successfully." });
      setHeroForm({ title: "", type: "image" });
      setHeroFile(null);
    } catch (error) {
      setHeroFeedback({ type: "danger", message: error.response?.data?.message || "Upload failed." });
    } finally {
      setUploading(false);
    }
  };

  const handleNewsSubmit = async (e) => {
    e.preventDefault();
    setNewsFeedback(null);
    const formData = new FormData();
    formData.append("title", newsForm.title);
    formData.append("body", newsForm.body);
    if (newsCover) {
      formData.append("cover", newsCover);
    }
    setNewsLoading(true);
    try {
      await http.post("/admin/news", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setNewsFeedback({ type: "success", message: "News published to landing feed." });
      setNewsForm({ title: "", body: "" });
      setNewsCover(null);
    } catch (error) {
      setNewsFeedback({ type: "danger", message: error.response?.data?.message || "Unable to save news." });
    } finally {
      setNewsLoading(false);
    }
  };

  return (
    <PortalLayout
      title="Administrative Command Deck"
      subtitle="Monitor all patient journeys, staff visibility, and hero storytelling from a single workspace."
      onLogout={async () => {
        await logout();
        navigate("/login", { replace: true });
      }}
    >
      <div className="row g-4 mb-4">
        {stats.map((stat, idx) => (
          <div className="col-md-3" key={stat.label}>
            <div className="portal-stat-card" style={{ background: stat.color }}>
              <div>
                <div className="stat-label">{stat.label}</div>
                <div className="stat-value">{stat.value}</div>
              </div>
              <div className="stat-icon">
                <i className={`bi ${stat.icon}`}></i>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card portal-card mb-4">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <div className="portal-section-title">Appointments pulse</div>
              <p className="text-muted mb-0">What needs your attention right now</p>
            </div>
            <button className="btn btn-primary btn-sm">
              <i className="bi bi-check2-circle me-1"></i>Approve queue
            </button>
          </div>
          <div className="table-responsive">
            <table className="table portal-table align-middle">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Type</th>
                  <th>Doctor</th>
                  <th>Slot</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((appt) => (
                  <tr key={appt.patient}>
                    <td>{appt.patient}</td>
                    <td>{appt.type}</td>
                    <td>{appt.doctor}</td>
                    <td>{appt.slot}</td>
                    <td>
                      <span className="badge text-bg-light text-capitalize">{appt.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-lg-6">
          <div className="card portal-card h-100">
            <div className="card-body">
              <div className="portal-section-title mb-2">Hero &amp; media curator</div>
              <p className="text-muted">
                Refresh the landing hero carousel with new lab visuals or appointment promos.
              </p>
              <form onSubmit={handleHeroSubmit}>
                <div className="mb-3">
                  <label className="form-label">Slide Caption</label>
                  <input
                    className="form-control"
                    value={heroForm.title}
                    onChange={(e) => setHeroForm({ ...heroForm, title: e.target.value })}
                    placeholder="e.g., Comprehensive molecular diagnostics"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Asset Type</label>
                  <select
                    className="form-select"
                    value={heroForm.type}
                    onChange={(e) => setHeroForm({ ...heroForm, type: e.target.value })}
                  >
                    <option value="image">Image</option>
                    <option value="video">Video</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Media file</label>
                  <input
                    type="file"
                    className="form-control"
                    accept={heroForm.type === "video" ? "video/mp4,video/quicktime" : "image/png,image/jpeg,image/webp"}
                    onChange={(e) => setHeroFile(e.target.files?.[0] || null)}
                    required
                  />
                  <small className="text-muted">
                    {heroForm.type === "video"
                      ? "MP4/MOV up to 120MB."
                      : "JPG, PNG, or WEBP up to 10MB."}
                  </small>
                </div>
                {heroFeedback && (
                  <div className={`alert alert-${heroFeedback.type} py-2`} role="alert">
                    {heroFeedback.message}
                  </div>
                )}
                <button className="btn btn-primary w-100" type="submit" disabled={uploading}>
                  {uploading ? "Uploading…" : "Upload to hero"}
                </button>
              </form>
            </div>
          </div>
        </div>
        <div className="col-lg-6">
          <div className="card portal-card h-100">
            <div className="card-body">
              <div className="portal-section-title mb-2">News &amp; announcements</div>
              <p className="text-muted">
                Draft quick bites that sync to the landing page feed and mobile push alerts.
              </p>
              <form onSubmit={handleNewsSubmit}>
                <div className="mb-3">
                  <label className="form-label">Headline</label>
                  <input
                    className="form-control"
                    value={newsForm.title}
                    onChange={(e) => setNewsForm({ ...newsForm, title: e.target.value })}
                    placeholder="New hematology equipment arrives"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Story</label>
                  <textarea
                    className="form-control"
                    rows="4"
                    value={newsForm.body}
                    onChange={(e) => setNewsForm({ ...newsForm, body: e.target.value })}
                    placeholder="Full description that appears on the landing feed."
                    required
                  ></textarea>
                </div>
                <div className="mb-3">
                  <label className="form-label">Cover image</label>
                  <input
                    type="file"
                    className="form-control"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(e) => setNewsCover(e.target.files?.[0] || null)}
                  />
                  <small className="text-muted">Optional but recommended for visual impact.</small>
                </div>
                {newsFeedback && (
                  <div className={`alert alert-${newsFeedback.type} py-2`} role="alert">
                    {newsFeedback.message}
                  </div>
                )}
                <div className="d-flex gap-2">
                  <button className="btn btn-outline-secondary flex-grow-1" type="button" disabled={newsLoading}>
                    Preview
                  </button>
                  <button className="btn btn-success flex-grow-1" type="submit" disabled={newsLoading}>
                    {newsLoading ? "Publishing…" : "Publish Draft"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
