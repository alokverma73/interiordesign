import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { api, getErrorMessage } from "@/api/client";
import { ConfirmDialog, DataTable, Modal, adminInput, useToast } from "@/admin/ui";
import { Field } from "@/admin/AdminCore";
import { BlogPost, FAQItem, NotificationItem, Testimonial } from "@/types";

function slugify(t: string) {
  return t.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-");
}

/* ---------------- Customers ---------------- */
export function AdminCustomers() {
  const [rows, setRows] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const load = () => {
    setLoading(true);
    api
      .get("/admin/users/customers", { params: search ? { search } : {} })
      .then((r) => setRows(r.data.items))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const t = setTimeout(load, search ? 350 : 0);
    return () => clearTimeout(t);
  }, [search]);

  async function toggle(id: string, isActive: boolean) {
    try {
      await api.put(`/admin/users/customers/${id}/status`, null, { params: { is_active: !isActive } });
      toast(isActive ? "Customer disabled." : "Customer enabled.");
      load();
    } catch (e) {
      toast(getErrorMessage(e), "error");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <h1 className="font-display text-2xl">Customers</h1>
        <input
          className={`${adminInput} !w-64`}
          placeholder="Search name or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <DataTable
        loading={loading}
        rows={rows}
        columns={[
          { key: "full_name", label: "Name" },
          { key: "email", label: "Email" },
          { key: "phone", label: "Phone" },
          { key: "is_active", label: "Status", render: (r: any) => (r.is_active ? "Active" : "Disabled") },
          { key: "actions", label: "", render: (r: any) => (
            <button onClick={() => toggle(r.id, r.is_active)} className="text-xs text-clay-600">
              {r.is_active ? "Disable" : "Enable"}
            </button>
          )},
        ]}
        empty="No customers registered yet."
      />
    </div>
  );
}

