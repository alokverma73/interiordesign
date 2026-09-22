import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Pencil } from "lucide-react";
import { api, getErrorMessage } from "@/api/client";
import { ConfirmDialog, DataTable, Modal, adminInput, useToast } from "@/admin/ui";
import { Enquiry, Project, Service } from "@/types";

const ENQUIRY_STATUSES = [
  "NEW", "CONTACTED", "CONSULTATION", "QUOTATION", "NEGOTIATION",
  "APPROVED", "IN_PROGRESS", "COMPLETED", "CANCELLED",
];

const PROJECT_CATEGORIES = [
  "RESIDENTIAL", "APARTMENT", "VILLA", "KITCHEN", "BEDROOM",
  "LIVING_ROOM", "OFFICE", "COMMERCIAL", "RETAIL", "EXTERIOR",
];

const PROJECT_STATUSES = [
  "CONSULTATION", "PLANNING", "CONCEPT", "DESIGN", "VISUALIZATION", "APPROVAL",
  "PROCUREMENT", "EXECUTION", "INSTALLATION", "HANDOVER", "COMPLETED", "ON_HOLD",
];

function slugify(text: string) {
  return text.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-");
}

/* ---------------- Dashboard ---------------- */
export function AdminDashboard() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    api.get("/admin/dashboard/summary").then((r) => setData(r.data)).catch(() => null);
  }, []);

  if (!data) {
    return (
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-24 bg-sand-100 animate-pulse" />)}
      </div>
    );
  }

  const cards = [
    ["Total Enquiries", data.total_enquiries],
    ["New Enquiries", data.new_enquiries],
    ["Active Projects", data.active_projects],
    ["Completed Projects", data.completed_projects],
    ["Upcoming Appointments", data.upcoming_appointments],
    ["Customers", data.total_customers],
    ["Accepted Quotations", `₹${((data.accepted_quotation_total || 0) / 100).toLocaleString("en-IN")}`],
  ];

  return (
    <div>
      <h1 className="font-display text-2xl mb-8">Dashboard</h1>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        {cards.map(([label, value], i) => (
          <motion.div
            key={label as string}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white border border-charcoal-900/10 p-5"
          >
            <p className="text-[11px] uppercase tracking-widest2 text-charcoal-700/50 mb-2">{label}</p>
            <p className="font-display text-3xl">{value}</p>
          </motion.div>
        ))}
      </div>

      <h2 className="font-display text-lg mb-4">Recent Activity</h2>
      <DataTable
        columns={[
          { key: "title", label: "Enquiry" },
          { key: "status", label: "Status" },
          { key: "created_at", label: "Date", render: (r: any) => new Date(r.created_at).toLocaleDateString() },
        ]}
        rows={data.recent_activity || []}
        empty="No recent activity."
      />
    </div>
  );
}

