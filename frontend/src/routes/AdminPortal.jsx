import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PortalLayout from "../components/PortalLayout.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import http from "../api/http.js";

const COLORS = ["#0d6efd", "#20c997", "#ffc107", "#d63384", "#6f42c1", "#fd7e14"];
const MENU = [
  { key: "dashboard", icon: "bi-speedometer2", label: "Dashboard overview" },
  { key: "people", icon: "bi-people", label: "People" },
  {
    key: "content",
    icon: "bi-card-image",
    label: "Content Studio",
    children: [
      { key: "content-hero", icon: "bi-images", label: "Hero content" },
      { key: "content-news", icon: "bi-megaphone", label: "News feed" },
    ],
  },
  { key: "appointments", icon: "bi-calendar-event", label: "Appointments" },
  { key: "system", icon: "bi-gear", label: "System preferences" },
];
const STAFF_PER_PAGE = 6;

function PortalModal({ show, title, onClose, children }) {
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
}

export default function AdminPortal() {
  const [activePanel, setActivePanel] = useState("dashboard");
  const [uploading, setUploading] = useState(false);
  const [heroForm, setHeroForm] = useState({ title: "", type: "image" });
  const [heroFile, setHeroFile] = useState(null);
  const [heroFeedback, setHeroFeedback] = useState(null);
  const [newsForm, setNewsForm] = useState({ title: "", body: "" });
  const [newsCover, setNewsCover] = useState(null);
  const [newsPublishing, setNewsPublishing] = useState(false);
  const [newsFeedback, setNewsFeedback] = useState(null);
  const [heroAssets, setHeroAssets] = useState([]);
  const [heroLoading, setHeroLoading] = useState(false);
  const [heroViewMode, setHeroViewMode] = useState("table");
  const [heroAction, setHeroAction] = useState(null);
  const [heroBusyId, setHeroBusyId] = useState(null);
  const [newsItems, setNewsItems] = useState([]);
  const [newsTableLoading, setNewsTableLoading] = useState(false);
  const [newsAction, setNewsAction] = useState(null);
  const [newsBusyId, setNewsBusyId] = useState(null);
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [facilityList, setFacilityList] = useState([]);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoFeedback, setGeoFeedback] = useState(null);
  const [showProvinceModal, setShowProvinceModal] = useState(false);
  const [showDistrictModal, setShowDistrictModal] = useState(false);
  const [showFacilityModal, setShowFacilityModal] = useState(false);
  const [provinceForm, setProvinceForm] = useState({ name: "" });
  const [districtForm, setDistrictForm] = useState({ province_id: "", name: "" });
  const [facilityForm, setFacilityForm] = useState({
    province_id: "",
    district_id: "",
    name: "",
    hmis_code: "",
    mfl_code: "",
    city: "",
    address: "",
    phone: "",
  });
  const [provinceSubmitting, setProvinceSubmitting] = useState(false);
  const [districtSubmitting, setDistrictSubmitting] = useState(false);
  const [facilitySubmitting, setFacilitySubmitting] = useState(false);
  const [staffForm, setStaffForm] = useState({ name: "", role_title: "", bio: "", sort_order: 0, is_visible: true });
  const [staffPhoto, setStaffPhoto] = useState(null);
  const [staffSubmitting, setStaffSubmitting] = useState(false);
  const [staffFeedback, setStaffFeedback] = useState(null);
  const [statsData, setStatsData] = useState({
    total_appointments: 0,
    new_appointments: 0,
    approved_appointments: 0,
    rejected_appointments: 0,
    closed_appointments: 0,
    total_staff: 0,
  });
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState(null);
  const [staffRecords, setStaffRecords] = useState([]);
  const [staffPendingPhotos, setStaffPendingPhotos] = useState({});
  const [staffAction, setStaffAction] = useState(null);
  const [staffBusyId, setStaffBusyId] = useState(null);
  const [staffDeletingId, setStaffDeletingId] = useState(null);
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffPage, setStaffPage] = useState(1);
  const [staffMeta, setStaffMeta] = useState({ page: 1, per_page: STAFF_PER_PAGE, total: 0, total_pages: 1 });
  const { logout } = useAuth();
  const navigate = useNavigate();

  const statCards = useMemo(
    () => [
      { key: "total", label: "Total appointments", value: statsData.total_appointments, icon: "bi-grid-3x2-gap", color: COLORS[0] },
      { key: "new", label: "New appointments", value: statsData.new_appointments, icon: "bi-plus-circle", color: COLORS[5] },
      { key: "approved", label: "Approved appointments", value: statsData.approved_appointments, icon: "bi-patch-check", color: COLORS[1] },
      { key: "rejected", label: "Rejected appointments", value: statsData.rejected_appointments, icon: "bi-x-circle", color: COLORS[3] },
      { key: "closed", label: "Closed appointments", value: statsData.closed_appointments, icon: "bi-archive", color: COLORS[2] },
      { key: "staff", label: "Total staff", value: statsData.total_staff, icon: "bi-people", color: COLORS[4] },
    ],
    [statsData]
  );

  const facilityDistrictOptions = useMemo(() => {
    if (!facilityForm.province_id) {
      return districts;
    }
    return districts.filter((district) => String(district.province_id) === String(facilityForm.province_id));
  }, [districts, facilityForm.province_id]);

  const appointments = [
    { patient: "Lungu D.", type: "Referral", doctor: "Dr. Muwo", status: "Awaiting", slot: "Nov 28 • 09:00" },
    { patient: "Chanda T.", type: "New", doctor: "Dr. Lameck", status: "Approved", slot: "Nov 29 • 13:00" },
    { patient: "Brenda M.", type: "Returning", doctor: "Dr. Chabu", status: "Declined", slot: "Dec 02 • 10:00" },
  ];

  const normalizedMedia = (payload) =>
    Array.isArray(payload)
      ? payload.map((item) => ({
          ...item,
          is_hero: item.is_hero === 1 || item.is_hero === true,
        }))
      : [];

  const normalizedNews = (payload) =>
    Array.isArray(payload)
      ? payload.map((item) => ({
          ...item,
          is_published: item.is_published === 1 || item.is_published === true,
        }))
      : [];

  const normalizeStaff = (payload) =>
    Array.isArray(payload)
      ? payload.map((member) => ({
          ...member,
          is_visible: member.is_visible === 1 || member.is_visible === true,
          sort_order: Number.isFinite(member.sort_order) ? member.sort_order : 0,
        }))
      : [];


  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    setStatsError(null);
    try {
      const { data } = await http.get("/admin/stats");
      setStatsData((prev) => ({ ...prev, ...data }));
    } catch (error) {
      setStatsError(error.response?.data?.message || "Unable to load dashboard metrics.");
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const loadHeroAssets = useCallback(async () => {
    setHeroLoading(true);
    try {
      const { data } = await http.get("/admin/media");
      setHeroAssets(normalizedMedia(data));
    } catch (error) {
      setHeroAction({
        type: "danger",
        message: error.response?.data?.message || "Unable to load media library.",
      });
    } finally {
      setHeroLoading(false);
    }
  }, []);

  const loadNewsItems = useCallback(async () => {
    setNewsTableLoading(true);
    try {
      const { data } = await http.get("/admin/news");
      setNewsItems(normalizedNews(data));
    } catch (error) {
      setNewsAction({
        type: "danger",
        message: error.response?.data?.message || "Unable to load news entries.",
      });
    } finally {
      setNewsTableLoading(false);
    }
  }, []);

  const loadStaff = useCallback(
    async (page = 1) => {
      if (page < 1) page = 1;
      setStaffLoading(true);
      setStaffAction(null);
      try {
        const { data } = await http.get("/admin/staff", {
          params: { page, per_page: STAFF_PER_PAGE },
        });
        const normalized = normalizeStaff(data?.data ?? []);
        setStaffRecords(normalized);
        if (data?.meta) {
          setStaffMeta(data.meta);
          const totalPages = data.meta.total_pages || 1;
          if (page > totalPages && totalPages > 0) {
            setStaffPage(totalPages);
          }
        } else {
          const fallbackMeta = {
            page,
            per_page: STAFF_PER_PAGE,
            total: normalized.length,
            total_pages: Math.max(1, Math.ceil((normalized.length || 1) / STAFF_PER_PAGE)),
          };
          setStaffMeta(fallbackMeta);
        }
        setStaffPendingPhotos({});
      } catch (error) {
        setStaffAction({
          type: "danger",
          message: error.response?.data?.message || "Unable to load staff profiles.",
        });
      } finally {
        setStaffLoading(false);
      }
    },
    []
  );

  const loadGeoData = useCallback(async () => {
    setGeoLoading(true);
    setGeoFeedback(null);
    try {
      const [provRes, distRes, facRes] = await Promise.all([
        http.get("/provinces"),
        http.get("/districts"),
        http.get("/facilities"),
      ]);
      setProvinces(Array.isArray(provRes.data) ? provRes.data : []);
      setDistricts(Array.isArray(distRes.data) ? distRes.data : []);
      setFacilityList(Array.isArray(facRes.data) ? facRes.data : []);
    } catch (error) {
      setGeoFeedback({
        type: "danger",
        message: error.response?.data?.message || "Unable to load settings data.",
      });
    } finally {
      setGeoLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activePanel === "dashboard") {
      loadStats();
    }
  }, [activePanel, loadStats]);

  useEffect(() => {
    if (activePanel === "content-hero") {
      loadHeroAssets();
    } else if (activePanel === "content-news") {
      loadNewsItems();
    }
  }, [activePanel, loadHeroAssets, loadNewsItems]);

  useEffect(() => {
    if (activePanel === "people") {
      loadStaff(staffPage);
    }
  }, [activePanel, staffPage, loadStaff]);

  useEffect(() => {
    if (activePanel === "system") {
      loadGeoData();
    }
  }, [activePanel, loadGeoData]);

  const updateHeroDraft = (id, field, value) => {
    setHeroAssets((prev) => prev.map((asset) => (asset.id === id ? { ...asset, [field]: value } : asset)));
  };

  const updateNewsDraft = (id, field, value) => {
    setNewsItems((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const updateStaffDraft = (id, field, value) => {
    setStaffRecords((prev) => prev.map((member) => (member.id === id ? { ...member, [field]: value } : member)));
  };

  const handleStaffPhotoBuffer = (id, file) => {
    setStaffPendingPhotos((prev) => {
      const next = { ...prev };
      if (file) {
        next[id] = file;
      } else {
        delete next[id];
      }
      return next;
    });
  };

  const persistHeroUpdate = async (item) => {
    setHeroBusyId(item.id);
    setHeroAction({ type: "info", message: "Saving hero media changes…" });
    try {
      await http.post("/admin/media/update", {
        id: item.id,
        caption: item.caption ?? "",
        is_hero: item.is_hero ? 1 : 0,
      });
      setHeroAction({ type: "success", message: "Hero media updated." });
      await loadHeroAssets();
    } catch (error) {
      setHeroAction({
        type: "danger",
        message: error.response?.data?.message || "Unable to update hero media.",
      });
    } finally {
      setHeroBusyId(null);
    }
  };

  const handleHeroDelete = async (id) => {
    if (!window.confirm("Delete this media asset?")) return;
    setHeroBusyId(id);
    setHeroAction({ type: "info", message: "Removing media asset…" });
    try {
      await http.post("/admin/media/delete", { id });
      setHeroAction({ type: "success", message: "Media asset deleted." });
      await loadHeroAssets();
    } catch (error) {
      setHeroAction({
        type: "danger",
        message: error.response?.data?.message || "Unable to delete media.",
      });
    } finally {
      setHeroBusyId(null);
    }
  };

  const persistNewsUpdate = async (item) => {
    setNewsBusyId(item.id);
    setNewsAction({ type: "info", message: "Updating news entry…" });
    try {
      await http.post("/admin/news/update", {
        id: item.id,
        title: item.title ?? "",
        body: item.body ?? "",
        is_published: item.is_published ? 1 : 0,
      });
      setNewsAction({ type: "success", message: "News entry updated." });
      await loadNewsItems();
    } catch (error) {
      setNewsAction({
        type: "danger",
        message: error.response?.data?.message || "Unable to update news entry.",
      });
    } finally {
      setNewsBusyId(null);
    }
  };

  const handleNewsDelete = async (id) => {
    if (!window.confirm("Delete this news entry?")) return;
    setNewsBusyId(id);
    setNewsAction({ type: "info", message: "Removing news entry…" });
    try {
      await http.post("/admin/news/delete", { id });
      setNewsAction({ type: "success", message: "News entry deleted." });
      await loadNewsItems();
    } catch (error) {
      setNewsAction({
        type: "danger",
        message: error.response?.data?.message || "Unable to delete news entry.",
      });
    } finally {
      setNewsBusyId(null);
    }
  };

  const handleStaffSubmit = async (e) => {
    e.preventDefault();
    setStaffFeedback(null);
    if (!staffPhoto) {
      setStaffFeedback({ type: "danger", message: "Please select a profile photo." });
      return;
    }
    const formData = new FormData();
    formData.append("name", staffForm.name);
    formData.append("role_title", staffForm.role_title);
    formData.append("bio", staffForm.bio);
    formData.append("sort_order", staffForm.sort_order ?? 0);
    formData.append("is_visible", staffForm.is_visible ? "1" : "0");
    formData.append("photo", staffPhoto);
    setStaffSubmitting(true);
    try {
      await http.post("/admin/staff", formData, { headers: { "Content-Type": "multipart/form-data" } });
      setStaffFeedback({ type: "success", message: "Staff profile added to carousel." });
      setStaffForm({ name: "", role_title: "", bio: "", sort_order: 0, is_visible: true });
      setStaffPhoto(null);
      setStaffPage(1);
      if (activePanel === "people") {
        await loadStaff(1);
      }
    } catch (error) {
      setStaffFeedback({
        type: "danger",
        message: error.response?.data?.message || "Unable to add staff profile.",
      });
    } finally {
      setStaffSubmitting(false);
    }
  };

  const persistStaffUpdate = async (member) => {
    setStaffBusyId(member.id);
    setStaffAction({ type: "info", message: "Saving staff profile…" });
    const formData = new FormData();
    formData.append("id", member.id);
    formData.append("name", member.name ?? "");
    formData.append("role_title", member.role_title ?? "");
    formData.append("bio", member.bio ?? "");
    formData.append("sort_order", member.sort_order ?? 0);
    formData.append("is_visible", member.is_visible ? "1" : "0");
    if (staffPendingPhotos[member.id]) {
      formData.append("photo", staffPendingPhotos[member.id]);
    }
    try {
      await http.post("/admin/staff/update", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setStaffAction({ type: "success", message: "Staff profile updated." });
      setStaffPendingPhotos((prev) => {
        if (!prev[member.id]) return prev;
        const next = { ...prev };
        delete next[member.id];
        return next;
      });
      await loadStaff(staffPage);
    } catch (error) {
      setStaffAction({
        type: "danger",
        message: error.response?.data?.message || "Unable to update staff profile.",
      });
    } finally {
      setStaffBusyId(null);
    }
  };

  const handleStaffDelete = async (id) => {
    if (!window.confirm("Delete this staff profile?")) return;
    setStaffDeletingId(id);
    setStaffAction({ type: "info", message: "Removing staff profile…" });
    try {
      await http.post("/admin/staff/delete", { id });
      setStaffAction({ type: "success", message: "Staff profile deleted." });
      const nextPage = staffRecords.length === 1 && staffPage > 1 ? staffPage - 1 : staffPage;
      if (nextPage !== staffPage) {
        setStaffPage(nextPage);
      } else {
        await loadStaff(staffPage);
      }
    } catch (error) {
      setStaffAction({
        type: "danger",
        message: error.response?.data?.message || "Unable to delete staff profile.",
      });
    } finally {
      setStaffDeletingId(null);
    }
  };

  const handleStaffPageChange = (direction) => {
    const next = staffPage + direction;
    if (next < 1 || next > (staffMeta?.total_pages || 1)) return;
    setStaffPage(next);
  };

  const sendForm = (url, payload) => {
    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value);
      }
    });
    return http.post(url, formData, { headers: { "Content-Type": "multipart/form-data" } });
  };

  const submitProvince = async (e) => {
    e.preventDefault();
    if (!provinceForm.name.trim()) {
      setGeoFeedback({ type: "danger", message: "Province name is required." });
      return;
    }
    setProvinceSubmitting(true);
    try {
      await sendForm("/admin/provinces", { name: provinceForm.name.trim() });
      setGeoFeedback({ type: "success", message: "Province added." });
      setProvinceForm({ name: "" });
      setShowProvinceModal(false);
      await loadGeoData();
    } catch (error) {
      setGeoFeedback({
        type: "danger",
        message: error.response?.data?.message || "Unable to add province.",
      });
    } finally {
      setProvinceSubmitting(false);
    }
  };

  const submitDistrict = async (e) => {
    e.preventDefault();
    if (!districtForm.province_id || !districtForm.name.trim()) {
      setGeoFeedback({ type: "danger", message: "Select province and provide district name." });
      return;
    }
    setDistrictSubmitting(true);
    try {
      await sendForm("/admin/districts", {
        province_id: districtForm.province_id,
        name: districtForm.name.trim(),
      });
      setGeoFeedback({ type: "success", message: "District added." });
      setDistrictForm({ province_id: "", name: "" });
      setShowDistrictModal(false);
      await loadGeoData();
    } catch (error) {
      setGeoFeedback({
        type: "danger",
        message: error.response?.data?.message || "Unable to add district.",
      });
    } finally {
      setDistrictSubmitting(false);
    }
  };

  const submitFacility = async (e) => {
    e.preventDefault();
    if (!facilityForm.province_id || !facilityForm.district_id || !facilityForm.name.trim()) {
      setGeoFeedback({ type: "danger", message: "Fill all required facility fields." });
      return;
    }
    setFacilitySubmitting(true);
    try {
      await sendForm("/admin/facilities", {
        province_id: facilityForm.province_id,
        district_id: facilityForm.district_id,
        name: facilityForm.name.trim(),
        hmis_code: facilityForm.hmis_code.trim(),
        mfl_code: facilityForm.mfl_code.trim(),
        city: facilityForm.city.trim(),
        address: facilityForm.address.trim(),
        phone: facilityForm.phone.trim(),
      });
      setGeoFeedback({ type: "success", message: "Facility added." });
      setFacilityForm({
        province_id: "",
        district_id: "",
        name: "",
        hmis_code: "",
        mfl_code: "",
        city: "",
        address: "",
        phone: "",
      });
      setShowFacilityModal(false);
      await loadGeoData();
    } catch (error) {
      setGeoFeedback({
        type: "danger",
        message: error.response?.data?.message || "Unable to add facility.",
      });
    } finally {
      setFacilitySubmitting(false);
    }
  };

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
    setNewsPublishing(true);
    try {
      await http.post("/admin/news", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setNewsFeedback({ type: "success", message: "News published." });
      setNewsForm({ title: "", body: "" });
      setNewsCover(null);
    } catch (error) {
      setNewsFeedback({ type: "danger", message: error.response?.data?.message || "Unable to save news." });
    } finally {
      setNewsPublishing(false);
    }
  };

  const renderDashboard = () => (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <div>
          <div className="portal-section-title mb-1">Operations</div>
          <p className="text-muted mb-0">Appointment workflows.</p>
        </div>
        <button className="btn btn-outline-secondary btn-sm" onClick={loadStats} disabled={statsLoading}>
          <i className="bi bi-arrow-repeat me-1"></i>
          {statsLoading ? "Refreshing…" : "Refresh metrics"}
        </button>
      </div>

      {statsError && (
        <div className="alert alert-danger" role="alert">
          {statsError}
        </div>
      )}

      <div className="row g-3 g-lg-4 mb-4">
        {statCards.map((stat) => (
          <div className="col-12 col-sm-6 col-lg-4 col-xl-2" key={stat.key}>
            <div className="portal-stat-card" style={{ background: stat.color }}>
              <div>
                <div className="stat-label">{stat.label}</div>
                <div className="stat-value">
                  {typeof stat.value === "number" ? stat.value : "—"}
                </div>
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
              <div className="portal-section-title mb-2">Media curator</div>
              {/* <p className="text-muted">
                Refresh the landing hero carousel with new lab visuals or appointment promos.
              </p> */}
              <form onSubmit={handleHeroSubmit}>
                <div className="mb-3">
                  <label className="form-label">Caption</label>
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
              {/* <p className="text-muted">
                Draft quick bites that sync to the landing page feed and mobile push alerts.
              </p> */}
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
                    placeholder="Full description."
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
                  <small className="text-muted">Optional</small>
                </div>
                {newsFeedback && (
                  <div className={`alert alert-${newsFeedback.type} py-2`} role="alert">
                    {newsFeedback.message}
                  </div>
                )}
                <div className="d-flex gap-2">
                  <button className="btn btn-outline-secondary flex-grow-1" type="button" disabled={newsPublishing}>
                    Preview
                  </button>
                  <button className="btn btn-success flex-grow-1" type="submit" disabled={newsPublishing}>
                    {newsPublishing ? "Publishing…" : "Publish Draft"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  const renderPeopleSection = () => (
    <div className="row g-4">
      <div className="col-lg-4">
        <div className="card portal-card h-100">
          <div className="card-body">
            <div className="portal-section-title mb-2">Add staff member</div>
            {/* <p className="text-muted">
              Publish clinical specialists and support staff to the landing page carousel.
            </p> */}
            <form onSubmit={handleStaffSubmit}>
              <div className="mb-3">
                <label className="form-label">Full name</label>
                <input
                  className="form-control"
                  value={staffForm.name}
                  onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Role title</label>
                <input
                  className="form-control"
                  value={staffForm.role_title}
                  onChange={(e) => setStaffForm({ ...staffForm, role_title: e.target.value })}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Bio / highlight</label>
                <textarea
                  className="form-control"
                  rows="3"
                  value={staffForm.bio}
                  onChange={(e) => setStaffForm({ ...staffForm, bio: e.target.value })}
                ></textarea>
              </div>
              <div className="mb-3">
                <label className="form-label">Sort order</label>
                <input
                  type="number"
                  min="0"
                  className="form-control"
                  value={staffForm.sort_order}
                  onChange={(e) => setStaffForm({ ...staffForm, sort_order: Number(e.target.value) })}
                />
                <small className="text-muted">Lower numbers appear first.</small>
              </div>
              <div className="form-check form-switch mb-3">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="staff-visible"
                  checked={staffForm.is_visible}
                  onChange={(e) => setStaffForm({ ...staffForm, is_visible: e.target.checked })}
                />
                <label className="form-check-label" htmlFor="staff-visible">
                  Display on landing page
                </label>
              </div>
              <div className="mb-3">
                <label className="form-label">Profile photo</label>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="form-control"
                  onChange={(e) => setStaffPhoto(e.target.files?.[0] || null)}
                  required
                />
              </div>
              {staffFeedback && (
                <div className={`alert alert-${staffFeedback.type} py-2`} role="alert">
                  {staffFeedback.message}
                </div>
              )}
              <button className="btn btn-primary w-100" type="submit" disabled={staffSubmitting}>
                {staffSubmitting ? "Saving…" : "Add to roster"}
              </button>
            </form>
          </div>
        </div>
      </div>
      <div className="col-lg-8">
        <div className="card portal-card h-100">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <div className="portal-section-title mb-1">People directory</div>
                <small className="text-muted">Manage visibility and ordering of staff profiles.</small>
              </div>
              <div className="d-flex gap-2">
                <button
                  className="btn btn-outline-secondary btn-sm"
                  type="button"
                  onClick={() => loadStaff(staffPage)}
                  disabled={staffLoading}
                >
                  <i className="bi bi-arrow-repeat me-1"></i>Refresh
                </button>
              </div>
            </div>
            {staffAction && (
              <div className={`alert alert-${staffAction.type}`} role="alert">
                {staffAction.message}
              </div>
            )}
            {staffLoading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status"></div>
                <p className="mt-3 text-muted">Loading staff roster…</p>
              </div>
            ) : staffRecords.length === 0 ? (
              <div className="text-center py-5 text-muted">No staff profiles yet.</div>
            ) : (
              <>
                <div className="table-responsive">
                  <table className="table portal-table align-middle">
                    <thead>
                      <tr>
                        <th style={{ width: "130px" }}>Photo</th>
                        <th>Name &amp; role</th>
                        <th>Bio</th>
                        <th style={{ width: "110px" }}>Order</th>
                        <th style={{ width: "110px" }}>Visible</th>
                        <th style={{ width: "160px" }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {staffRecords.map((member) => (
                        <tr key={member.id}>
                          <td>
                            <img
                              src={member.photo_path}
                              alt={member.name}
                              className="img-fluid rounded mb-2"
                              style={{ maxHeight: "70px" }}
                            />
                            <input
                              type="file"
                              className="form-control form-control-sm"
                              accept="image/png,image/jpeg,image/webp"
                              onChange={(e) => handleStaffPhotoBuffer(member.id, e.target.files?.[0] || null)}
                            />
                          </td>
                          <td>
                            <input
                              className="form-control form-control-sm mb-2"
                              value={member.name ?? ""}
                              onChange={(e) => updateStaffDraft(member.id, "name", e.target.value)}
                            />
                            <input
                              className="form-control form-control-sm"
                              value={member.role_title ?? ""}
                              onChange={(e) => updateStaffDraft(member.id, "role_title", e.target.value)}
                            />
                          </td>
                          <td>
                            <textarea
                              className="form-control form-control-sm"
                              rows="2"
                              value={member.bio ?? ""}
                              onChange={(e) => updateStaffDraft(member.id, "bio", e.target.value)}
                            ></textarea>
                          </td>
                          <td>
                            <input
                              type="number"
                              className="form-control form-control-sm"
                              value={member.sort_order ?? 0}
                              onChange={(e) =>
                                updateStaffDraft(member.id, "sort_order", Number(e.target.value))
                              }
                            />
                          </td>
                          <td>
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                checked={!!member.is_visible}
                                onChange={(e) => updateStaffDraft(member.id, "is_visible", e.target.checked)}
                              />
                            </div>
                          </td>
                          <td>
                            <div className="btn-group btn-group-sm w-100">
                              <button
                                type="button"
                                className="btn btn-outline-primary"
                                onClick={() => persistStaffUpdate(member)}
                                disabled={staffBusyId === member.id}
                              >
                                <i className="bi bi-save me-1"></i>Save
                              </button>
                              <button
                                type="button"
                                className="btn btn-outline-danger"
                                onClick={() => handleStaffDelete(member.id)}
                                disabled={staffDeletingId === member.id}
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="d-flex justify-content-between align-items-center mt-3 flex-wrap gap-2">
                  <div className="small text-muted">
                    Page {staffMeta.page} of {staffMeta.total_pages} • {staffMeta.total} profiles
                  </div>
                  <div className="btn-group btn-group-sm">
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => handleStaffPageChange(-1)}
                      disabled={staffPage <= 1 || staffLoading}
                    >
                      <i className="bi bi-chevron-left"></i>
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => handleStaffPageChange(1)}
                      disabled={staffPage >= (staffMeta?.total_pages || 1) || staffLoading}
                    >
                      <i className="bi bi-chevron-right"></i>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderHeroSection = () => {
    const heroSummary = [
      { label: "Total assets", value: heroAssets.length, icon: "bi-collection-play", color: COLORS[0] },
      {
        label: "Slides in hero",
        value: heroAssets.filter((asset) => asset.is_hero).length,
        icon: "bi-easel2",
        color: COLORS[1],
      },
      {
        label: "Video clips",
        value: heroAssets.filter((asset) => asset.type === "video").length,
        icon: "bi-camera-reels",
        color: COLORS[2],
      },
    ];

    return (
      <>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <div className="portal-section-title mb-1">Hero media library</div>
            <p className="text-muted mb-0">Control all imagery and clips powering the public landing hero.</p>
          </div>
          <div className="d-flex gap-2">
            <div className="btn-group btn-group-sm">
              <button
                type="button"
                className={`btn btn-outline-primary ${heroViewMode === "table" ? "active" : ""}`}
                onClick={() => setHeroViewMode("table")}
              >
                <i className="bi bi-table me-1"></i>Table
              </button>
              <button
                type="button"
                className={`btn btn-outline-primary ${heroViewMode === "gallery" ? "active" : ""}`}
                onClick={() => setHeroViewMode("gallery")}
              >
                <i className="bi bi-grid-3x3-gap me-1"></i>Gallery
              </button>
            </div>
            <button className="btn btn-outline-secondary btn-sm" onClick={loadHeroAssets} disabled={heroLoading}>
              <i className="bi bi-arrow-repeat me-1"></i>Refresh
            </button>
          </div>
        </div>

        <div className="row g-3 mb-4">
          {heroSummary.map((card) => (
            <div className="col-md-4" key={card.label}>
              <div className="portal-stat-card" style={{ background: card.color }}>
                <div>
                  <div className="stat-label">{card.label}</div>
                  <div className="stat-value">{card.value}</div>
                </div>
                <div className="stat-icon">
                  <i className={`bi ${card.icon}`}></i>
                </div>
              </div>
            </div>
          ))}
        </div>

        {heroAction && (
          <div className={`alert alert-${heroAction.type}`} role="alert">
            {heroAction.message}
          </div>
        )}

        <div className="card portal-card">
          <div className="card-body">
            {heroLoading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status"></div>
                <p className="mt-3 text-muted">Loading media…</p>
              </div>
            ) : heroAssets.length === 0 ? (
              <div className="text-center py-5 text-muted">No media uploaded yet.</div>
            ) : heroViewMode === "table" ? (
              <div className="table-responsive">
                <table className="table portal-table align-middle">
                  <thead>
                    <tr>
                      <th style={{ width: "100px" }}>Preview</th>
                      <th>Caption</th>
                      <th>Type</th>
                      <th>In hero</th>
                      <th>Created</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {heroAssets.map((item) => (
                      <tr key={item.id}>
                        <td>
                          {item.type === "video" ? (
                            <video src={item.path} width="90" height="60" className="rounded object-fit-cover" muted />
                          ) : (
                            <img
                              src={item.path}
                              alt={item.caption}
                              width="90"
                              height="60"
                              className="rounded object-fit-cover"
                            />
                          )}
                        </td>
                        <td>
                          <input
                            className="form-control form-control-sm"
                            value={item.caption ?? ""}
                            onChange={(e) => updateHeroDraft(item.id, "caption", e.target.value)}
                          />
                        </td>
                        <td>
                          <span className="badge text-bg-light text-uppercase">{item.type}</span>
                        </td>
                        <td>
                          <select
                            className="form-select form-select-sm"
                            value={item.is_hero ? "1" : "0"}
                            onChange={(e) => updateHeroDraft(item.id, "is_hero", e.target.value === "1")}
                          >
                            <option value="1">Show in hero</option>
                            <option value="0">Library only</option>
                          </select>
                        </td>
                        <td>{item.created_at ? new Date(item.created_at).toLocaleString() : "—"}</td>
                        <td>
                          <div className="btn-group btn-group-sm">
                            <button
                              type="button"
                              className="btn btn-outline-primary"
                              onClick={() => persistHeroUpdate(item)}
                              disabled={heroBusyId === item.id}
                            >
                              <i className="bi bi-save me-1"></i>Save
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline-danger"
                              onClick={() => handleHeroDelete(item.id)}
                              disabled={heroBusyId === item.id}
                            >
                              <i className="bi bi-trash me-1"></i>Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="row g-3">
                {heroAssets.map((item) => (
                  <div className="col-md-4" key={item.id}>
                    <div className="card h-100 shadow-sm">
                      {item.type === "video" ? (
                        <video src={item.path} className="card-img-top" controls />
                      ) : (
                        <img src={item.path} className="card-img-top" alt={item.caption} />
                      )}
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <span className="badge text-bg-light text-uppercase">{item.type}</span>
                          {item.is_hero && <span className="badge text-bg-primary">Hero slide</span>}
                        </div>
                        <input
                          className="form-control form-control-sm mb-2"
                          value={item.caption ?? ""}
                          onChange={(e) => updateHeroDraft(item.id, "caption", e.target.value)}
                        />
                        <div className="d-flex gap-2">
                          <button
                            className="btn btn-outline-primary btn-sm flex-grow-1"
                            onClick={() => persistHeroUpdate(item)}
                            disabled={heroBusyId === item.id}
                          >
                            Save
                          </button>
                          <button
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => handleHeroDelete(item.id)}
                            disabled={heroBusyId === item.id}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </>
    );
  };

  const renderNewsSection = () => (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <div className="portal-section-title mb-1">News feed library</div>
          <p className="text-muted mb-0">Manage all content surfaced on the landing feed and “view more” list.</p>
        </div>
        <button className="btn btn-outline-secondary btn-sm" onClick={loadNewsItems} disabled={newsTableLoading}>
          <i className="bi bi-arrow-repeat me-1"></i>Refresh
        </button>
      </div>

      {newsAction && (
        <div className={`alert alert-${newsAction.type}`} role="alert">
          {newsAction.message}
        </div>
      )}

      <div className="card portal-card">
        <div className="card-body">
          {newsTableLoading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status"></div>
              <p className="mt-3 text-muted">Loading news entries…</p>
            </div>
          ) : newsItems.length === 0 ? (
            <div className="text-center py-5 text-muted">No news entries published yet.</div>
          ) : (
            <div className="table-responsive">
              <table className="table portal-table align-middle">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Body</th>
                    <th>Cover</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {newsItems.map((item) => (
                    <tr key={item.id}>
                      <td style={{ minWidth: "220px" }}>
                        <input
                          className="form-control form-control-sm"
                          value={item.title ?? ""}
                          onChange={(e) => updateNewsDraft(item.id, "title", e.target.value)}
                        />
                      </td>
                      <td style={{ minWidth: "260px" }}>
                        <textarea
                          className="form-control form-control-sm"
                          rows="2"
                          value={item.body ?? ""}
                          onChange={(e) => updateNewsDraft(item.id, "body", e.target.value)}
                        ></textarea>
                      </td>
                      <td style={{ width: "120px" }}>
                        {item.cover_path ? (
                          <img src={item.cover_path} alt={item.title} className="img-fluid rounded" />
                        ) : (
                          <span className="text-muted small">None</span>
                        )}
                      </td>
                      <td style={{ width: "140px" }}>
                        <select
                          className="form-select form-select-sm"
                          value={item.is_published ? "1" : "0"}
                          onChange={(e) => updateNewsDraft(item.id, "is_published", e.target.value === "1")}
                        >
                          <option value="1">Published</option>
                          <option value="0">Draft</option>
                        </select>
                      </td>
                      <td style={{ width: "160px" }}>{item.created_at ? new Date(item.created_at).toLocaleString() : "—"}</td>
                      <td style={{ width: "150px" }}>
                        <div className="btn-group btn-group-sm">
                          <button
                            type="button"
                            className="btn btn-outline-primary"
                            onClick={() => persistNewsUpdate(item)}
                            disabled={newsBusyId === item.id}
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-danger"
                            onClick={() => handleNewsDelete(item.id)}
                            disabled={newsBusyId === item.id}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );

  const renderSystemSection = () => (
    <>
      <div className="card portal-card mb-4">
        <div className="card-body">
          <div className="portal-section-title mb-1">System preferences</div>
          <p className="text-muted mb-3">
            Configure regions and healthcare facilities used across patient and referral workflows.
          </p>
          {geoFeedback && (
            <div className={`alert alert-${geoFeedback.type}`} role="alert">
              {geoFeedback.message}
            </div>
          )}
          <div className="d-flex flex-wrap gap-3">
            <button className="btn btn-outline-primary" onClick={() => setShowProvinceModal(true)}>
              <i className="bi bi-geo me-2"></i>Add province
            </button>
            <button className="btn btn-outline-primary" onClick={() => setShowDistrictModal(true)}>
              <i className="bi bi-signpost-2 me-2"></i>Add district
            </button>
            <button className="btn btn-outline-primary" onClick={() => setShowFacilityModal(true)}>
              <i className="bi bi-hospital me-2"></i>Add facility
            </button>
          </div>
        </div>
      </div>

      <div className="card portal-card">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <div className="portal-section-title mb-1">Facility directory</div>
              <small className="text-muted">Reference table powering referral dropdowns.</small>
            </div>
            <button className="btn btn-outline-secondary btn-sm" onClick={loadGeoData} disabled={geoLoading}>
              <i className="bi bi-arrow-repeat me-1"></i>Refresh
            </button>
          </div>
          <div className="table-responsive">
            <table className="table portal-table align-middle">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Province</th>
                  <th>District</th>
                  <th>HMIS</th>
                  <th>MFL</th>
                </tr>
              </thead>
              <tbody>
                {geoLoading ? (
                  <tr>
                    <td colSpan="5" className="text-center">
                      <div className="spinner-border text-primary" role="status"></div>
                    </td>
                  </tr>
                ) : facilityList.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center text-muted">
                      No facilities captured yet.
                    </td>
                  </tr>
                ) : (
                  facilityList.map((facility) => (
                    <tr key={facility.id}>
                      <td>
                        <div className="fw-semibold">{facility.name}</div>
                        <div className="text-muted small">{facility.city || facility.address || "—"}</div>
                      </td>
                      <td>{facility.province_name || "—"}</td>
                      <td>{facility.district_name || "—"}</td>
                      <td>{facility.hmis_code || <span className="text-muted">—</span>}</td>
                      <td>{facility.mfl_code || <span className="text-muted">—</span>}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <PortalModal show={showProvinceModal} title="Add Province" onClose={() => setShowProvinceModal(false)}>
        <form onSubmit={submitProvince}>
          <div className="mb-3">
            <label className="form-label">Province name</label>
            <input
              className="form-control"
              value={provinceForm.name}
              onChange={(e) => setProvinceForm({ name: e.target.value })}
              required
            />
          </div>
          <div className="d-flex justify-content-end gap-2">
            <button type="button" className="btn btn-outline-secondary" onClick={() => setShowProvinceModal(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" type="submit" disabled={provinceSubmitting}>
              {provinceSubmitting ? "Saving…" : "Save province"}
            </button>
          </div>
        </form>
      </PortalModal>

      <PortalModal show={showDistrictModal} title="Add District" onClose={() => setShowDistrictModal(false)}>
        <form onSubmit={submitDistrict}>
          <div className="mb-3">
            <label className="form-label">Province</label>
            <select
              className="form-select"
              value={districtForm.province_id}
              onChange={(e) => setDistrictForm({ ...districtForm, province_id: e.target.value })}
              required
            >
              <option value="">Select province</option>
              {provinces.map((prov) => (
                <option key={prov.id} value={prov.id}>
                  {prov.name}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-3">
            <label className="form-label">District name</label>
            <input
              className="form-control"
              value={districtForm.name}
              onChange={(e) => setDistrictForm({ ...districtForm, name: e.target.value })}
              required
            />
          </div>
          <div className="d-flex justify-content-end gap-2">
            <button type="button" className="btn btn-outline-secondary" onClick={() => setShowDistrictModal(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" type="submit" disabled={districtSubmitting}>
              {districtSubmitting ? "Saving…" : "Save district"}
            </button>
          </div>
        </form>
      </PortalModal>

      <PortalModal show={showFacilityModal} title="Add Facility" onClose={() => setShowFacilityModal(false)}>
        <form onSubmit={submitFacility} className="row g-3">
          <div className="col-md-6">
            <label className="form-label">Province</label>
            <select
              className="form-select"
              value={facilityForm.province_id}
              onChange={(e) => setFacilityForm({ ...facilityForm, province_id: e.target.value, district_id: "" })}
              required
            >
              <option value="">Select province</option>
              {provinces.map((prov) => (
                <option key={prov.id} value={prov.id}>
                  {prov.name}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-6">
            <label className="form-label">District</label>
            <select
              className="form-select"
              value={facilityForm.district_id}
              onChange={(e) => setFacilityForm({ ...facilityForm, district_id: e.target.value })}
              required
              disabled={!facilityForm.province_id}
            >
              <option value="">Select district</option>
              {facilityDistrictOptions.map((district) => (
                <option key={district.id} value={district.id}>
                  {district.name}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-6">
            <label className="form-label">Facility name</label>
            <input
              className="form-control"
              value={facilityForm.name}
              onChange={(e) => setFacilityForm({ ...facilityForm, name: e.target.value })}
              required
            />
          </div>
          <div className="col-md-3">
            <label className="form-label">HMIS code</label>
            <input
              className="form-control"
              value={facilityForm.hmis_code}
              onChange={(e) => setFacilityForm({ ...facilityForm, hmis_code: e.target.value })}
            />
          </div>
          <div className="col-md-3">
            <label className="form-label">MFL code</label>
            <input
              className="form-control"
              value={facilityForm.mfl_code}
              onChange={(e) => setFacilityForm({ ...facilityForm, mfl_code: e.target.value })}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label">City / Town</label>
            <input
              className="form-control"
              value={facilityForm.city}
              onChange={(e) => setFacilityForm({ ...facilityForm, city: e.target.value })}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label">Phone</label>
            <input
              className="form-control"
              value={facilityForm.phone}
              onChange={(e) => setFacilityForm({ ...facilityForm, phone: e.target.value })}
            />
          </div>
          <div className="col-12">
            <label className="form-label">Address</label>
            <textarea
              rows="2"
              className="form-control"
              value={facilityForm.address}
              onChange={(e) => setFacilityForm({ ...facilityForm, address: e.target.value })}
            ></textarea>
          </div>
          <div className="col-12 d-flex justify-content-end gap-2">
            <button type="button" className="btn btn-outline-secondary" onClick={() => setShowFacilityModal(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" type="submit" disabled={facilitySubmitting}>
              {facilitySubmitting ? "Saving…" : "Save facility"}
            </button>
          </div>
        </form>
      </PortalModal>
    </>
  );

  const renderPlaceholder = (message) => (
    <div className="card portal-card">
      <div className="card-body text-center py-5 text-muted">{message}</div>
    </div>
  );

  const renderActivePanel = () => {
    if (activePanel === "people") return renderPeopleSection();
    if (activePanel === "content-hero") return renderHeroSection();
    if (activePanel === "content-news") return renderNewsSection();
    if (activePanel === "appointments") return renderPlaceholder("Appointments module");
    if (activePanel === "system") return renderSystemSection();
    return renderDashboard();
  };

  return (
    <PortalLayout
      title="Administrator Portal"
      subtitle="Monitor and manage all the administrative operations"
      menuItems={MENU}
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
