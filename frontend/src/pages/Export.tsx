import { useState, useEffect } from 'react';
import { Download, Table as TableIcon, FileSpreadsheet, Search, Loader2 } from 'lucide-react';
import api from '../lib/api';

export default function Export() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('export-data');
      setData(res.data);
    } catch (e) {
      console.error('Export fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = () => {
    if (data.length === 0) return;
    
    // Get headers from first object keys
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','), // header row
      ...data.map(row => 
        headers.map(fieldName => {
          const value = row[fieldName];
          // Escape quotes and wrap in quotes if contains comma
          const escaped = String(value).replace(/"/g, '""');
          return `"${escaped}"`;
        }).join(',')
      )
    ];

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `transcend_capacity_export_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filtered = data.filter(row => 
    Object.values(row).some(val => 
      String(val).toLowerCase().includes(search.toLowerCase())
    )
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <FileSpreadsheet size={20} />
            </div>
            <h2 className="text-2xl font-black tracking-tight text-gray-900">PowerBI Export</h2>
          </div>
          <p className="text-sm text-gray-400 font-bold uppercase tracking-widest leading-relaxed">
            Flattened Resource-Allocation dataset for external analytics
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Search exported data..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12 pr-6 py-3.5 bg-gray-50 border-transparent border focus:bg-white focus:border-primary/20 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all w-full md:w-80 font-bold text-gray-700"
            />
          </div>
          <button
            onClick={downloadCSV}
            disabled={loading || data.length === 0}
            className="flex items-center gap-2.5 px-8 py-3.5 bg-primary text-white rounded-2xl font-black text-sm hover:shadow-xl hover:shadow-primary/20 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:pointer-events-none group"
          >
            <Download size={18} className="group-hover:animate-bounce" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="py-32 flex flex-col items-center justify-center text-gray-400 gap-4">
            <Loader2 className="animate-spin text-primary" size={40} />
            <p className="text-xs font-black uppercase tracking-widest">Processing massive join...</p>
          </div>
        ) : data.length === 0 ? (
          <div className="py-32 flex flex-col items-center justify-center text-gray-300 gap-4">
            <TableIcon size={60} strokeWidth={1} />
            <p className="text-sm font-black uppercase tracking-widest">No data available for export</p>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[650px] custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-gray-50/95 backdrop-blur-md z-10">
                <tr>
                  {Object.keys(data[0]).map((header) => (
                    <th key={header} className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50/50 transition-colors group">
                    {Object.values(row).map((val: any, j) => (
                      <td key={j} className="px-6 py-4 whitespace-nowrap">
                        {typeof val === 'number' ? (
                          <span className={`text-sm font-black ${val > 0 ? 'text-primary' : 'text-gray-300'}`}>
                            {val.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-sm font-bold text-gray-700">{val}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="px-8 py-4 bg-gray-50/50 border-t border-gray-100 flex justify-between items-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
          <span>Row count: {filtered.length}</span>
          <span>Last updated: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  );
}