/* ---------------- Enquiries ---------------- */
export function AdminEnquiries() {
  const [rows, setRows] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState<Enquiry | null>(null);
  const [status, setStatus] = useState("");
  const [note, setNote] = useState("");
  const toast = useToast();

  const load = () => {
    setLoading(true);
    api
      .get("/admin/enquiries", { params: filter ? { status_filter: filter } : {} })
      .then((r) => setRows(r.data.items))
      .catch((e) => toast(getErrorMessage(e), "error"))
      .finally(() => setLoading(false));
  };

  useEffect(load, [filter]);

  async function save() {
    if (!selected) return;
    try {
      await api.put(`/admin/enquiries/${selected.id}`, {
        status: status || undefined,
        note: note || undefined,
      });
      toast("Enquiry updated.");
      setSelected(null);
      setNote("");
      load();
    } catch (e) {
      toast(getErrorMessage(e), "error");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <h1 className="font-display text-2xl">Enquiries</h1>
        <select className={`${adminInput} !w-48`} value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All statuses</option>
          {ENQUIRY_STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
        </select>
      </div>

      <DataTable
        loading={loading}
        rows={rows}
        columns={[
          { key: "enquiry_number", label: "Reference" },
          { key: "name", label: "Name" },
          { key: "email", label: "Email" },
          { key: "phone", label: "Phone" },
          { key: "status", label: "Status", render: (r: Enquiry) => (
            <span className="text-xs px-2 py-1 bg-sand-100">{r.status.replace(/_/g, " ")}</span>
          )},
          { key: "created_at", label: "Received", render: (r: Enquiry) => new Date(r.created_at).toLocaleDateString() },
          { key: "actions", label: "", render: (r: Enquiry) => (
            <button
              onClick={() => { setSelected(r); setStatus(r.status); }}
              className="text-clay-600 text-xs"
            >
              Manage
            </button>
          )},
        ]}
        empty="No enquiries yet."
      />

      <Modal open={!!selected} onClose={() => setSelected(null)} title={`Enquiry ${selected?.enquiry_number || ""}`}>
        <div className="space-y-5">
          <div>
            <label className="text-xs uppercase tracking-widest2 text-charcoal-700/60 block mb-2">Status</label>
            <select className={adminInput} value={status} onChange={(e) => setStatus(e.target.value)}>
              {ENQUIRY_STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest2 text-charcoal-700/60 block mb-2">Add Internal Note</label>
            <textarea rows={3} className={adminInput} value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setSelected(null)} className="btn-secondary !py-2 !px-4 text-xs">Cancel</button>
            <button onClick={save} className="btn-primary !py-2 !px-4 text-xs">Save</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/* ---------------- Projects ---------------- */
const EMPTY_PROJECT = {
  name: "", slug: "", category: "RESIDENTIAL", location: "", client_type: "",
  area_sqft: "", description: "", design_concept: "", cover_image_url: "",
  is_featured: false, is_published: false, status: "CONSULTATION",
};

export function AdminProjects() {
  const [rows, setRows] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [form, setForm] = useState<any>(EMPTY_PROJECT);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const toast = useToast();

  const load = () => {
    setLoading(true);
    api.get("/admin/projects").then((r) => setRows(r.data.items)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_PROJECT);
    setModalOpen(true);
  }

  function openEdit(p: Project) {
    setEditing(p);
    setForm({
      name: p.name, slug: p.slug, category: p.category, location: p.location || "",
      client_type: p.client_type || "", area_sqft: p.area_sqft || "", description: p.description || "",
      design_concept: p.design_concept || "", cover_image_url: p.cover_image_url || "",
      is_featured: p.is_featured, is_published: p.is_published, status: p.status,
    });
    setModalOpen(true);
  }

  async function save() {
    const payload = {
      ...form,
      slug: form.slug || slugify(form.name),
      area_sqft: form.area_sqft ? Number(form.area_sqft) : null,
      location: form.location || null,
      client_type: form.client_type || null,
      description: form.description || null,
      design_concept: form.design_concept || null,
      cover_image_url: form.cover_image_url || null,
    };
    try {
      if (editing) {
        await api.put(`/admin/projects/${editing.id}`, payload);
        toast("Project updated.");
      } else {
        await api.post("/admin/projects", payload);
        toast("Project created.");
      }
      setModalOpen(false);
      load();
    } catch (e) {
      toast(getErrorMessage(e), "error");
    }
  }

  async function remove() {
    if (!deleteId) return;
    try {
      await api.delete(`/admin/projects/${deleteId}`);
      toast("Project deleted.");
      setDeleteId(null);
      load();
    } catch (e) {
      toast(getErrorMessage(e), "error");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl">Projects</h1>
        <button onClick={openCreate} className="btn-primary !py-2 !px-4 text-xs">
          <Plus size={14} /> New Project
        </button>
      </div>

      <DataTable
        loading={loading}
        rows={rows}
        columns={[
          { key: "name", label: "Name" },
          { key: "category", label: "Category", render: (r: Project) => r.category.replace(/_/g, " ") },
          { key: "location", label: "Location" },
          { key: "status", label: "Status", render: (r: Project) => r.status.replace(/_/g, " ") },
          { key: "is_published", label: "Published", render: (r: Project) => (r.is_published ? "Yes" : "Draft") },
          { key: "actions", label: "", render: (r: Project) => (
            <div className="flex gap-3">
              <button onClick={() => openEdit(r)} className="text-clay-600" aria-label="Edit"><Pencil size={15} /></button>
              <button onClick={() => setDeleteId(r.id)} className="text-red-600" aria-label="Delete"><Trash2 size={15} /></button>
            </div>
          )},
        ]}
        empty="No projects yet. Create your first one."
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Project" : "New Project"} width="max-w-2xl">
        <div className="grid sm:grid-cols-2 gap-5">
          <Field label="Project Name">
            <input
              className={adminInput}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value, slug: editing ? form.slug : slugify(e.target.value) })}
            />
          </Field>
          <Field label="Slug"><input className={adminInput} value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></Field>
          <Field label="Category">
            <select className={adminInput} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {PROJECT_CATEGORIES.map((c) => <option key={c} value={c}>{c.replace(/_/g, " ")}</option>)}
            </select>
          </Field>
          <Field label="Status">
            <select className={adminInput} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {PROJECT_STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
            </select>
          </Field>
          <Field label="Location"><input className={adminInput} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></Field>
          <Field label="Client Type"><input className={adminInput} value={form.client_type} onChange={(e) => setForm({ ...form, client_type: e.target.value })} /></Field>
          <Field label="Area (sq ft)"><input type="number" className={adminInput} value={form.area_sqft} onChange={(e) => setForm({ ...form, area_sqft: e.target.value })} /></Field>
          <Field label="Cover Image URL"><input className={adminInput} value={form.cover_image_url} onChange={(e) => setForm({ ...form, cover_image_url: e.target.value })} /></Field>
          <div className="sm:col-span-2">
            <Field label="Description"><textarea rows={3} className={adminInput} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Design Concept"><textarea rows={3} className={adminInput} value={form.design_concept} onChange={(e) => setForm({ ...form, design_concept: e.target.value })} /></Field>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_published} onChange={(e) => setForm({ ...form, is_published: e.target.checked })} />
            Published
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} />
            Featured on homepage
          </label>
        </div>
        <div className="flex justify-end gap-3 mt-8">
          <button onClick={() => setModalOpen(false)} className="btn-secondary !py-2 !px-4 text-xs">Cancel</button>
          <button onClick={save} disabled={!form.name} className="btn-primary !py-2 !px-4 text-xs disabled:opacity-40">
            {editing ? "Save Changes" : "Create Project"}
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onCancel={() => setDeleteId(null)}
        onConfirm={remove}
        title="Delete project?"
        body="This will remove the project from the public site. This action can only be reversed from the database."
      />
    </div>
  );
}

/* ---------------- Services ---------------- */
const EMPTY_SERVICE = {
  name: "", slug: "", short_description: "", description: "",
  cover_image_url: "", display_order: 0, is_active: true,
};

export function AdminServices() {
  const [rows, setRows] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [form, setForm] = useState<any>(EMPTY_SERVICE);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const toast = useToast();

  const load = () => {
    setLoading(true);
    api.get("/admin/services").then((r) => setRows(r.data)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  async function save() {
    const payload = {
      ...form,
      slug: form.slug || slugify(form.name),
      display_order: Number(form.display_order) || 0,
      gallery: [], features: [], process_steps: [], faqs: [],
    };
    try {
      if (editing) {
        await api.put(`/admin/services/${editing.id}`, payload);
        toast("Service updated.");
      } else {
        await api.post("/admin/services", payload);
        toast("Service created.");
      }
      setModalOpen(false);
      load();
    } catch (e) {
      toast(getErrorMessage(e), "error");
    }
  }

  async function remove() {
    if (!deleteId) return;
    try {
      await api.delete(`/admin/services/${deleteId}`);
      toast("Service deleted.");
      setDeleteId(null);
      load();
    } catch (e) {
      toast(getErrorMessage(e), "error");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl">Services</h1>
        <button
          onClick={() => { setEditing(null); setForm(EMPTY_SERVICE); setModalOpen(true); }}
          className="btn-primary !py-2 !px-4 text-xs"
        >
          <Plus size={14} /> New Service
        </button>
      </div>

      <DataTable
        loading={loading}
        rows={rows}
        columns={[
          { key: "display_order", label: "Order" },
          { key: "name", label: "Name" },
          { key: "slug", label: "Slug" },
          { key: "is_active", label: "Status", render: (r: Service) => (r.is_active ? "Active" : "Hidden") },
          { key: "actions", label: "", render: (r: Service) => (
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setEditing(r);
                  setForm({
                    name: r.name, slug: r.slug, short_description: r.short_description || "",
                    description: r.description || "", cover_image_url: r.cover_image_url || "",
                    display_order: (r as any).display_order ?? 0, is_active: r.is_active,
                  });
                  setModalOpen(true);
                }}
                className="text-clay-600"
                aria-label="Edit"
              >
                <Pencil size={15} />
              </button>
              <button onClick={() => setDeleteId(r.id)} className="text-red-600" aria-label="Delete"><Trash2 size={15} /></button>
            </div>
          )},
        ]}
        empty="No services yet."
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Service" : "New Service"} width="max-w-2xl">
        <div className="space-y-5">
          <Field label="Name">
            <input
              className={adminInput}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value, slug: editing ? form.slug : slugify(e.target.value) })}
            />
          </Field>
          <Field label="Slug"><input className={adminInput} value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></Field>
          <Field label="Short Description"><input className={adminInput} value={form.short_description} onChange={(e) => setForm({ ...form, short_description: e.target.value })} /></Field>
          <Field label="Full Description"><textarea rows={4} className={adminInput} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
          <Field label="Cover Image URL"><input className={adminInput} value={form.cover_image_url} onChange={(e) => setForm({ ...form, cover_image_url: e.target.value })} /></Field>
          <Field label="Display Order"><input type="number" className={adminInput} value={form.display_order} onChange={(e) => setForm({ ...form, display_order: e.target.value })} /></Field>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
            Active on website
          </label>
        </div>
        <div className="flex justify-end gap-3 mt-8">
          <button onClick={() => setModalOpen(false)} className="btn-secondary !py-2 !px-4 text-xs">Cancel</button>
          <button onClick={save} disabled={!form.name} className="btn-primary !py-2 !px-4 text-xs disabled:opacity-40">
            {editing ? "Save Changes" : "Create Service"}
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onCancel={() => setDeleteId(null)}
        onConfirm={remove}
        title="Delete service?"
        body="This will hide the service from the public website."
      />
    </div>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs uppercase tracking-widest2 text-charcoal-700/60 block mb-2">{label}</label>
      {children}
    </div>
  );
}
