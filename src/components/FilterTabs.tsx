import { FilterType } from '../types/rating';

interface FilterTabsProps {
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
}

const filters: FilterType[] = ['All', 'Sam', 'Katie', 'Both'];

export function FilterTabs({ activeFilter, onFilterChange }: FilterTabsProps) {
  return (
    <div className="flex gap-2">
      {filters.map((filter) => (
        <button
          key={filter}
          onClick={() => onFilterChange(filter)}
          className={`px-4 py-2 rounded-full text-[13px] font-medium transition-colors ${
            activeFilter === filter
              ? 'bg-ih-accent text-white'
              : 'bg-ih-surface dark:bg-ih-surface-dark text-ih-text-secondary dark:text-ih-text-secondary-dark'
          }`}
        >
          {filter}
        </button>
      ))}
    </div>
  );
}