/* ---------------- Appointments ---------------- */
export function AdminAppointments() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const load = () => {
    setLoading(true);
    api.get("/admin/appointments").then((r) => setRows(r.data)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  async function setStatus(id: string, status: string) {
    try {
      await api.put(`/admin/appointments/${id}`, { status });
      toast("Appointment updated.");
      load();
    } catch (e) {
      toast(getErrorMessage(e), "error");
    }
  }

  return (
    <div>
      <h1 className="font-display text-2xl mb-6">Appointments</h1>
      <DataTable
        loading={loading}
        rows={rows}
        columns={[
          { key: "name", label: "Name" },
          { key: "email", label: "Email" },
          { key: "appointment_date", label: "Date" },
          { key: "time_slot_start", label: "Time" },
          { key: "status", label: "Status", render: (r: any) => r.status.replace(/_/g, " ") },
          { key: "actions", label: "", render: (r: any) => (
            <select
              className="text-xs border border-charcoal-900/15 px-2 py-1"
              value={r.status}
              onChange={(e) => setStatus(r.id, e.target.value)}
            >
              {["REQUESTED", "CONFIRMED", "RESCHEDULED", "CANCELLED", "COMPLETED"].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          )},
        ]}
        empty="No appointments booked yet."
      />
    </div>
  );
}

/* ---------------- Testimonials ---------------- */
export function AdminTestimonials() {
  const [rows, setRows] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const load = () => {
    setLoading(true);
    api.get("/admin/testimonials").then((r) => setRows(r.data)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  async function update(id: string, patch: Record<string, boolean>) {
    try {
      await api.put(`/admin/testimonials/${id}`, patch);
      toast("Testimonial updated.");
      load();
    } catch (e) {
      toast(getErrorMessage(e), "error");
    }
  }

  return (
    <div>
      <h1 className="font-display text-2xl mb-6">Testimonials</h1>
      <DataTable
        loading={loading}
        rows={rows}
        columns={[
          { key: "client_name", label: "Client" },
          { key: "client_location", label: "Location" },
          { key: "rating", label: "Rating" },
          { key: "content", label: "Content", render: (r: Testimonial) => (
            <span className="block max-w-sm truncate">{r.content}</span>
          )},
          { key: "is_published", label: "Published", render: (r: Testimonial) => (r.is_published ? "Yes" : "No") },
          { key: "actions", label: "", render: (r: Testimonial) => (
            <div className="flex gap-3 text-xs">
              <button onClick={() => update(r.id, { is_published: !r.is_published, is_approved: true })} className="text-clay-600">
                {r.is_published ? "Unpublish" : "Publish"}
              </button>
              <button onClick={() => update(r.id, { is_featured: !r.is_featured })} className="text-charcoal-700">
                {r.is_featured ? "Unfeature" : "Feature"}
              </button>
            </div>
          )},
        ]}
        empty="No testimonials submitted yet."
      />
    </div>
  );
}

/* ---------------- Blog ---------------- */
const EMPTY_POST = { title: "", slug: "", excerpt: "", content: "", featured_image_url: "", is_published: false };

export function AdminBlog() {
  const [rows, setRows] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [form, setForm] = useState<any>(EMPTY_POST);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const toast = useToast();

  const load = () => {
    setLoading(true);
    api.get("/admin/blog").then((r) => setRows(r.data)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  async function save() {
    const payload = { ...form, slug: form.slug || slugify(form.title) };
    try {
      if (editing) await api.put(`/admin/blog/${editing.id}`, payload);
      else await api.post("/admin/blog", payload);
      toast(editing ? "Article updated." : "Article created.");
      setModalOpen(false);
      load();
    } catch (e) {
      toast(getErrorMessage(e), "error");
    }
  }

  async function remove() {
    if (!deleteId) return;
    try {
      await api.delete(`/admin/blog/${deleteId}`);
      toast("Article deleted.");
      setDeleteId(null);
      load();
    } catch (e) {
      toast(getErrorMessage(e), "error");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl">Design Journal</h1>
        <button onClick={() => { setEditing(null); setForm(EMPTY_POST); setModalOpen(true); }} className="btn-primary !py-2 !px-4 text-xs">
          <Plus size={14} /> New Article
        </button>
      </div>

      <DataTable
        loading={loading}
        rows={rows}
        columns={[
          { key: "title", label: "Title" },
          { key: "slug", label: "Slug" },
          { key: "is_published", label: "Status", render: (r: BlogPost) => (r.is_published ? "Published" : "Draft") },
          { key: "actions", label: "", render: (r: BlogPost) => (
            <div className="flex gap-3 text-xs">
              <button
                onClick={() => {
                  setEditing(r);
                  setForm({
                    title: r.title, slug: r.slug, excerpt: r.excerpt || "", content: r.content,
                    featured_image_url: r.featured_image_url || "", is_published: r.is_published,
                  });
                  setModalOpen(true);
                }}
                className="text-clay-600"
              >
                Edit
              </button>
              <button onClick={() => setDeleteId(r.id)} className="text-red-600">Delete</button>
            </div>
          )},
        ]}
        empty="No articles yet."
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Article" : "New Article"} width="max-w-2xl">
        <div className="space-y-5">
          <Field label="Title">
            <input
              className={adminInput}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value, slug: editing ? form.slug : slugify(e.target.value) })}
            />
          </Field>
          <Field label="Slug"><input className={adminInput} value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></Field>
          <Field label="Excerpt"><input className={adminInput} value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} /></Field>
          <Field label="Featured Image URL"><input className={adminInput} value={form.featured_image_url} onChange={(e) => setForm({ ...form, featured_image_url: e.target.value })} /></Field>
          <Field label="Content"><textarea rows={10} className={adminInput} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} /></Field>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_published} onChange={(e) => setForm({ ...form, is_published: e.target.checked })} />
            Published
          </label>
        </div>
        <div className="flex justify-end gap-3 mt-8">
          <button onClick={() => setModalOpen(false)} className="btn-secondary !py-2 !px-4 text-xs">Cancel</button>
          <button onClick={save} disabled={!form.title || !form.content} className="btn-primary !py-2 !px-4 text-xs disabled:opacity-40">
            Save
          </button>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteId} onCancel={() => setDeleteId(null)} onConfirm={remove}
        title="Delete article?" body="This permanently removes the article." />
    </div>
  );
}

