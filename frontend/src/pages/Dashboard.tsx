import CapacityBar from '../components/CapacityBar';
import { Users, BarChart3, CheckCircle2, TrendingUp } from 'lucide-react';

export default function Dashboard() {
  const stats = [
    { name: 'Total resources', value: '3', icon: Users, color: 'text-primary' },
    { name: 'Active projects', value: '2', icon: CheckCircle2, color: 'text-green-600' },
    { name: 'Avg. occupation', value: '90%', icon: TrendingUp, color: 'text-blue-600' },
    { name: 'Total allocs', value: '3', icon: BarChart3, color: 'text-purple-600' },
  ];

  const resources = [
    { name: 'Alice Johnson', current: 0.9, max: 1.0 },
    { name: 'Bob Smith', current: 0.8, max: 0.8 },
    { name: 'Carlos Rodriguez', current: 0.0, max: 1.0 },
  ];

  return (
    <div className="space-y-12">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black tracking-tighter text-gray-900 capitalize">
          Allocation overview
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white p-5 rounded-3xl shadow-sm border border-transparent hover:border-primary/10 transition-all group">
            <div className="flex flex-col gap-3">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-gray-50 group-hover:bg-primary/5 group-hover:${stat.color} transition-colors border border-gray-100`}>
                <stat.icon size={26} className="text-gray-400 transition-colors group-hover:text-inherit" />
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 capitalize tracking-wide mb-1">{stat.name}</p>
                <h3 className="text-4xl font-black mt-1 text-gray-900">{stat.value}</h3>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm">
        <div className="mb-8">
          <h3 className="text-2xl font-black text-gray-900 capitalize tracking-tight">Team capacity status</h3>
          <p className="text-sm text-gray-400 font-bold capitalize tracking-widest mt-2">Real-time engagement tracking</p>
        </div>
        <div className="space-y-6">
          {resources.map((res) => (
            <div key={res.name} className="p-4 rounded-[1.5rem] bg-gray-50/30 border border-gray-100 hover:border-gray-200 transition-all">
              <CapacityBar label={res.name} current={res.current} max={res.max} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
