import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Settings, Database, FileSpreadsheet } from 'lucide-react';

const menuItems = [
  { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { name: 'Resources', icon: Users, path: '/resources' },
  { path: '/allocations', icon: Database, name: 'Allocations' },
  { path: '/export', icon: FileSpreadsheet, name: 'PowerBI Export' },
  { path: '/settings', icon: Settings, name: 'Settings' },
];

export default function Sidebar() {
  return (
    <div className="w-80 h-screen bg-white border-r border-border flex flex-col flex-shrink-0 sticky top-0">
      {/* Brand Section */}
      <div className="px-8 pt-8 mb-[80px] flex-shrink-0">
        <h1 className="text-2xl font-black text-primary tracking-tighter capitalize whitespace-nowrap leading-none">
          Transcend Capacity
        </h1>
        <div className="w-8 h-1 bg-primary mt-4 rounded-full" />
      </div>

      {/* Navigation */}
      <nav className="flex flex-col px-5 gap-3">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `flex items-center gap-4 px-6 h-14 rounded-2xl transition-all duration-200 group ${
                isActive
                  ? 'bg-primary text-white shadow-xl shadow-primary/20'
                  : 'text-gray-400 hover:bg-gray-50 hover:text-primary'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon size={22} className={isActive ? 'text-white' : 'group-hover:scale-110 transition-transform'} />
                <span className="font-bold text-sm tracking-wide capitalize">{item.name}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto p-8 opacity-30 text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 italic">Internal</p>
      </div>
    </div>
  );
}
