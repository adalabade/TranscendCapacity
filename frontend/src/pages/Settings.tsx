import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X, Check, Loader2 } from 'lucide-react';
import api from '../lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────
type FieldDef = { key: string; label: string; type?: string; required?: boolean; maxLength?: number };
interface TabConfig {
  id: string;
  label: string;
  singularLabel: string;   // added for cleaner Labels
  endpoint: string;
  idField: string;          // real PK name returned by the API
  fields: FieldDef[];
}

// ─── Reusable CRUD Table ─────────────────────────────────────────────────────
function CrudTable({ label: title, singularLabel, endpoint, idField, fields }: TabConfig) {
  const [items, setItems]       = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]   = useState<any | null>(null);
  const [form, setForm]         = useState<Record<string, string>>({});
  const [saving, setSaving]     = useState(false);
  const [deleting, setDeleting] = useState<any>(null);

  const load = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`${endpoint}`);
      setItems(data);
    } catch (e) {
      console.error('GET error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [endpoint]);

  const openCreate = () => {
    setEditing(null);
    setForm({});
    setShowModal(true);
  };

  const openEdit = (item: any) => {
    setEditing(item);
    const f: Record<string, string> = {};
    fields.forEach(({ key }) => { f[key] = item[key] ?? ''; });
    setForm(f);
    setShowModal(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      if (editing) {
        // PUT uses the real PK value
        await api.put(`${endpoint}/${editing[idField]}`, form);
      } else {
        await api.post(`${endpoint}`, form);
      }
      setShowModal(false);
      await load();
    } catch (e) {
      console.error('SAVE error:', e);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (pkValue: any) => {
    setDeleting(pkValue);
    try {
      await api.delete(`${endpoint}/${pkValue}`);
      await load();
    } catch (e) {
      console.error('DELETE error:', e);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-black text-gray-900 capitalize">{title}</h3>
          <p className="text-xs text-gray-400 font-medium mt-0.5">{items.length} record{items.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
        >
          <Plus size={16} /> Add {singularLabel}
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <Loader2 size={24} className="animate-spin mr-2" /> Loading...
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-300">
            <div className="text-5xl mb-3">📭</div>
            <p className="text-sm font-bold capitalize">No {title} yet</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left text-[10px] font-black text-gray-400 uppercase tracking-widest px-6 py-4">ID</th>
                {fields.map((f) => (
                  <th key={f.key} className="text-left text-[10px] font-black text-gray-400 uppercase tracking-widest px-4 py-4 capitalize">{f.label}</th>
                ))}
                <th className="text-right text-[10px] font-black text-gray-400 uppercase tracking-widest px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={item[idField]} className={`border-b border-gray-50 hover:bg-gray-50/50 transition-colors ${i === items.length - 1 ? 'border-0' : ''}`}>
                  <td className="px-6 py-4 text-xs font-bold text-gray-300">#{item[idField]}</td>
                  {fields.map((f) => (
                    <td key={f.key} className="px-4 py-4 text-sm font-medium text-gray-700">{item[f.key] ?? '—'}</td>
                  ))}
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(item)}
                        className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => remove(item[idField])}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        disabled={deleting === item[idField]}
                      >
                        {deleting === item[idField] ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-lg font-black text-gray-900 capitalize">
                {editing ? 'Edit' : 'Add'} {singularLabel}
              </h4>
              <button onClick={() => setShowModal(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              {fields.map((f) => (
                <div key={f.key}>
                  <label className="block text-xs font-black text-gray-500 capitalize mb-1.5 tracking-wide">{f.label}</label>
                  <input
                    type={f.type ?? 'text'}
                    value={form[f.key] ?? ''}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                    placeholder={`Enter ${f.label.toLowerCase()}...`}
                    maxLength={f.maxLength}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
                    required={f.required}
                  />
                </div>
              ))}
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="flex-1 py-3 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:pointer-events-none"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tab Configuration — field names match the SQLModel exactly ───────────────
const TABS: TabConfig[] = [
  {
    id: 'roles',
    label: 'Roles',
    singularLabel: 'Role',
    endpoint: 'roles',
    idField: 'RoleID',
    fields: [{ key: 'RoleDescription', label: 'Description', required: true }],
  },
  {
    id: 'sprints',
    label: 'Sprints',
    singularLabel: 'Sprint',
    endpoint: 'sprints',
    idField: 'SprintID',
    fields: [{ key: 'SprintDescription', label: 'Description', required: true }],
  },
  {
    id: 'releases',
    label: 'Releases',
    singularLabel: 'Release',
    endpoint: 'releases',
    idField: 'ReleaseID',
    fields: [{ key: 'ReleaseDescription', label: 'Description', required: true }],
  },
  {
    id: 'countries',
    label: 'Countries',
    singularLabel: 'Country',
    endpoint: 'countries',
    idField: 'CountryID',
    fields: [
      { key: 'CountryID', label: 'Code (2 letters)', required: true, maxLength: 2 },
      { key: 'CountryDescription', label: 'Name', required: true },
    ],
  },
  {
    id: 'assignments',
    label: 'Assignments',
    singularLabel: 'Assignment',
    endpoint: 'assignments',
    idField: 'AssignmentID',
    fields: [{ key: 'AssignmentDescription', label: 'Description', required: true }],
  },
  {
    id: 'process-teams',
    label: 'Process Teams',
    singularLabel: 'Process Team',
    endpoint: 'process-teams',
    idField: 'ProcessTeamID',
    fields: [{ key: 'ProcessTeamDescription', label: 'Description', required: true }],
  },
  {
    id: 'companies',
    label: 'Companies',
    singularLabel: 'Company',
    endpoint: 'companies',
    idField: 'CompanyID',
    fields: [{ key: 'CompanyDescription', label: 'Description', required: true }],
  },
];

// ─── Settings Page ────────────────────────────────────────────────────────────
export default function Settings() {
  const [activeTab, setActiveTab] = useState<string>('roles');
  const tab = TABS.find((t) => t.id === activeTab)!;

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div>
        <h2 className="text-2xl font-black tracking-tighter text-gray-900 capitalize">Settings</h2>
        <p className="text-sm text-gray-400 font-medium mt-1">Manage lookup tables and configuration data</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 bg-gray-100/70 p-1 rounded-2xl w-fit">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === t.id
                ? 'bg-white text-primary shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* CRUD Content */}
      <CrudTable
        key={activeTab}
        {...tab}
      />
    </div>
  );
}
