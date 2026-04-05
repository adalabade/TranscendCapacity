import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, X, Check, Loader2, Search, Filter } from 'lucide-react';
import api from '../lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Allocation {
  ResourceID: number;
  ReleaseID: number;
  SprintID: number;
  AssignmentID: number;
  AllocationValue: number;
}

interface LookupItem { id: number | string; label: string; }

interface Lookups {
  resources: any[]; // Store full resource object to get TeamID
  releases: LookupItem[];
  sprints: LookupItem[];
  assignments: LookupItem[];
  teams: LookupItem[];
}

const EMPTY_FORM: Partial<Allocation> = {
  ResourceID: 0,
  ReleaseID: 0,
  SprintID: 0,
  AssignmentID: 0,
  AllocationValue: 0.1,
};

// ─── Components ───────────────────────────────────────────────────────────────
function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder = 'Select...',
  disabled = false,
}: {
  label: string;
  value: number | string | null;
  onChange: (v: number | string | null) => void;
  options: LookupItem[];
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <div className={disabled ? 'opacity-50' : ''}>
      <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">{label}</label>
      <select
        disabled={disabled}
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

function MiniBar({ value }: { value: number }) {
  const percent = Math.min(100, Math.max(0, value * 100));
  const color = percent > 100 ? 'bg-red-500' : percent > 80 ? 'bg-orange-500' : 'bg-primary';
  return (
    <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
      <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${percent}%` }} />
    </div>
  );
}

// ─── Allocations Page ─────────────────────────────────────────────────────────
export default function Allocations() {
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [lookups, setLookups]         = useState<Lookups>({ resources: [], releases: [], sprints: [], assignments: [], teams: [] });
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [releaseFilter, setReleaseFilter] = useState<string>('');
  const [teamFilter, setTeamFilter]       = useState<string>('');
  const [modalTeamFilter, setModalTeamFilter] = useState<number | null>(null);
  const [showModal, setShowModal]     = useState(false);
  const [editing, setEditing]         = useState<Allocation | null>(null);
  const [form, setForm]               = useState<Partial<Allocation>>(EMPTY_FORM);
  const [saving, setSaving]           = useState(false);
  const [deleting, setDeleting]       = useState<string | null>(null); // Key-string for deleting state

  // ── Helpers ────────────────────────────────────────────────────────────────
  const findLabel = (list: LookupItem[], id: number | string | null) =>
    id == null ? undefined : list.find((x) => String(x.id) === String(id))?.label;

  const getPK = (a: Allocation) => `${a.ResourceID}-${a.ReleaseID}-${a.SprintID}-${a.AssignmentID}`;

  // ── Load data ──────────────────────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [all, res, rel, spr, asgn, teams] = await Promise.all([
        api.get('allocations'),
        api.get('resources'),
        api.get('releases'),
        api.get('sprints'),
        api.get('assignments'),
        api.get('process-teams'),
      ]);

      setAllocations(all.data);
      setLookups({
        resources:   res.data, // Full objects
        releases:    rel.data.map((r: any) => ({ id: r.ReleaseID,    label: r.ReleaseDescription })),
        sprints:     spr.data.map((s: any) => ({ id: s.SprintID,     label: s.SprintDescription })),
        assignments: asgn.data.map((a: any) => ({ id: a.AssignmentID, label: a.AssignmentDescription })),
        teams:       teams.data.map((t: any) => ({ id: t.ProcessTeamID, label: t.ProcessTeamDescription })),
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
    setModalTeamFilter(null);
    setShowModal(true);
  };

  const openEdit = (alloc: Allocation) => {
    setEditing(alloc);
    setForm({ ...alloc });
    const res = lookups.resources.find(r => r.ResourceID === alloc.ResourceID);
    setModalTeamFilter(res?.ProcessTeamID || null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
  };

  const setField = (key: keyof Allocation, value: any) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  // ── Save ───────────────────────────────────────────────────────────────────
  const save = async () => {
    if (!form.ResourceID || !form.ReleaseID || !form.SprintID || !form.AssignmentID) return;
    setSaving(true);
    try {
      if (editing) {
        // Since it's a composite key, if any of the key fields changed, we should technically delete and recreate.
        // But if only the value changed, we can PUT.
        const keysMatch = 
          form.ResourceID === editing.ResourceID &&
          form.ReleaseID === editing.ReleaseID &&
          form.SprintID === editing.SprintID &&
          form.AssignmentID === editing.AssignmentID;

        if (keysMatch) {
          await api.put(`allocations/${editing.ResourceID}/${editing.ReleaseID}/${editing.SprintID}/${editing.AssignmentID}`, form);
        } else {
          // Key changed: delete old, post new
          await api.delete(`allocations/${editing.ResourceID}/${editing.ReleaseID}/${editing.SprintID}/${editing.AssignmentID}`);
          await api.post('allocations', form);
        }
      } else {
        await api.post('allocations', form);
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
  const remove = async (a: Allocation) => {
    const key = getPK(a);
    setDeleting(key);
    try {
      await api.delete(`allocations/${a.ResourceID}/${a.ReleaseID}/${a.SprintID}/${a.AssignmentID}`);
      await loadAll();
    } catch (e) {
      console.error('Delete error:', e);
    } finally {
      setDeleting(null);
    }
  };

  // ── Filtered list ──────────────────────────────────────────────────────────
  const filtered = allocations.filter((a) => {
    const resource = lookups.resources.find(r => r.ResourceID === a.ResourceID);
    const resName = resource?.ResourceName?.toLowerCase() || '';
    const matchSearch = resName.includes(search.toLowerCase());
    const matchRelease = !releaseFilter || String(a.ReleaseID) === releaseFilter;
    const matchTeam = !teamFilter || String(resource?.ProcessTeamID) === teamFilter;
    return matchSearch && matchRelease && matchTeam;
  });

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tighter text-gray-900">Allocations</h2>
          <p className="text-sm text-gray-400 font-medium mt-1">Manage effort distribution across sprints</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-primary text-white px-5 py-3 rounded-2xl text-sm font-bold shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
        >
          <Plus size={16} /> New Allocation
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative max-w-xs flex-1">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search resource..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all bg-white"
          />
        </div>
        
        <div className="relative min-w-[180px]">
          <Filter size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <select
            value={releaseFilter}
            onChange={(e) => setReleaseFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all bg-white appearance-none cursor-pointer"
          >
            <option value="">All Releases</option>
            {lookups.releases.map((r) => (
              <option key={r.id} value={r.id}>{r.label}</option>
            ))}
          </select>
        </div>

        <div className="relative min-w-[180px]">
          <Filter size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <select
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all bg-white appearance-none cursor-pointer"
          >
            <option value="">All Teams</option>
            {lookups.teams.map((t) => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-24 text-gray-400">
            <Loader2 size={26} className="animate-spin mr-3" /> Loading allocations...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-300">
            <div className="text-6xl mb-4">📊</div>
            <p className="text-sm font-black capitalize">
              {search || releaseFilter ? 'No results for your filters' : 'No allocations yet'}
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                {['Resource', 'Process Team', 'Release / Sprint', 'Assignment', 'Allocation', ''].map((h) => (
                  <th key={h} className="text-left text-[10px] font-black text-gray-400 uppercase tracking-widest px-6 py-4 last:text-right">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((alloc, i) => {
                const key = getPK(alloc);
                const resource = lookups.resources.find(r => r.ResourceID === alloc.ResourceID);
                return (
                  <tr
                    key={key}
                    className={`border-b border-gray-50 hover:bg-gray-50/40 transition-colors ${i === filtered.length - 1 ? 'border-0' : ''}`}
                  >
                    {/* Resource */}
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-gray-900">
                        {resource?.ResourceName}
                      </p>
                    </td>

                    {/* Team */}
                    <td className="px-6 py-4">
                      <p className="text-xs font-bold text-gray-500">
                        {findLabel(lookups.teams, resource?.ProcessTeamID)}
                      </p>
                    </td>

                    {/* Meta */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-bold text-gray-700">{findLabel(lookups.releases, alloc.ReleaseID)}</span>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">{findLabel(lookups.sprints, alloc.SprintID)}</span>
                      </div>
                    </td>

                    {/* Assignment */}
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-wide">
                        {findLabel(lookups.assignments, alloc.AssignmentID)}
                      </span>
                    </td>

                    {/* Value */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <MiniBar value={alloc.AllocationValue} />
                        <span className="text-xs font-black text-gray-900">
                          {alloc.AllocationValue.toFixed(2)}
                        </span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(alloc)}
                          className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all"
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => remove(alloc)}
                          disabled={deleting === key}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all disabled:opacity-40"
                          title="Delete"
                        >
                          {deleting === key
                            ? <Loader2 size={14} className="animate-spin" />
                            : <Trash2 size={14} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
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
                  {editing ? 'Edit Allocation' : 'New Allocation'}
                </h4>
                <p className="text-xs text-gray-400 mt-0.5 font-medium">Define effort distribution for a resource</p>
              </div>
              <button onClick={closeModal} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all">
                <X size={18} />
              </button>
            </div>

            {/* Modal body */}
            <div className="px-8 py-6 space-y-5">
              <SelectField
                label="Filter by Team"
                value={modalTeamFilter}
                onChange={(v) => setModalTeamFilter(v ? Number(v) : null)}
                options={lookups.teams}
                placeholder="All Teams"
              />
              <SelectField
                label="Resource *"
                value={form.ResourceID ?? null}
                onChange={(v) => setField('ResourceID', Number(v))}
                options={lookups.resources
                  .filter(r => !modalTeamFilter || r.ProcessTeamID === modalTeamFilter)
                  .map(r => ({ id: r.ResourceID, label: r.ResourceName }))}
                placeholder="Select a resource..."
              />
              <div className="grid grid-cols-2 gap-4">
                <SelectField
                  label="Release *"
                  value={form.ReleaseID ?? null}
                  onChange={(v) => setField('ReleaseID', Number(v))}
                  options={lookups.releases}
                  placeholder="Release..."
                />
                <SelectField
                  label="Sprint *"
                  value={form.SprintID ?? null}
                  onChange={(v) => setField('SprintID', Number(v))}
                  options={lookups.sprints}
                  placeholder="Sprint..."
                />
              </div>
              <SelectField
                label="Assignment *"
                value={form.AssignmentID ?? null}
                onChange={(v) => setField('AssignmentID', Number(v))}
                options={lookups.assignments}
                placeholder="Assignment type..."
              />

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Allocation Value</label>
                  <span className="text-lg font-black text-primary">{(form.AllocationValue || 0).toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="15"
                  step="0.5"
                  value={form.AllocationValue ?? 0}
                  onChange={(e) => setField('AllocationValue', parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-[10px] font-bold text-gray-300 mt-1 uppercase">
                  <span>0.0</span>
                  <span>5.0</span>
                  <span>10.0</span>
                  <span>15.0</span>
                </div>
              </div>
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
                disabled={saving || !form.ResourceID || !form.ReleaseID || !form.SprintID || !form.AssignmentID}
                className="flex-1 py-3 bg-primary text-white rounded-2xl text-sm font-bold shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                {saving ? 'Saving...' : editing ? 'Update' : 'Create Allocation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
