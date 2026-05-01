import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search as SearchIcon, X } from 'lucide-react';
import { Rating, FilterType, GroupedRating } from '../types/rating';
import { FilterTabs } from '../components/FilterTabs';
import { RatingCard } from '../components/RatingCard';

interface SearchScreenProps {
  ratings: Rating[];
}

function groupByBar(ratings: Rating[]): GroupedRating[] {
  const map = new Map<string, Rating[]>();
  for (const r of ratings) {
    const key = `${r.barName}|||${r.location}|||${r.tastingNotes || ''}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(r);
  }

  const grouped: GroupedRating[] = [];

  for (const entries of map.values()) {
    const sam = entries.find((e) => e.rater === 'Sam');
    const katie = entries.find((e) => e.rater === 'Katie');
    const both = entries.find((e) => e.rater === 'Both');
    const first = entries[0];

    if (sam && katie) {
      grouped.push({
        id: sam.id,
        samId: sam.id,
        katieId: katie.id,
        barName: first.barName,
        location: first.location,
        dateVisited: first.dateVisited,
        tastingNotes: sam.tastingNotes || katie.tastingNotes,
        rater: 'Split',
        samRating: sam.rating,
        katieRating: katie.rating,
      });
      continue;
    }

    const solo = both ?? sam ?? katie ?? first;
    grouped.push({
      id: solo.id,
      barName: solo.barName,
      location: solo.location,
      dateVisited: solo.dateVisited,
      tastingNotes: solo.tastingNotes,
      rater: solo.rater,
      rating: solo.rating,
    });
  }

  return grouped;
}

export function SearchScreen({ ratings }: SearchScreenProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('All');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ratings.filter((r) => {
      if (filter !== 'All' && r.rater !== filter) return false;
      if (!q) return true;
      return (
        r.barName.toLowerCase().includes(q) ||
        r.location.toLowerCase().includes(q) ||
        (r.tastingNotes ?? '').toLowerCase().includes(q)
      );
    });
  }, [ratings, query, filter]);

  const grouped = useMemo(() => groupByBar(filtered), [filtered]);
  const sorted = useMemo(
    () => [...grouped].sort((a, b) => b.dateVisited.localeCompare(a.dateVisited)),
    [grouped]
  );

  const totalUnique = useMemo(() => groupByBar(ratings).length, [ratings]);

  return (
    <div className="h-full flex flex-col bg-ih-bg dark:bg-ih-bg-dark">
      <div className="h-[env(safe-area-inset-top,20px)]" />

      <div className="px-6 pt-2 pb-3 flex items-baseline justify-between">
        <h1 className="text-[22px] font-bold text-ih-text dark:text-ih-text-dark">Search</h1>
        <span className="text-[13px] font-medium text-ih-text-muted dark:text-ih-text-muted-dark">
          {totalUnique} {totalUnique === 1 ? 'place' : 'places'}
        </span>
      </div>

      <div className="px-6">
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-ih-surface dark:bg-ih-surface-dark border border-ih-border dark:border-ih-border-dark">
          <SearchIcon className="w-[18px] h-[18px] text-ih-text-muted dark:text-ih-text-muted-dark flex-shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search bars, places, notes…"
            className="flex-1 bg-transparent text-[14px] text-ih-text dark:text-ih-text-dark placeholder:text-ih-text-muted dark:placeholder:text-ih-text-muted-dark focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-ih-text-muted dark:text-ih-text-muted-dark"
              aria-label="Clear search"
            >
              <X className="w-[18px] h-[18px]" />
            </button>
          )}
        </div>
      </div>

      <div className="px-6 pt-4">
        <FilterTabs activeFilter={filter} onFilterChange={setFilter} />
      </div>

      <div className="flex-1 overflow-auto hide-scrollbar px-6 pt-4 pb-2">
        <div className="flex items-center justify-between pb-2">
          <h2 className="text-xs font-semibold text-ih-text-secondary dark:text-ih-text-secondary-dark">
            {query ? 'Results' : 'Recent ratings'}
          </h2>
          <span className="text-xs font-medium text-ih-text-muted dark:text-ih-text-muted-dark">
            {query ? `${sorted.length} ${sorted.length === 1 ? 'match' : 'matches'}` : 'Latest'}
          </span>
        </div>

        {sorted.length === 0 ? (
          <div className="bg-ih-surface dark:bg-ih-surface-dark rounded-2xl p-8 text-center text-ih-text-muted dark:text-ih-text-muted-dark text-sm">
            {query ? `No results for "${query}"` : 'No ratings yet — add your first martini!'}
          </div>
        ) : (
          <div className="bg-ih-surface dark:bg-ih-surface-dark rounded-2xl divide-y overflow-hidden">
            {sorted.map((rating) => (
              <RatingCard
                key={rating.id}
                rating={rating}
                onClick={() => navigate(`/rating/${rating.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
