import { Home, Search, BarChart3, User } from 'lucide-react';

type Tab = 'home' | 'search' | 'stats' | 'profile';

interface TabBarProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const tabs: { id: Tab; icon: typeof Home; label: string }[] = [
  { id: 'home', icon: Home, label: 'Home' },
  { id: 'search', icon: Search, label: 'Search' },
  { id: 'stats', icon: BarChart3, label: 'Stats' },
  { id: 'profile', icon: User, label: 'Profile' },
];

export function TabBar({ activeTab, onTabChange }: TabBarProps) {
  return (
    <div className="px-5 pb-5 pt-3">
      <nav className="bg-ih-surface dark:bg-ih-surface-dark rounded-[36px] p-1 flex">
        {tabs.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={`flex-1 flex flex-col items-center justify-center gap-1 h-14 rounded-[26px] transition-colors ${
              activeTab === id
                ? 'bg-ih-accent'
                : ''
            }`}
          >
            <Icon
              className={`w-[18px] h-[18px] ${
                activeTab === id ? 'text-white' : 'text-ih-text-muted dark:text-ih-text-secondary-dark'
              }`}
            />
            <span
              className={`text-[10px] font-medium ${
                activeTab === id ? 'text-white' : 'text-ih-text-muted dark:text-ih-text-secondary-dark'
              }`}
            >
              {label}
            </span>
          </button>
        ))}
      </nav>
    </div>
  );
}
