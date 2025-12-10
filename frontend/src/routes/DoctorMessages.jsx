import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import PortalLayout from "../components/PortalLayout.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import http from "../api/http.js";

export default function DoctorMessages() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [contacts, setContacts] = useState([]);
  const [activePeer, setActivePeer] = useState(null);
  const [messages, setMessages] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const unreadCount = useMemo(() => contacts.reduce((sum, c) => sum + (c.unread || 0), 0), [contacts]);
  const [body, setBody] = useState("");
  const bottomRef = useRef(null);

  const menuItems = [
    { key: "schedule", icon: "bi-calendar-week", label: "Schedule" },
    { key: "patients", icon: "bi-person-vcard", label: "Patients" },
    { key: "messages", icon: "bi-chat-dots", label: "Messages", badge: unreadCount || null },
    { key: "reports", icon: "bi-bar-chart-line", label: "Reports" },
  ];

  const loadPatients = async () => {
    try {
      const { data } = await http.get("/doctor/patients");
      const rows = Array.isArray(data?.data) ? data.data : [];
      setPatients(rows);
      return rows;
    } catch {
      setPatients([]);
      return [];
    }
  };

  const loadContacts = async () => {
    try {
      const { data } = await http.get("/messages/contacts");
      const contactList = Array.isArray(data) ? data : [];
      // merge in patients so new chat can start even without prior messages
      const patientRows = patients.length ? patients : await loadPatients();
      const merged = new Map();
      contactList.forEach((c) => merged.set(String(c.user_id), { ...c }));
      patientRows.forEach((p) => {
        const key = String(p.patient_id);
        if (!merged.has(key)) {
          merged.set(key, {
            user_id: p.patient_id,
            name: p.full_name || "Patient",
            role_id: 0,
            last_message: "",
            last_at: null,
            unread: 0,
          });
        }
      });
      const mergedArr = Array.from(merged.values()).sort((a, b) => {
        if (a.last_at && b.last_at) return new Date(b.last_at) - new Date(a.last_at);
        if (a.last_at) return -1;
        if (b.last_at) return 1;
        return (a.name || "").localeCompare(b.name || "");
      });
      setContacts(mergedArr);
      return mergedArr;
    } catch (err) {
      setContacts([]);
      return [];
    }
  };

  const loadThread = async (peerId) => {
    if (!peerId) {
      setMessages([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data } = await http.get("/messages/thread", { params: { user_id: peerId } });
      setMessages(Array.isArray(data?.messages) ? data.messages : []);
    } catch (err) {
      setMessages([]);
      setError(err.response?.data?.message || "Unable to load messages.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancel = false;
    const init = async () => {
      await loadPatients();
      const resp = await loadContacts();
      const first = (resp && Array.isArray(resp) && resp[0]) || null;
      if (!cancel && first && !activePeer) {
        setActivePeer(first.user_id);
        await loadThread(first.user_id);
      }
    };
    init();
    const interval = setInterval(() => {
      loadContacts();
      if (activePeer) loadThread(activePeer);
    }, 10000);
    return () => {
      cancel = true;
      clearInterval(interval);
    };
  }, [activePeer]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (activePeer) {
      loadThread(activePeer);
    }
  }, [activePeer]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!activePeer || !body.trim()) return;
    setSending(true);
    try {
      const form = new FormData();
      form.append("to", activePeer);
      form.append("body", body.trim());
      const { data } = await http.post("/messages/send", form);
      const newMsg = data?.payload || {
        id: Date.now(),
        sender_id: "me",
        receiver_id: activePeer,
        body: body.trim(),
        created_at: new Date().toISOString(),
        is_read: 0,
      };
      setMessages((prev) => [...prev, newMsg]);
      setBody("");
      await loadContacts();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to send message.");
    } finally {
      setSending(false);
    }
  };

  const activeContact = useMemo(
    () => contacts.find((c) => String(c.user_id) === String(activePeer)),
    [contacts, activePeer]
  );

  return (
    <PortalLayout
      title="Messages"
      subtitle="Secure chat with patients and referral partners."
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
      <div className="row g-3">
        <div className="col-md-4">
          <div className="card portal-card h-100">
            <div className="card-header d-flex justify-content-between align-items-center">
              <span>Conversations</span>
              <button className="btn btn-sm btn-outline-secondary" onClick={loadContacts}>
                <i className="bi bi-arrow-repeat"></i>
              </button>
            </div>
            <div className="card-body border-bottom">
              <label className="form-label small mb-1">Start chat with patient</label>
              <select
                className="form-select form-select-sm"
                value={activePeer || ""}
                onChange={(e) => setActivePeer(e.target.value)}
              >
                <option value="">Select a patient</option>
                {patients.map((p) => (
                  <option key={p.patient_id} value={p.patient_id}>
                    {p.full_name || "Patient"} ({p.patient_id})
                  </option>
                ))}
              </select>
            </div>
            <div className="list-group list-group-flush" style={{ maxHeight: "65vh", overflowY: "auto" }}>
              {contacts.length === 0 && (
                <div className="list-group-item text-muted small">No conversations yet.</div>
              )}
              {contacts.map((c) => (
                <button
                  key={c.user_id}
                  className={`list-group-item list-group-item-action d-flex justify-content-between align-items-start ${
                    String(c.user_id) === String(activePeer) ? "active" : ""
                  }`}
                  onClick={() => setActivePeer(c.user_id)}
                >
                  <div>
                    <div className="fw-semibold">{c.name}</div>
                    <div className="small text-muted text-truncate" style={{ maxWidth: "200px" }}>
                      {c.last_message || "No messages"}
                    </div>
                  </div>
                  {c.unread > 0 && <span className="badge text-bg-primary">{c.unread}</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="col-md-8">
          <div className="card portal-card h-100 d-flex flex-column">
            <div className="card-header d-flex justify-content-between align-items-center">
              <div>
                <div className="fw-semibold">{activeContact?.name || "Select a conversation"}</div>
                {activeContact && (
                  <div className="text-muted small">
                    {activeContact.role_id === 2 ? "Specialist" : "Patient"}
                  </div>
                )}
              </div>
            </div>
            <div className="card-body flex-grow-1" style={{ overflowY: "auto", maxHeight: "55vh" }}>
              {loading ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status"></div>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-muted text-center py-4">No messages yet.</div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`d-flex ${msg.sender_id === activePeer ? "justify-content-start" : "justify-content-end"} mb-2`}
                  >
                    <div
                      className={`p-2 rounded-3 ${msg.sender_id === activePeer ? "bg-light" : "bg-primary text-white"}`}
                      style={{ maxWidth: "75%" }}
                    >
                      <div>{msg.body}</div>
                      <div className="text-muted small mt-1">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={bottomRef}></div>
            </div>
            <div className="card-footer">
              {error && <div className="alert alert-warning py-2 mb-2">{error}</div>}
              <form className="d-flex gap-2" onSubmit={handleSend}>
                <input
                  className="form-control"
                  placeholder={activePeer ? "Type a message..." : "Select a contact to start chatting"}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  disabled={!activePeer}
                />
                <button className="btn btn-primary" type="submit" disabled={!activePeer || sending || !body.trim()}>
                  {sending ? "Sending..." : "Send"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
