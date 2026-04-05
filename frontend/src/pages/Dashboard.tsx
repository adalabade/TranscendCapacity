import { useState, useEffect, useMemo, useCallback } from 'react';
import MultiSelect from '../components/MultiSelect';
import { Users, BarChart3, CheckCircle2, TrendingUp, Calendar, Package, Group as TeamIcon, Loader2, AlertTriangle } from 'lucide-react';
import api from '../lib/api';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    allocations: any[];
    resources: any[];
    releases: any[];
    sprints: any[];
    teams: any[];
    maxCapacities: any[];
    roles: any[];
    companies: any[];
    countries: any[];
  }>({
    allocations: [],
    resources: [],
    releases: [],
    sprints: [],
    teams: [],
    maxCapacities: [],
    roles: [],
    companies: [],
    countries: [],
  });

  // Selected Filter IDs
  const [selReleases, setSelReleases] = useState<(number | string)[]>([]);
  const [selSprints, setSelSprints]   = useState<(number | string)[]>([]);
  const [selTeams, setSelTeams]       = useState<(number | string)[]>([]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [allAllocs, allRes, allRels, allSprints, allTeams, allMax, roles, companies, countries] = await Promise.all([
        api.get('allocations'),
        api.get('resources'),
        api.get('releases'),
        api.get('sprints'),
        api.get('process-teams'),
        api.get('resource-allocation-max'),
        api.get('roles'),
        api.get('companies'),
        api.get('countries'),
      ]);
      
      const d = {
        allocations: allAllocs.data,
        resources: allRes.data,
        releases: allRels.data,
        sprints: allSprints.data,
        teams: allTeams.data,
        maxCapacities: allMax.data,
        roles: roles.data,
        companies: companies.data,
        countries: countries.data,
      };

      setData(d);
      // Initialize filters with all options (standard behavior for comprehensive overview)
      setSelReleases(d.releases.map((r: any) => r.ReleaseID));
      setSelSprints(d.sprints.map((s: any) => s.SprintID));
      setSelTeams(d.teams.map((t: any) => t.ProcessTeamID));
    } catch (e) {
      console.error('Dashboard load error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ─── Filter Logic ─────────────────────────────────────────────────────────────
  const { filteredStats, detailedRows } = useMemo(() => {
    const resources = data.resources.filter((r) => selTeams.includes(r.ProcessTeamID));
    
    // Matrix Row Generation
    const rows: any[] = [];
    resources.forEach(res => {
      selReleases.forEach(relId => {
        selSprints.forEach(sprId => {
          const allocs = data.allocations.filter(a => 
            a.ResourceID === res.ResourceID && 
            a.ReleaseID === relId && 
            a.SprintID === sprId
          );

          const base = {
            resourceName: res.ResourceName,
            team: data.teams.find(t => t.ProcessTeamID === res.ProcessTeamID)?.ProcessTeamDescription || '-',
            role: data.roles.find(r => r.RoleID === res.RoleID)?.RoleDescription || '-',
            company: data.companies.find(c => c.CompanyID === res.CompanyID)?.CompanyDescription || '-',
            country: data.countries.find(c => c.CountryID === res.CountryID)?.CountryCode || '-',
            release: data.releases.find(r => r.ReleaseID === relId)?.ReleaseDescription || '-',
            sprint: data.sprints.find(s => s.SprintID === sprId)?.SprintDescription || '-',
          };

          if (allocs.length > 0) {
            allocs.forEach(a => {
              rows.push({ ...base, value: a.AllocationValue, isMissing: false });
            });
          } else {
            rows.push({ ...base, value: 0, isMissing: true });
          }
        });
      });
    });

    const activeResCount = Array.from(new Set(rows.filter(r => !r.isMissing).map(r => r.resourceName))).length;
    const totalAllocSum = rows.reduce((acc, r) => acc + r.value, 0);
    const avgAllocPerSprint = (activeResCount > 0 && selSprints.length > 0)
      ? (totalAllocSum / (selSprints.length * activeResCount))
      : 0;

    return {
      filteredStats: [
        { name: 'Active Resources', value: activeResCount, icon: Users, color: 'text-primary' },
        { name: 'Total Allocation', value: totalAllocSum.toFixed(2), icon: CheckCircle2, color: 'text-green-600' },
        { name: 'Avg Allocation per Sprint', value: avgAllocPerSprint.toFixed(2), icon: TrendingUp, color: 'text-blue-600' },
        { name: 'Total Allocs', value: rows.filter(r => !r.isMissing).length, icon: BarChart3, color: 'text-purple-600' },
      ],
      detailedRows: rows,
    };
  }, [data, selReleases, selSprints, selTeams]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-400 gap-4">
        <Loader2 size={42} className="animate-spin text-primary" />
        <h3 className="text-sm font-black uppercase tracking-widest">Aggregating real-time data...</h3>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-12 animate-in fade-in duration-700">
      {/* Header & Global Filters */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div>
          <h2 className="text-3xl font-black tracking-tighter text-gray-900 capitalize">
            Allocation Insights
          </h2>
          <p className="text-sm text-gray-400 font-bold mt-2 capitalize tracking-widest italic opacity-50">Global filtering system</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 bg-gray-50/50 p-2 rounded-[2rem] border border-gray-100/50">
          <MultiSelect
            label="Releases"
            icon={Package}
            options={data.releases.map(r => ({ id: r.ReleaseID, label: r.ReleaseDescription }))}
            selectedIds={selReleases}
            onChange={setSelReleases}
            placeholder="No Release"
          />
          <MultiSelect
            label="Sprints"
            icon={Calendar}
            options={data.sprints.map(s => ({ id: s.SprintID, label: s.SprintDescription }))}
            selectedIds={selSprints}
            onChange={setSelSprints}
            placeholder="No Sprint"
          />
          <MultiSelect
            label="Process Teams"
            icon={TeamIcon}
            options={data.teams.map(t => ({ id: t.ProcessTeamID, label: t.ProcessTeamDescription }))}
            selectedIds={selTeams}
            onChange={setSelTeams}
            placeholder="No Team"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {filteredStats.map((stat) => (
          <div key={stat.name} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-transparent hover:border-primary/10 transition-all group">
            <div className="flex flex-col gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-gray-50 group-hover:bg-primary/5 group-hover:${stat.color} transition-colors border border-gray-100`}>
                <stat.icon size={26} className="text-gray-400 transition-colors group-hover:text-inherit" />
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">{stat.name}</p>
                <h3 className="text-4xl font-black mt-1 text-gray-900 tracking-tight">{stat.value}</h3>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-[3rem] shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-8 border-b border-gray-50 flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-black text-gray-900 tracking-tight capitalize">Resource load profile</h3>
            <p className="text-sm text-gray-400 font-bold mt-2 uppercase tracking-[0.2em]">Detailed matrix Audit</p>
          </div>
          <div className="px-4 py-2 bg-primary/5 rounded-2xl text-primary text-[10px] font-black uppercase tracking-widest border border-primary/10">
            {detailedRows.length} Rows Generated
          </div>
        </div>
        
        {detailedRows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-300">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-sm font-black uppercase tracking-widest text-center">No resources found for<br />the selected scope</p>
          </div>
        ) : (
          <div className="overflow-x-auto overflow-y-auto max-h-[600px] custom-scrollbar">
            <table className="w-full text-left">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  {['Resource', 'Team', 'Role', 'Company', 'Country', 'Release', 'Sprint', 'Allocation'].map((h) => (
                    <th key={h} className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {detailedRows.map((row, i) => (
                  <tr 
                    key={i} 
                    className={`group transition-colors ${row.isMissing ? 'bg-amber-50/20 hover:bg-amber-50/40' : 'hover:bg-gray-50/50'}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {row.isMissing && <AlertTriangle size={14} className="text-amber-500 animate-pulse" />}
                        <span className={`text-sm font-bold ${row.isMissing ? 'text-amber-700' : 'text-gray-900'}`}>
                          {row.resourceName}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-gray-500">{row.team}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-gray-500">{row.role}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-gray-400">{row.company}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-gray-400">{row.country}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg text-[10px] font-black uppercase">{row.release}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 bg-white border border-gray-100 text-gray-400 rounded-lg text-[10px] font-black uppercase">{row.sprint}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${row.isMissing ? 'bg-gray-200' : 'bg-primary'}`} />
                        <span className={`text-sm font-black ${row.isMissing ? 'text-gray-300' : 'text-gray-900'}`}>
                          {row.value.toFixed(2)}
                        </span>
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
  );
}
