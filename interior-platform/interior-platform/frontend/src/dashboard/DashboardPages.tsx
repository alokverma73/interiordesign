import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, Download, Send, Upload } from "lucide-react";
import { api, getErrorMessage } from "@/api/client";
import { useAuthStore } from "@/contexts/authStore";
import { Enquiry, NotificationItem, Project, ProjectPortal } from "@/types";

/* ---------------- Overview ---------------- */
export function DashboardHome() {
  const user = useAuthStore((s) => s.user);
  const [projects, setProjects] = useState<Project[]>([]);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/dashboard/projects").then((r) => setProjects(r.data)).catch(() => null),
      api.get("/dashboard/enquiries").then((r) => setEnquiries(r.data)).catch(() => null),
    ]).finally(() => setLoading(false));
  }, []);

  if (loading) return <SkeletonCards />;

  return (
    <div>
      <h1 className="font-display text-3xl mb-2">Welcome back, {user?.full_name?.split(" ")[0]}</h1>
      <p className="text-sm text-charcoal-700/70 mb-10">Here's where your projects stand.</p>

      <div className="grid sm:grid-cols-3 gap-6 mb-12">
        {[
          ["Active Projects", projects.filter((p) => p.status !== "COMPLETED").length],
          ["Total Enquiries", enquiries.length],
          ["Completed", projects.filter((p) => p.status === "COMPLETED").length],
        ].map(([label, value], i) => (
          <motion.div
            key={label as string}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="bg-sand-100/60 p-6"
          >
            <p className="font-display text-4xl">{value}</p>
            <p className="text-xs uppercase tracking-widest2 text-charcoal-700/50 mt-2">{label}</p>
          </motion.div>
        ))}
      </div>

      <h2 className="font-display text-xl mb-5">Your Projects</h2>
      {projects.length === 0 ? (
        <EmptyState
          title="No projects yet"
          body="Once your enquiry is converted into a project, it will appear here with a full timeline."
          action={<Link to="/quote" className="btn-primary">Start an Enquiry</Link>}
        />
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {projects.map((p) => (
            <Link key={p.id} to={`/dashboard/projects/${p.id}`} className="block bg-sand-100/60 p-6 hover:bg-sand-100 transition-colors">
              <p className="text-[10px] uppercase tracking-widest2 text-clay-600 mb-2">{p.status.replace(/_/g, " ")}</p>
              <h3 className="font-display text-xl mb-1">{p.name}</h3>
              <p className="text-sm text-charcoal-700/70">{p.location}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------- My Projects ---------------- */
export function MyProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/dashboard/projects").then((r) => setProjects(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <SkeletonCards />;

  return (
    <div>
      <h1 className="font-display text-3xl mb-8">My Projects</h1>
      {projects.length === 0 ? (
        <EmptyState title="No projects yet" body="Your active projects will appear here." />
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {projects.map((p) => (
            <Link key={p.id} to={`/dashboard/projects/${p.id}`} className="block bg-sand-100/60 p-6 hover:bg-sand-100 transition-colors">
              <p className="text-[10px] uppercase tracking-widest2 text-clay-600 mb-2">{p.status.replace(/_/g, " ")}</p>
              <h3 className="font-display text-xl mb-1">{p.name}</h3>
              <p className="text-sm text-charcoal-700/70">{p.location}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------- Project Portal ---------------- */
export function ProjectPortalPage() {
  const { projectId } = useParams();
  const user = useAuthStore((s) => s.user);
  const [project, setProject] = useState<ProjectPortal | null>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [proposals, setProposals] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [tab, setTab] = useState<"timeline" | "designs" | "documents" | "messages">("timeline");
  const [error, setError] = useState("");

  const load = () => {
    api.get(`/dashboard/projects/${projectId}`).then((r) => setProject(r.data)).catch((e) => setError(getErrorMessage(e)));
    api.get(`/dashboard/projects/${projectId}/documents`).then((r) => setDocuments(r.data)).catch(() => null);
    api.get(`/dashboard/projects/${projectId}/proposals`).then((r) => setProposals(r.data)).catch(() => null);
    api.get(`/dashboard/projects/${projectId}/messages`).then((r) => setMessages(r.data)).catch(() => null);
  };

  useEffect(load, [projectId]);

  async function decide(proposalId: string, decision: "APPROVED" | "CHANGES_REQUESTED") {
    const comment = decision === "CHANGES_REQUESTED" ? window.prompt("What would you like changed?") || "" : "";
    try {
      await api.post(`/dashboard/projects/${projectId}/proposals/${proposalId}/decision`, { decision, comment });
      load();
    } catch (e) {
      setError(getErrorMessage(e));
    }
  }

  async function sendMessage() {
    if (!newMessage.trim()) return;
    try {
      await api.post(`/dashboard/projects/${projectId}/messages`, { body: newMessage, attachments: [] });
      setNewMessage("");
      load();
    } catch (e) {
      setError(getErrorMessage(e));
    }
  }

  async function uploadDocument(file: File) {
    const fd = new FormData();
    fd.append("file", file);
    try {
      await api.post(`/dashboard/projects/${projectId}/documents?category=OTHER`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      load();
    } catch (e) {
      setError(getErrorMessage(e));
    }
  }

  async function download(docId: string, name: string) {
    const res = await api.get(`/dashboard/documents/${docId}/download`, { responseType: "blob" });
    const url = URL.createObjectURL(res.data);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (error && !project) return <p className="text-sm text-red-600">{error}</p>;
  if (!project) return <SkeletonCards />;

  return (
    <div>
      <Link to="/dashboard/projects" className="text-xs text-clay-600 mb-4 inline-block">← My Projects</Link>
      <h1 className="font-display text-3xl mb-1">{project.name}</h1>
      <p className="text-sm text-charcoal-700/70 mb-8">{project.location}</p>

      <div className="grid sm:grid-cols-4 gap-4 mb-10">
        {[
          ["Status", project.status.replace(/_/g, " ")],
          ["Start", project.start_date || "—"],
          ["Expected Completion", project.expected_completion_date || "—"],
          ["Area", project.area_sqft ? `${project.area_sqft} sq ft` : "—"],
        ].map(([k, v]) => (
          <div key={k} className="bg-sand-100/60 p-4">
            <p className="text-[10px] uppercase tracking-widest2 text-charcoal-700/50">{k}</p>
            <p className="text-sm mt-1">{v}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-1 border-b border-charcoal-900/10 mb-8 overflow-x-auto">
        {(["timeline", "designs", "documents", "messages"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-3 text-sm capitalize whitespace-nowrap border-b-2 transition-colors ${
              tab === t ? "border-clay-500 text-charcoal-900" : "border-transparent text-charcoal-700/60"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      {tab === "timeline" && (
        <div className="space-y-0">
          {project.milestones?.length === 0 && <EmptyState title="No milestones yet" body="Your project timeline will appear here." />}
          {project.milestones?.map((m, i) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex gap-5 pb-8 relative"
            >
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  m.is_completed ? "bg-clay-500 text-sand-50" : "border-2 border-charcoal-900/15"
                }`}>
                  {m.is_completed ? <Check size={15} /> : <span className="text-xs">{i + 1}</span>}
                </div>
                {i < project.milestones.length - 1 && <div className="w-px flex-1 bg-charcoal-900/10 mt-1" />}
              </div>
              <div className="pb-2">
                <p className={`font-medium ${m.is_completed ? "" : "text-charcoal-700/60"}`}>{m.title}</p>
                {m.completed_at && <p className="text-xs text-charcoal-700/50 mt-1">Completed {m.completed_at}</p>}
                {m.description && <p className="text-sm text-charcoal-700/70 mt-1">{m.description}</p>}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {tab === "designs" && (
        <div className="space-y-5">
          {proposals.length === 0 ? (
            <EmptyState title="No design proposals yet" body="Your designer will share proposals here for review." />
          ) : (
            proposals.map((p) => (
              <div key={p.id} className="bg-sand-100/60 p-6">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest2 text-charcoal-700/50">Version {p.version}</p>
                    <h3 className="font-display text-lg mt-1">{p.title}</h3>
                    <p className="text-xs mt-2">
                      <span className={`px-2 py-1 ${
                        p.status === "APPROVED" ? "bg-green-100 text-green-800"
                        : p.status === "CHANGES_REQUESTED" ? "bg-amber-100 text-amber-800"
                        : "bg-charcoal-900/10"
                      }`}>
                        {p.status.replace(/_/g, " ")}
                      </span>
                    </p>
                  </div>
                  {p.status === "PENDING_REVIEW" && (
                    <div className="flex gap-2">
                      <button onClick={() => decide(p.id, "APPROVED")} className="btn-primary !py-2 !px-4 text-xs">Approve</button>
                      <button onClick={() => decide(p.id, "CHANGES_REQUESTED")} className="btn-secondary !py-2 !px-4 text-xs">Request Changes</button>
                    </div>
                  )}
                </div>
                {p.files?.length > 0 && (
                  <p className="text-xs text-charcoal-700/60 mt-4">{p.files.length} file(s) attached</p>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {tab === "documents" && (
        <div>
          <label className="btn-secondary cursor-pointer mb-6 inline-flex">
            <Upload size={15} /> Upload Document
            <input
              type="file"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && uploadDocument(e.target.files[0])}
            />
          </label>

          {documents.length === 0 ? (
            <EmptyState title="No documents yet" body="Floor plans, renders and contracts will appear here." />
          ) : (
            <div className="divide-y divide-charcoal-900/10 border-t border-charcoal-900/10">
              {documents.map((d) => (
                <div key={d.id} className="flex items-center justify-between py-4 gap-4">
                  <div className="min-w-0">
                    <p className="text-sm truncate">{d.file_name}</p>
                    <p className="text-xs text-charcoal-700/50">
                      {d.category.replace(/_/g, " ")} · {(d.file_size_bytes / 1024).toFixed(0)} KB
                    </p>
                  </div>
                  <button onClick={() => download(d.id, d.file_name)} className="text-clay-600 shrink-0" aria-label="Download">
                    <Download size={17} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "messages" && (
        <div>
          <div className="space-y-4 mb-6 max-h-[440px] overflow-y-auto">
            {messages.length === 0 && <EmptyState title="No messages yet" body="Start a conversation with your project team." />}
            {messages.map((m) => {
              const mine = m.sender_id === user?.id;
              return (
                <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] p-4 text-sm ${mine ? "bg-charcoal-900 text-sand-50" : "bg-sand-100"}`}>
                    {m.body}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex gap-3">
            <input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Write a message..."
              className="flex-1 bg-sand-100/60 px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-clay-500"
            />
            <button onClick={sendMessage} className="btn-primary !px-5" aria-label="Send">
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- Enquiries ---------------- */
export function MyEnquiries() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/dashboard/enquiries").then((r) => setEnquiries(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <SkeletonCards />;

  return (
    <div>
      <h1 className="font-display text-3xl mb-8">My Enquiries</h1>
      {enquiries.length === 0 ? (
        <EmptyState
          title="No enquiries yet"
          body="Submit a quote request and track its progress here."
          action={<Link to="/quote" className="btn-primary">Request a Quote</Link>}
        />
      ) : (
        <div className="divide-y divide-charcoal-900/10 border-t border-charcoal-900/10">
          {enquiries.map((e) => (
            <div key={e.id} className="py-5 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="font-display text-lg">{e.enquiry_number}</p>
                <p className="text-xs text-charcoal-700/60">{new Date(e.created_at).toLocaleDateString()}</p>
              </div>
              <span className="text-xs px-3 py-1.5 bg-sand-100">{e.status.replace(/_/g, " ")}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------- Appointments ---------------- */
export function MyAppointments() {
  const [form, setForm] = useState({ appointment_date: "", time_slot_start: "10:00", notes: "" });
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const user = useAuthStore((s) => s.user);

  async function book() {
    setError("");
    try {
      const [h, m] = form.time_slot_start.split(":").map(Number);
      await api.post("/appointments", {
        name: user?.full_name, email: user?.email, phone: "",
        appointment_date: form.appointment_date,
        time_slot_start: form.time_slot_start,
        time_slot_end: `${String(h + 1).padStart(2, "0")}:${String(m).padStart(2, "0")}`,
        notes: form.notes || null,
      });
      setDone(true);
    } catch (e) {
      setError(getErrorMessage(e));
    }
  }

  return (
    <div className="max-w-lg">
      <h1 className="font-display text-3xl mb-8">Book a Consultation</h1>
      {done ? (
        <div className="bg-sand-100/60 p-8">
          <Check className="text-clay-600 mb-4" size={26} />
          <p className="font-display text-xl mb-2">Consultation requested</p>
          <p className="text-sm text-charcoal-700/70">We'll confirm your slot by email shortly.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div>
            <label className="text-xs uppercase tracking-widest2 text-charcoal-700/60">Date</label>
            <input
              type="date"
              className="w-full bg-transparent border-b border-charcoal-900/20 py-3 outline-none focus:border-clay-500"
              value={form.appointment_date}
              onChange={(e) => setForm({ ...form, appointment_date: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest2 text-charcoal-700/60">Time Slot</label>
            <select
              className="w-full bg-transparent border-b border-charcoal-900/20 py-3 outline-none focus:border-clay-500"
              value={form.time_slot_start}
              onChange={(e) => setForm({ ...form, time_slot_start: e.target.value })}
            >
              {["10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00"].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest2 text-charcoal-700/60">Notes</label>
            <textarea
              rows={3}
              className="w-full bg-transparent border-b border-charcoal-900/20 py-3 outline-none focus:border-clay-500"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button onClick={book} disabled={!form.appointment_date} className="btn-primary disabled:opacity-40">
            Request Consultation
          </button>
        </div>
      )}
    </div>
  );
}

/* ---------------- Notifications ---------------- */
export function Notifications() {
  const [items, setItems] = useState<NotificationItem[]>([]);

  const load = () => api.get("/notifications").then((r) => setItems(r.data));
  useEffect(() => { load(); }, []);

  async function markAll() {
    await api.post("/notifications/read-all");
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl">Notifications</h1>
        {items.some((i) => !i.is_read) && (
          <button onClick={markAll} className="text-xs text-clay-600">Mark all as read</button>
        )}
      </div>

      {items.length === 0 ? (
        <EmptyState title="Nothing new" body="Project updates and messages will show up here." />
      ) : (
        <div className="divide-y divide-charcoal-900/10 border-t border-charcoal-900/10">
          {items.map((n) => (
            <div key={n.id} className={`py-5 ${n.is_read ? "opacity-60" : ""}`}>
              <div className="flex items-start gap-3">
                {!n.is_read && <span className="w-2 h-2 rounded-full bg-clay-500 mt-2 shrink-0" />}
                <div>
                  <p className="text-sm font-medium">{n.title}</p>
                  {n.body && <p className="text-sm text-charcoal-700/70 mt-1">{n.body}</p>}
                  <p className="text-xs text-charcoal-700/40 mt-2">{new Date(n.created_at).toLocaleString()}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------- Profile ---------------- */
export function Profile() {
  const { user, setUser } = useAuthStore();
  const [form, setForm] = useState({ full_name: "", phone: "", city: "", address: "" });
  const [pw, setPw] = useState({ current_password: "", new_password: "" });
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) setForm((f) => ({ ...f, full_name: user.full_name, phone: (user as any).phone || "" }));
  }, [user]);

  async function save() {
    setMsg(""); setError("");
    try {
      const { data } = await api.put("/auth/me", form);
      setUser(data);
      setMsg("Profile updated.");
    } catch (e) {
      setError(getErrorMessage(e));
    }
  }

  async function changePassword() {
    setMsg(""); setError("");
    try {
      await api.post("/auth/change-password", pw);
      setPw({ current_password: "", new_password: "" });
      setMsg("Password updated.");
    } catch (e) {
      setError(getErrorMessage(e));
    }
  }

  const inputClass = "w-full bg-transparent border-b border-charcoal-900/20 py-3 outline-none focus:border-clay-500";

  return (
    <div className="max-w-lg">
      <h1 className="font-display text-3xl mb-8">Profile Settings</h1>

      {msg && <p className="text-sm text-green-700 mb-4">{msg}</p>}
      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      <div className="space-y-6 mb-14">
        {(["full_name", "phone", "city", "address"] as const).map((field) => (
          <div key={field}>
            <label className="text-xs uppercase tracking-widest2 text-charcoal-700/60">
              {field.replace("_", " ")}
            </label>
            <input
              className={inputClass}
              value={(form as any)[field]}
              onChange={(e) => setForm({ ...form, [field]: e.target.value })}
            />
          </div>
        ))}
        <button onClick={save} className="btn-primary">Save Changes</button>
      </div>

      <h2 className="font-display text-xl mb-6">Change Password</h2>
      <div className="space-y-6">
        <div>
          <label className="text-xs uppercase tracking-widest2 text-charcoal-700/60">Current Password</label>
          <input type="password" className={inputClass} value={pw.current_password} onChange={(e) => setPw({ ...pw, current_password: e.target.value })} />
        </div>
        <div>
          <label className="text-xs uppercase tracking-widest2 text-charcoal-700/60">New Password</label>
          <input type="password" className={inputClass} value={pw.new_password} onChange={(e) => setPw({ ...pw, new_password: e.target.value })} />
        </div>
        <button onClick={changePassword} className="btn-secondary">Update Password</button>
      </div>
    </div>
  );
}

/* ---------------- Shared bits ---------------- */
function EmptyState({ title, body, action }: { title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="bg-sand-100/40 py-16 px-8 text-center">
      <p className="font-display text-xl mb-2">{title}</p>
      <p className="text-sm text-charcoal-700/60 mb-6 max-w-sm mx-auto">{body}</p>
      {action}
    </div>
  );
}

function SkeletonCards() {
  return (
    <div className="grid sm:grid-cols-3 gap-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-28 bg-sand-100 animate-pulse" />
      ))}
    </div>
  );
}