/* ---------------- Gallery ---------------- */
export function AdminGallery() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [caption, setCaption] = useState("");
  const [category, setCategory] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const toast = useToast();

  const load = () => {
    setLoading(true);
    api.get("/admin/gallery").then((r) => setRows(r.data)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  async function upload(file: File) {
    const fd = new FormData();
    fd.append("file", file);
    try {
      await api.post("/admin/gallery", fd, {
        params: { caption, category },
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast("Image uploaded.");
      setCaption(""); setCategory("");
      load();
    } catch (e) {
      toast(getErrorMessage(e), "error");
    }
  }

  async function remove() {
    if (!deleteId) return;
    try {
      await api.delete(`/admin/gallery/${deleteId}`);
      toast("Image deleted.");
      setDeleteId(null);
      load();
    } catch (e) {
      toast(getErrorMessage(e), "error");
    }
  }

  return (
    <div>
      <h1 className="font-display text-2xl mb-6">Gallery</h1>

      <div className="bg-white border border-charcoal-900/10 p-5 mb-8 grid sm:grid-cols-3 gap-4 items-end">
        <Field label="Caption"><input className={adminInput} value={caption} onChange={(e) => setCaption(e.target.value)} /></Field>
        <Field label="Category"><input className={adminInput} value={category} onChange={(e) => setCategory(e.target.value)} /></Field>
        <label className="btn-primary !py-2 !px-4 text-xs cursor-pointer justify-center">
          <Plus size={14} /> Upload Image
          <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
        </label>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-40 bg-sand-100 animate-pulse" />)}
        </div>
      ) : rows.length === 0 ? (
        <div className="py-16 text-center text-sm text-charcoal-700/60 bg-sand-100/40">No images uploaded yet.</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {rows.map((img) => (
            <div key={img.id} className="relative group">
              <img src={img.image_url} alt={img.caption || ""} className="w-full h-40 object-cover" />
              <button
                onClick={() => setDeleteId(img.id)}
                className="absolute top-2 right-2 bg-charcoal-950/70 text-sand-50 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Delete image"
              >
                <Trash2 size={14} />
              </button>
              {img.caption && <p className="text-xs mt-2 text-charcoal-700/70">{img.caption}</p>}
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog open={!!deleteId} onCancel={() => setDeleteId(null)} onConfirm={remove}
        title="Delete image?" body="This removes the image from the gallery." />
    </div>
  );
}

/* ---------------- FAQs ---------------- */
export function AdminFAQs() {
  const [rows, setRows] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ question: "", answer: "", category: "", display_order: 0, is_published: true });
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const toast = useToast();

  const load = () => {
    setLoading(true);
    api.get("/faqs").then((r) => setRows(r.data)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  async function save() {
    try {
      await api.post("/admin/faqs", { ...form, display_order: Number(form.display_order) || 0 });
      toast("FAQ added.");
      setForm({ question: "", answer: "", category: "", display_order: 0, is_published: true });
      setModalOpen(false);
      load();
    } catch (e) {
      toast(getErrorMessage(e), "error");
    }
  }

  async function remove() {
    if (!deleteId) return;
    try {
      await api.delete(`/admin/faqs/${deleteId}`);
      toast("FAQ deleted.");
      setDeleteId(null);
      load();
    } catch (e) {
      toast(getErrorMessage(e), "error");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl">FAQs</h1>
        <button onClick={() => setModalOpen(true)} className="btn-primary !py-2 !px-4 text-xs"><Plus size={14} /> New FAQ</button>
      </div>

      <DataTable
        loading={loading}
        rows={rows}
        columns={[
          { key: "question", label: "Question" },
          { key: "category", label: "Category" },
          { key: "actions", label: "", render: (r: FAQItem) => (
            <button onClick={() => setDeleteId(r.id)} className="text-red-600 text-xs">Delete</button>
          )},
        ]}
        empty="No FAQs yet."
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New FAQ">
        <div className="space-y-5">
          <Field label="Question"><input className={adminInput} value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} /></Field>
          <Field label="Answer"><textarea rows={4} className={adminInput} value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} /></Field>
          <Field label="Category"><input className={adminInput} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></Field>
          <Field label="Display Order"><input type="number" className={adminInput} value={form.display_order} onChange={(e) => setForm({ ...form, display_order: Number(e.target.value) })} /></Field>
        </div>
        <div className="flex justify-end gap-3 mt-8">
          <button onClick={() => setModalOpen(false)} className="btn-secondary !py-2 !px-4 text-xs">Cancel</button>
          <button onClick={save} disabled={!form.question || !form.answer} className="btn-primary !py-2 !px-4 text-xs disabled:opacity-40">Save</button>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteId} onCancel={() => setDeleteId(null)} onConfirm={remove}
        title="Delete FAQ?" body="This removes the question from the public FAQ page." />
    </div>
  );
}

/* ---------------- Contact messages ---------------- */
export function AdminMessages() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);

  useEffect(() => {
    api.get("/admin/contact-messages").then((r) => setRows(r.data)).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="font-display text-2xl mb-6">Contact Messages</h1>
      <DataTable
        loading={loading}
        rows={rows}
        columns={[
          { key: "name", label: "Name" },
          { key: "email", label: "Email" },
          { key: "subject", label: "Subject" },
          { key: "created_at", label: "Received", render: (r: any) => new Date(r.created_at).toLocaleDateString() },
          { key: "actions", label: "", render: (r: any) => (
            <button onClick={() => setSelected(r)} className="text-clay-600 text-xs">Read</button>
          )},
        ]}
        empty="No messages received yet."
      />

      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.subject || "Message"}>
        <p className="text-sm text-charcoal-700/60 mb-1">{selected?.name} · {selected?.email}</p>
        {selected?.phone && <p className="text-sm text-charcoal-700/60 mb-4">{selected.phone}</p>}
        <p className="text-sm leading-relaxed whitespace-pre-line">{selected?.message}</p>
        {selected && (
          <a href={`mailto:${selected.email}`} className="btn-primary !py-2 !px-4 text-xs mt-6">Reply by Email</a>
        )}
      </Modal>
    </div>
  );
}

/* ---------------- Staff & roles ---------------- */
export function AdminUsers() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "", password: "", role: "DESIGNER" });
  const toast = useToast();

  const load = () => {
    setLoading(true);
    api.get("/admin/users/staff").then((r) => setRows(r.data)).catch(() => setRows([])).finally(() => setLoading(false));
  };
  useEffect(load, []);

  async function save() {
    try {
      await api.post("/admin/users/staff", form);
      toast("Staff member created.");
      setForm({ full_name: "", email: "", password: "", role: "DESIGNER" });
      setModalOpen(false);
      load();
    } catch (e) {
      toast(getErrorMessage(e), "error");
    }
  }

  async function toggle(id: string, isActive: boolean) {
    try {
      await api.put(`/admin/users/staff/${id}/status`, null, { params: { is_active: !isActive } });
      toast("Status updated.");
      load();
    } catch (e) {
      toast(getErrorMessage(e), "error");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl">Staff & Roles</h1>
        <button onClick={() => setModalOpen(true)} className="btn-primary !py-2 !px-4 text-xs"><Plus size={14} /> New Staff</button>
      </div>

      <DataTable
        loading={loading}
        rows={rows}
        columns={[
          { key: "full_name", label: "Name" },
          { key: "email", label: "Email" },
          { key: "role", label: "Role" },
          { key: "is_active", label: "Status", render: (r: any) => (r.is_active ? "Active" : "Disabled") },
          { key: "actions", label: "", render: (r: any) => (
            <button onClick={() => toggle(r.id, r.is_active)} className="text-xs text-clay-600">
              {r.is_active ? "Disable" : "Enable"}
            </button>
          )},
        ]}
        empty="No staff accounts found."
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Staff Member">
        <div className="space-y-5">
          <Field label="Full Name"><input className={adminInput} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></Field>
          <Field label="Email"><input type="email" className={adminInput} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          <Field label="Temporary Password"><input type="password" className={adminInput} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></Field>
          <Field label="Role">
            <select className={adminInput} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              {["SUPER_ADMIN", "ADMIN", "DESIGNER", "PROJECT_MANAGER", "CONTENT_MANAGER"].map((r) => (
                <option key={r} value={r}>{r.replace(/_/g, " ")}</option>
              ))}
            </select>
          </Field>
        </div>
        <div className="flex justify-end gap-3 mt-8">
          <button onClick={() => setModalOpen(false)} className="btn-secondary !py-2 !px-4 text-xs">Cancel</button>
          <button onClick={save} disabled={!form.email || form.password.length < 8} className="btn-primary !py-2 !px-4 text-xs disabled:opacity-40">
            Create
          </button>
        </div>
      </Modal>
    </div>
  );
}

