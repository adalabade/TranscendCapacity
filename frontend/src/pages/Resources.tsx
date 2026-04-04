import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, X, Check, Loader2, User, Search } from 'lucide-react';
import api from '../lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Resource {
  ResourceID: number;
  ResourceName: string;
  JIRAUserID: string;
  ProcessTeamID: number | null;
  RoleID: number | null;
  CompanyID: number | null;
  CountryID: string | null;
}

interface LookupItem { id: number | string; label: string; }

interface Lookups {
  roles: LookupItem[];
  companies: LookupItem[];
  processTeams: LookupItem[];
  countries: LookupItem[];
}

const EMPTY_FORM: Partial<Resource> = {
  ResourceName: '',
  JIRAUserID: '',
  ProcessTeamID: null,
  RoleID: null,
  CompanyID: null,
  CountryID: null,
};

// ─── Select Component ─────────────────────────────────────────────────────────
function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder = 'Select...',
}: {
  label: string;
  value: number | string | null;
  onChange: (v: number | string | null) => void;
  options: LookupItem[];
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">{label}</label>
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value === '' ? null : e.target.value)}
        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all appearance-none cursor-pointer text-gray-700"
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

// ─── Avatar Initials ──────────────────────────────────────────────────────────
function Avatar({ name }: { name: string }) {
  const initials = name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  const colors = [
    'bg-red-100 text-red-600',
    'bg-blue-100 text-blue-600',
    'bg-green-100 text-green-600',
    'bg-purple-100 text-purple-600',
    'bg-orange-100 text-orange-600',
    'bg-pink-100 text-pink-600',
  ];
  const color = colors[name.charCodeAt(0) % colors.length];
  return (
    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0 ${color}`}>
      {initials || <User size={14} />}
    </div>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────
function Badge({ text }: { text: string | undefined }) {
  if (!text) return <span className="text-gray-300 text-xs">—</span>;
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600 text-xs font-bold">
      {text}
    </span>
  );
}

// ─── Resources Page ───────────────────────────────────────────────────────────
export default function Resources() {
  const [resources, setResources]     = useState<Resource[]>([]);
  const [lookups, setLookups]         = useState<Lookups>({ roles: [], companies: [], processTeams: [], countries: [] });
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [showModal, setShowModal]     = useState(false);
  const [editing, setEditing]         = useState<Resource | null>(null);
  const [form, setForm]               = useState<Partial<Resource>>(EMPTY_FORM);
  const [saving, setSaving]           = useState(false);
  const [deleting, setDeleting]       = useState<number | null>(null);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const findLabel = (list: LookupItem[], id: number | string | null) =>
    id == null ? undefined : list.find((x) => String(x.id) === String(id))?.label;

  // ── Load data ──────────────────────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [res, roles, companies, teams, countries] = await Promise.all([
        api.get('resources'),
        api.get('roles'),
        api.get('companies'),
        api.get('process-teams'),
        api.get('countries'),
      ]);

      setResources(res.data);
      setLookups({
        roles:        roles.data.map((r: any)  => ({ id: r.RoleID,          label: r.RoleDescription })),
        companies:    companies.data.map((c: any) => ({ id: c.CompanyID,       label: c.CompanyDescription })),
        processTeams: teams.data.map((t: any)  => ({ id: t.ProcessTeamID,    label: t.ProcessTeamDescription })),
        countries:    countries.data.map((c: any) => ({ id: c.CountryID,       label: `${c.CountryID} — ${c.CountryDescription}` })),
      });
    } catch (e) {
      console.error('Load error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Modal helpers ──────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (resource: Resource) => {
    setEditing(resource);
    setForm({ ...resource });
    setShowModal(true);
  };

  const closeModal = () => setShowModal(false);

  const setField = (key: keyof Resource, value: any) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  // ── Save ───────────────────────────────────────────────────────────────────
  const save = async () => {
    if (!form.ResourceName?.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        await api.put(`resources/${editing.ResourceID}`, form);
      } else {
        await api.post('resources', form);
      }
      closeModal();
      await loadAll();
    } catch (e) {
      console.error('Save error:', e);
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const remove = async (id: number) => {
    setDeleting(id);
    try {
      await api.delete(`resources/${id}`);
      await loadAll();
    } catch (e) {
      console.error('Delete error:', e);
    } finally {
      setDeleting(null);
    }
  };

  // ── Filtered list ──────────────────────────────────────────────────────────
  const filtered = resources.filter((r) =>
    r.ResourceName.toLowerCase().includes(search.toLowerCase()) ||
    r.JIRAUserID.toLowerCase().includes(search.toLowerCase())
  );

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tighter text-gray-900">Resources</h2>
          <p className="text-sm text-gray-400 font-medium mt-1">Manage team members and their attributes</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-primary text-white px-5 py-3 rounded-2xl text-sm font-bold shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
        >
          <Plus size={16} /> Add Resource
        </button>
      </div>

      {/* ── Search bar ─────────────────────────────────────────────────────── */}
      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Search by name or Jira ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all bg-white"
        />
      </div>

      {/* ── Table ──────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-24 text-gray-400">
            <Loader2 size={26} className="animate-spin mr-3" /> Loading resources...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-300">
            <div className="text-6xl mb-4">👤</div>
            <p className="text-sm font-black capitalize">
              {search ? 'No results for your search' : 'No resources yet'}
            </p>
            {!search && (
              <button onClick={openCreate} className="mt-4 text-xs font-bold text-primary hover:underline">
                + Add your first resource
              </button>
            )}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                {['Resource', 'Jira ID', 'Role', 'Process Team', 'Company', 'Country', ''].map((h) => (
                  <th key={h} className="text-left text-[10px] font-black text-gray-400 uppercase tracking-widest px-6 py-4 last:text-right">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((resource, i) => (
                <tr
                  key={resource.ResourceID}
                  className={`border-b border-gray-50 hover:bg-gray-50/40 transition-colors ${i === filtered.length - 1 ? 'border-0' : ''}`}
                >
                  {/* Name + Avatar */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={resource.ResourceName} />
                      <div>
                        <p className="text-sm font-bold text-gray-900">{resource.ResourceName}</p>
                        <p className="text-[11px] text-gray-400 font-medium">#{resource.ResourceID}</p>
                      </div>
                    </div>
                  </td>

                  {/* Jira ID */}
                  <td className="px-6 py-4">
                    <span className="font-mono text-xs bg-gray-100 text-gray-600 px-2.5 py-1.5 rounded-lg font-bold">
                      {resource.JIRAUserID || '—'}
                    </span>
                  </td>

                  {/* FK badges */}
                  <td className="px-6 py-4"><Badge text={findLabel(lookups.roles, resource.RoleID)} /></td>
                  <td className="px-6 py-4"><Badge text={findLabel(lookups.processTeams, resource.ProcessTeamID)} /></td>
                  <td className="px-6 py-4"><Badge text={findLabel(lookups.companies, resource.CompanyID)} /></td>
                  <td className="px-6 py-4">
                    <Badge text={resource.CountryID ?? undefined} />
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(resource)}
                        className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all"
                        title="Edit"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => remove(resource.ResourceID)}
                        disabled={deleting === resource.ResourceID}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all disabled:opacity-40"
                        title="Delete"
                      >
                        {deleting === resource.ResourceID
                          ? <Loader2 size={14} className="animate-spin" />
                          : <Trash2 size={14} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Count footer */}
      {!loading && filtered.length > 0 && (
        <p className="text-xs text-gray-400 font-medium px-1">
          Showing {filtered.length} of {resources.length} resource{resources.length !== 1 ? 's' : ''}
        </p>
      )}

      {/* ── Modal ──────────────────────────────────────────────────────────── */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/25 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-8 pt-8 pb-6 border-b border-gray-100 sticky top-0 bg-white rounded-t-3xl z-10">
              <div>
                <h4 className="text-lg font-black text-gray-900">
                  {editing ? 'Edit Resource' : 'New Resource'}
                </h4>
                <p className="text-xs text-gray-400 mt-0.5 font-medium">
                  {editing ? `Editing #${editing.ResourceID}` : 'Fill in the details below'}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal body */}
            <div className="px-8 py-6 space-y-5">
              {/* Free-text fields */}
              <div>
                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">
                  Full Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.ResourceName ?? ''}
                  onChange={(e) => setField('ResourceName', e.target.value)}
                  placeholder="e.g. Alice Johnson"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">
                  Jira User ID <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.JIRAUserID ?? ''}
                  onChange={(e) => setField('JIRAUserID', e.target.value)}
                  placeholder="e.g. alice.johnson"
                  className="w-full border border-gray-200 font-mono rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
                />
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3 py-1">
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Attributes</span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>

              {/* Lookup dropdowns */}
              <SelectField
                label="Role *"
                value={form.RoleID ?? null}
                onChange={(v) => setField('RoleID', v ? Number(v) : null)}
                options={lookups.roles}
                placeholder="Select a role..."
              />
              <SelectField
                label="Process Team *"
                value={form.ProcessTeamID ?? null}
                onChange={(v) => setField('ProcessTeamID', v ? Number(v) : null)}
                options={lookups.processTeams}
                placeholder="Select a process team..."
              />
              <SelectField
                label="Company *"
                value={form.CompanyID ?? null}
                onChange={(v) => setField('CompanyID', v ? Number(v) : null)}
                options={lookups.companies}
                placeholder="Select a company..."
              />
              <SelectField
                label="Country *"
                value={form.CountryID ?? null}
                onChange={(v) => setField('CountryID', v as string | null)}
                options={lookups.countries}
                placeholder="Select a country..."
              />
            </div>

            {/* Modal footer */}
            <div className="px-8 pb-8 pt-2 flex gap-3 sticky bottom-0 bg-white rounded-b-3xl">
              <button
                onClick={closeModal}
                className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-2xl text-sm font-bold hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={save}
                disabled={saving || !form.ResourceName?.trim() || !form.JIRAUserID?.trim() || !form.RoleID || !form.ProcessTeamID || !form.CompanyID || !form.CountryID}
                className="flex-1 py-3 bg-primary text-white rounded-2xl text-sm font-bold shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                {saving ? 'Saving...' : editing ? 'Update' : 'Create Resource'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
