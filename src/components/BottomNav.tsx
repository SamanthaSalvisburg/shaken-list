import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Search, Map, BarChart3, Plus } from 'lucide-react';

const tabs = [
  { to: '/', icon: Home, label: 'Home', end: true },
  { to: '/search', icon: Search, label: 'Search', end: false },
  { to: '/map', icon: Map, label: 'Map', end: false },
  { to: '/stats', icon: BarChart3, label: 'Stats', end: false },
];

export function BottomNav() {
  const navigate = useNavigate();

  return (
    <nav className="bg-ih-surface dark:bg-ih-surface-dark border-t border-ih-border dark:border-ih-border-dark px-5 pt-2 pb-[max(env(safe-area-inset-bottom,16px),16px)] flex items-center">
      {/* Home, Search */}
      {tabs.slice(0, 2).map(({ to, icon: Icon, label, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center gap-1 py-1.5 ${
              isActive
                ? 'text-ih-accent'
                : 'text-ih-text-muted dark:text-ih-text-muted-dark'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <Icon className="w-[22px] h-[22px]" strokeWidth={isActive ? 2.25 : 1.75} />
              <span className={`text-[10px] ${isActive ? 'font-semibold' : 'font-medium'}`}>
                {label}
              </span>
            </>
          )}
        </NavLink>
      ))}

      {/* Center FAB */}
      <div className="flex-1 flex items-center justify-center">
        <button
          type="button"
          onClick={() => navigate('/add')}
          aria-label="Add rating"
          className="w-14 h-14 rounded-full bg-ih-accent flex items-center justify-center shadow-md active:scale-95 transition-transform"
        >
          <Plus className="w-6 h-6 text-white" strokeWidth={2.5} />
        </button>
      </div>

      {/* Map, Stats */}
      {tabs.slice(2).map(({ to, icon: Icon, label, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center gap-1 py-1.5 ${
              isActive
                ? 'text-ih-accent'
                : 'text-ih-text-muted dark:text-ih-text-muted-dark'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <Icon className="w-[22px] h-[22px]" strokeWidth={isActive ? 2.25 : 1.75} />
              <span className={`text-[10px] ${isActive ? 'font-semibold' : 'font-medium'}`}>
                {label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
