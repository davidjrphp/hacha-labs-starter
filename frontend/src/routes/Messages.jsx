import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PortalLayout from "../components/PortalLayout.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function Messages() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [selected, setSelected] = useState("APT-2024-0092");

  const threads = useMemo(
    () => [
      { id: "APT-2024-0092", title: "Dr. Patel • Haematology", preview: "Please attach your lab results", unread: true },
      { id: "APT-2024-0090", title: "Support Desk", preview: "Reminder: bring national ID", unread: false },
      { id: "Referral • Dr. Lee", title: "Dr. Lee (Referral)", preview: "Shared referral letter for Ivan K.", unread: false },
    ],
    []
  );

  const [composer, setComposer] = useState("");

  const sendMessage = (e) => {
    e.preventDefault();
    if (!composer.trim()) return;
    alert(`Message sent to thread ${selected} (placeholder).`);
    setComposer("");
  };

  return (
    <PortalLayout
      title="Secure Messaging"
      subtitle="Chat with your assigned care team and referral partners."
      menuItems={[
        { key: "messages", icon: "bi-chat-dots", label: "Inbox" },
        { key: "attachments", icon: "bi-paperclip", label: "Attachments" },
      ]}
      onLogout={async () => {
        await logout();
        navigate("/login", { replace: true });
      }}
    >
      <div className="row g-4">
        <div className="col-lg-4">
          <div className="card portal-card h-100">
            <div className="card-body">
              <div className="portal-section-title mb-2">Threads</div>
              <p className="text-muted">Click to view the conversation.</p>
              <div className="list-group">
                {threads.map((thread) => (
                  <button
                    key={thread.id}
                    className={`list-group-item list-group-item-action ${selected === thread.id ? "active" : ""}`}
                    onClick={() => setSelected(thread.id)}
                  >
                    <div className="d-flex justify-content-between">
                      <div className="fw-semibold">{thread.title}</div>
                      {thread.unread && <span className="badge text-bg-warning">New</span>}
                    </div>
                    <small>{thread.preview}</small>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="col-lg-8">
          <div className="card portal-card h-100">
            <div className="card-body d-flex flex-column">
              <div className="portal-section-title mb-1">Conversation</div>
              <p className="text-muted">Thread: {selected}</p>
              <div className="flex-grow-1 border rounded-4 p-3 mb-3 bg-light-subtle">
                <div className="mb-3">
                  <div className="fw-semibold text-primary">You</div>
                  <div>Here are my updated lab results.</div>
                  <small className="text-muted">09:03</small>
                </div>
                <div className="mb-3">
                  <div className="fw-semibold text-success">Dr. Patel</div>
                  <div>Thank you. I will confirm once reviewed.</div>
                  <small className="text-muted">09:10</small>
                </div>
              </div>
              <form onSubmit={sendMessage}>
                <textarea
                  className="form-control mb-2"
                  rows="3"
                  placeholder="Type your message"
                  value={composer}
                  onChange={(e) => setComposer(e.target.value)}
                ></textarea>
                <div className="d-flex gap-2">
                  <label className="btn btn-outline-secondary flex-grow-1 mb-0">
                    <i className="bi bi-paperclip me-1"></i>
                    Add attachment
                    <input type="file" hidden />
                  </label>
                  <button className="btn btn-primary flex-grow-1" type="submit">
                    Send message
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