/* ---------------- Website settings (CMS) ---------------- */
export function AdminSettings() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const toast = useToast();

  const load = () => {
    setLoading(true);
    api.get("/admin/settings").then((r) => setRows(r.data)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  async function save(key: string, group: string) {
    const raw = edits[key];
    if (raw === undefined) return;
    const value = /^-?\d+$/.test(raw) ? Number(raw) : raw;
    try {
      await api.put("/admin/settings", { key, value, group });
      toast("Setting saved.");
      setEdits((e) => { const n = { ...e }; delete n[key]; return n; });
      load();
    } catch (e) {
      toast(getErrorMessage(e), "error");
    }
  }

  const groups = Array.from(new Set(rows.map((r) => r.group || "general")));

  if (loading) return <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-14 bg-sand-100 animate-pulse" />)}</div>;

  return (
    <div>
      <h1 className="font-display text-2xl mb-2">Website Settings</h1>
      <p className="text-sm text-charcoal-700/60 mb-8">
        Everything here is live on the public website — hero copy, stats, company details and social links.
      </p>

      {groups.map((g) => (
        <div key={g} className="mb-10">
          <h2 className="text-xs uppercase tracking-widest2 text-clay-600 mb-4">{g}</h2>
          <div className="bg-white border border-charcoal-900/10 divide-y divide-charcoal-900/5">
            {rows.filter((r) => (r.group || "general") === g).map((r) => (
              <div key={r.key} className="p-4 grid sm:grid-cols-[220px_1fr_auto] gap-4 items-center">
                <p className="text-sm text-charcoal-700/70">{r.key}</p>
                <input
                  className={adminInput}
                  value={edits[r.key] ?? String(r.value ?? "")}
                  onChange={(e) => setEdits({ ...edits, [r.key]: e.target.value })}
                />
                <button
                  onClick={() => save(r.key, r.group)}
                  disabled={edits[r.key] === undefined}
                  className="btn-primary !py-1.5 !px-3 text-xs disabled:opacity-30"
                >
                  Save
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------------- Admin notifications ---------------- */
export function AdminNotifications() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const load = () => api.get("/notifications").then((r) => setItems(r.data));
  useEffect(() => { load(); }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl">Notifications</h1>
        {items.some((i) => !i.is_read) && (
          <button onClick={async () => { await api.post("/notifications/read-all"); load(); }} className="text-xs text-clay-600">
            Mark all as read
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="py-16 text-center text-sm text-charcoal-700/60 bg-sand-100/40">Nothing new.</div>
      ) : (
        <div className="bg-white border border-charcoal-900/10 divide-y divide-charcoal-900/5">
          {items.map((n) => (
            <div key={n.id} className={`p-4 ${n.is_read ? "opacity-60" : ""}`}>
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
