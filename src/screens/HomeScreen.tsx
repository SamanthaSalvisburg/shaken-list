import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ChevronDown, Check } from 'lucide-react';
import { Rating, FilterType, SortType, GroupedRating } from '../types/rating';
import { FilterTabs } from '../components/FilterTabs';
import { StatCard } from '../components/StatCard';
import { RatingCard } from '../components/RatingCard';

const sortOptions: { value: SortType; label: string }[] = [
  { value: 'date', label: 'Date' },
  { value: 'highest', label: 'Highest to Lowest' },
  { value: 'lowest', label: 'Lowest to Highest' },
  { value: 'sam', label: 'Sam' },
  { value: 'katie', label: 'Katie' },
  { value: 'both', label: 'Both' },
];

// Group ratings by bar name + location so Sam/Katie entries for the same bar show as one row
function groupRatings(ratings: Rating[]): GroupedRating[] {
  const map = new Map<string, Rating[]>();

  for (const r of ratings) {
    // Include tasting notes in key so different flavors at the same bar stay separate
    const key = `${r.barName}|||${r.location}|||${r.tastingNotes || ''}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(r);
  }

  const grouped: GroupedRating[] = [];

  for (const [, entries] of map) {
    const samEntry = entries.find((e) => e.rater === 'Sam');
    const katieEntry = entries.find((e) => e.rater === 'Katie');
    const bothEntry = entries.find((e) => e.rater === 'Both');
    const first = entries[0];

    if (samEntry && katieEntry) {
      // Combine Sam + Katie into one split row
      grouped.push({
        id: samEntry.id,
        samId: samEntry.id,
        katieId: katieEntry.id,
        barName: first.barName,
        location: first.location,
        dateVisited: first.dateVisited,
        tastingNotes: samEntry.tastingNotes || katieEntry.tastingNotes,
        rater: 'Split',
        samRating: samEntry.rating,
        katieRating: katieEntry.rating,
      });
    }

    if (bothEntry) {
      grouped.push({
        id: bothEntry.id,
        barName: bothEntry.barName,
        location: bothEntry.location,
        dateVisited: bothEntry.dateVisited,
        tastingNotes: bothEntry.tastingNotes,
        rater: 'Both',
        rating: bothEntry.rating,
      });
    }

    // Handle solo entries that don't have a matching partner
    if (samEntry && !katieEntry) {
      grouped.push({
        id: samEntry.id,
        barName: samEntry.barName,
        location: samEntry.location,
        dateVisited: samEntry.dateVisited,
        tastingNotes: samEntry.tastingNotes,
        rater: 'Sam',
        rating: samEntry.rating,
      });
    }
    if (katieEntry && !samEntry) {
      grouped.push({
        id: katieEntry.id,
        barName: katieEntry.barName,
        location: katieEntry.location,
        dateVisited: katieEntry.dateVisited,
        tastingNotes: katieEntry.tastingNotes,
        rater: 'Katie',
        rating: katieEntry.rating,
      });
    }
  }

  return grouped;
}

function sortGroupedRatings(ratings: GroupedRating[], sort: SortType): GroupedRating[] {
  const sorted = [...ratings];
  switch (sort) {
    case 'date':
      return sorted.sort((a, b) => b.dateVisited.localeCompare(a.dateVisited));
    case 'highest': {
      const avg = (r: GroupedRating) =>
        r.rater === 'Split'
          ? ((r.samRating ?? 0) + (r.katieRating ?? 0)) / 2
          : (r.rating ?? 0);
      return sorted.sort((a, b) => avg(b) - avg(a) || b.dateVisited.localeCompare(a.dateVisited));
    }
    case 'lowest': {
      const avg = (r: GroupedRating) =>
        r.rater === 'Split'
          ? ((r.samRating ?? 0) + (r.katieRating ?? 0)) / 2
          : (r.rating ?? 0);
      return sorted.sort((a, b) => avg(a) - avg(b) || b.dateVisited.localeCompare(a.dateVisited));
    }
    case 'sam':
      return sorted.filter((r) => r.rater === 'Sam');
    case 'katie':
      return sorted.filter((r) => r.rater === 'Katie');
    case 'both':
      return sorted.filter((r) => r.rater === 'Both');
    default:
      return sorted;
  }
}

interface HomeScreenProps {
  ratings: Rating[];
  stats: { averageRating: number; totalMartinis: number };
}

export function HomeScreen({ ratings, stats }: HomeScreenProps) {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<FilterType>('All');
  const [sort, setSort] = useState<SortType>('date');
  const [sortOpen, setSortOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setSortOpen(false);
      }
    }
    if (sortOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [sortOpen]);

  // First filter raw ratings, then group, then sort
  const filteredRatings = ratings.filter((r) => {
    if (filter === 'All') return true;
    return r.rater === filter;
  });

  const grouped = useMemo(() => groupRatings(filteredRatings), [filteredRatings]);
  const sortedRatings = sortGroupedRatings(grouped, sort);
  const activeLabel = sortOptions.find((o) => o.value === sort)?.label || 'Date';

  return (
    <div className="h-full flex flex-col bg-ih-bg dark:bg-ih-bg-dark">
      {/* Safe area spacer for notch/dynamic island */}
      <div className="h-[env(safe-area-inset-top,20px)]" />

      {/* Scrollable Content */}
      <div className="flex-1 overflow-auto hide-scrollbar">
        <div className="px-6 pb-4 pt-2 space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h1 className="font-display text-[40px] text-ih-text dark:text-ih-text-dark tracking-tight">
              The Shaken List
            </h1>
            <button
              onClick={() => navigate('/add')}
              className="w-11 h-11 bg-ih-accent rounded-xl flex items-center justify-center"
            >
              <Plus className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Filter Tabs */}
          <FilterTabs activeFilter={filter} onFilterChange={setFilter} />

          {/* Stats Section */}
          <div className="space-y-3.5">
            <h2 className="text-sm font-semibold text-ih-text dark:text-ih-text-dark">Overview</h2>
            <div className="flex gap-3">
              <StatCard value={stats.averageRating || '—'} label="Average rating" />
              <StatCard value={stats.totalMartinis} label="Total martinis" />
            </div>
          </div>

          {/* Recent Ratings */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-ih-text dark:text-ih-text-dark">Recent ratings</h2>
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setSortOpen(!sortOpen)}
                  className="flex items-center gap-1 text-ih-text-muted dark:text-ih-text-muted-dark text-xs"
                >
                  {activeLabel}
                  <ChevronDown className={`w-3 h-3 transition-transform ${sortOpen ? 'rotate-180' : ''}`} />
                </button>
                {sortOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-ih-surface dark:bg-ih-surface-dark rounded-xl shadow-lg border border-ih-border dark:border-ih-border-dark z-50 overflow-hidden">
                    {sortOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setSort(option.value);
                          setSortOpen(false);
                        }}
                        className="w-full flex items-center justify-between px-4 py-2.5 text-xs text-ih-text dark:text-ih-text-dark hover:bg-ih-surface-warm dark:hover:bg-ih-surface-warm-dark transition-colors"
                      >
                        {option.label}
                        {sort === option.value && (
                          <Check className="w-3.5 h-3.5 text-ih-accent" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="bg-ih-surface dark:bg-ih-surface-dark rounded-2xl divide-y divide-ih-border dark:divide-ih-border-dark">
              {sortedRatings.length === 0 ? (
                <div className="p-8 text-center text-ih-text-muted dark:text-ih-text-muted-dark">
                  No ratings yet. Add your first espresso martini!
                </div>
              ) : (
                sortedRatings.map((rating) => (
                  <RatingCard
                    key={rating.id}
                    rating={rating}
                    onClick={() => navigate(`/rating/${rating.id}`)}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Safe area spacer for bottom */}
      <div className="h-[env(safe-area-inset-bottom,20px)]" />
    </div>
  );
}
