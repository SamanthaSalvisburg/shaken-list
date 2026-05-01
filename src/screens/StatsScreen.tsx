import { useMemo } from 'react';
import { Flame, MapPin, Sparkles, Star, Trophy, Martini } from 'lucide-react';
import { Rating } from '../types/rating';

interface StatsScreenProps {
  ratings: Rating[];
}

interface TopSpot {
  barName: string;
  visits: number;
  avg: number;
}

function calcStreak(ratings: Rating[]): number {
  if (ratings.length === 0) return 0;
  const days = new Set(ratings.map((r) => r.dateVisited));
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  // Start from today; if no rating today, start counting from yesterday so a streak isn't broken just because nothing was added today
  let cursor = new Date(today);
  if (!days.has(cursor.toISOString().slice(0, 10))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (days.has(cursor.toISOString().slice(0, 10))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function topSpots(ratings: Rating[]): TopSpot[] {
  const map = new Map<string, { name: string; visits: number; sum: number }>();
  for (const r of ratings) {
    const key = `${r.barName}|||${r.location}`;
    const entry = map.get(key) ?? { name: r.barName, visits: 0, sum: 0 };
    entry.visits++;
    entry.sum += r.rating;
    map.set(key, entry);
  }
  return Array.from(map.values())
    .map((e) => ({ barName: e.name, visits: e.visits, avg: e.sum / e.visits }))
    .sort((a, b) => b.visits - a.visits || b.avg - a.avg)
    .slice(0, 3);
}

function avgFor(ratings: Rating[], rater: 'Sam' | 'Katie'): number {
  const matches = ratings.filter((r) => r.rater === rater);
  if (matches.length === 0) return 0;
  return matches.reduce((s, r) => s + r.rating, 0) / matches.length;
}

export function StatsScreen({ ratings }: StatsScreenProps) {
  const stats = useMemo(() => {
    const total = ratings.length;
    const sum = ratings.reduce((s, r) => s + r.rating, 0);
    const avg = total > 0 ? sum / total : 0;
    const uniqueBars = new Set(ratings.map((r) => `${r.barName}|||${r.location}`)).size;
    const perfect5s = ratings.filter((r) => r.rating === 5).length;
    const samAvg = avgFor(ratings, 'Sam');
    const katieAvg = avgFor(ratings, 'Katie');
    const spots = topSpots(ratings);
    const streak = calcStreak(ratings);
    return { total, avg, uniqueBars, perfect5s, samAvg, katieAvg, spots, streak };
  }, [ratings]);

  const topAvg = stats.spots.length
    ? stats.spots.reduce((s, t) => s + t.avg, 0) / stats.spots.length
    : 0;

  // Sam vs Katie bar widths normalised to a 0-5 scale
  const samPct = (stats.samAvg / 5) * 100;
  const katiePct = (stats.katieAvg / 5) * 100;
  const diff = Math.abs(stats.samAvg - stats.katieAvg);
  const winner =
    stats.samAvg === 0 && stats.katieAvg === 0
      ? null
      : diff < 0.05
      ? 'Tie'
      : stats.samAvg > stats.katieAvg
      ? 'Sam'
      : 'Katie';

  return (
    <div className="h-full flex flex-col bg-ih-bg dark:bg-ih-bg-dark">
      <div className="h-[env(safe-area-inset-top,20px)]" />

      <div className="flex-1 overflow-auto hide-scrollbar">
        <div className="px-6 pt-2 pb-4 space-y-3.5">
          {/* Header */}
          <div className="flex items-end justify-between pb-1">
            <h1 className="text-[26px] font-bold text-ih-text dark:text-ih-text-dark tracking-tight">
              Your stats
            </h1>
            {stats.streak > 0 && (
              <div className="flex items-center gap-1 bg-ih-accent-soft px-2.5 py-1.5 rounded-full">
                <Flame className="w-3.5 h-3.5 text-ih-accent" fill="currentColor" />
                <span className="text-xs font-semibold text-ih-accent">
                  {stats.streak} day streak
                </span>
              </div>
            )}
          </div>

          {/* Hero card */}
          <div className="rounded-2xl bg-ih-accent px-5 py-5 flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <div className="text-[13px] font-medium text-white/80">Espresso martinis</div>
              <div className="text-[56px] leading-none font-bold text-white tracking-tight">
                {stats.total}
              </div>
            </div>
            <div className="w-20 h-20 rounded-full bg-white/15 flex items-center justify-center flex-shrink-0">
              <Martini className="w-11 h-11 text-white" strokeWidth={1.75} />
            </div>
          </div>

          {/* Stat tiles */}
          <div className="flex gap-2.5">
            <StatTile
              icon={<Star className="w-3.5 h-3.5 text-ih-accent" fill="currentColor" />}
              label="Avg rating"
              value={stats.total > 0 ? stats.avg.toFixed(1) : '—'}
            />
            <StatTile
              icon={<MapPin className="w-3.5 h-3.5 text-ih-accent" />}
              label="Bars visited"
              value={stats.uniqueBars}
            />
            <StatTile
              icon={<Sparkles className="w-3.5 h-3.5 text-ih-accent" />}
              label="Perfect 5s"
              value={stats.perfect5s}
            />
          </div>

          {/* Top spots */}
          <div className="rounded-2xl bg-ih-surface dark:bg-ih-surface-dark p-4 space-y-3.5">
            <div className="flex items-center justify-between">
              <h2 className="text-[15px] font-semibold text-ih-text dark:text-ih-text-dark">
                Top spots
              </h2>
              {stats.spots.length > 0 && (
                <span className="text-xs font-medium text-ih-text-muted dark:text-ih-text-muted-dark">
                  {topAvg.toFixed(1)} avg
                </span>
              )}
            </div>
            {stats.spots.length === 0 ? (
              <div className="text-sm text-ih-text-muted dark:text-ih-text-muted-dark">
                No spots yet — add a rating to see your top picks.
              </div>
            ) : (
              stats.spots.map((spot, idx) => (
                <div key={spot.barName + idx} className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold ${
                      idx === 0
                        ? 'bg-ih-accent text-white'
                        : 'bg-ih-accent-soft text-ih-accent'
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-ih-text dark:text-ih-text-dark truncate">
                      {spot.barName}
                    </div>
                    <div className="text-xs text-ih-text-muted dark:text-ih-text-muted-dark">
                      {spot.visits} {spot.visits === 1 ? 'visit' : 'visits'}
                    </div>
                  </div>
                  <div className="text-[15px] font-bold text-ih-accent flex-shrink-0">
                    {spot.avg.toFixed(1)}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Sam vs Katie */}
          <div className="rounded-2xl bg-ih-surface dark:bg-ih-surface-dark px-4 py-4 space-y-3.5">
            <h2 className="text-[15px] font-semibold text-ih-text dark:text-ih-text-dark">
              Sam vs Katie
            </h2>
            <RaterRow name="Sam" pct={samPct} value={stats.samAvg} highlight />
            <RaterRow name="Katie" pct={katiePct} value={stats.katieAvg} />
            {winner && (
              <div className="flex items-center gap-1.5 bg-ih-bg dark:bg-ih-bg-dark rounded-lg px-3 py-2 self-start w-fit">
                <Trophy className="w-3.5 h-3.5 text-ih-accent" />
                <span className="text-xs font-medium text-ih-text-secondary dark:text-ih-text-secondary-dark">
                  {winner === 'Tie'
                    ? "Neck and neck!"
                    : `${winner} is winning by ${diff.toFixed(1)} stars`}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatTile({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex-1 rounded-2xl bg-ih-surface dark:bg-ih-surface-dark p-3 flex flex-col gap-1 min-w-0">
      <div className="flex items-center gap-1">
        <span className="flex-shrink-0">{icon}</span>
        <span className="text-[11px] font-medium text-ih-text-secondary dark:text-ih-text-secondary-dark truncate">
          {label}
        </span>
      </div>
      <div className="text-[24px] font-bold text-ih-text dark:text-ih-text-dark tracking-tight">
        {value}
      </div>
    </div>
  );
}

function RaterRow({
  name,
  pct,
  value,
  highlight = false,
}: {
  name: string;
  pct: number;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-[13px] font-semibold text-ih-text dark:text-ih-text-dark w-12 flex-shrink-0">
        {name}
      </span>
      <div className="flex-1 h-3.5 rounded-full bg-ih-bg dark:bg-ih-bg-dark overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            highlight ? 'bg-ih-accent' : 'bg-ih-accent-soft'
          }`}
          style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
        />
      </div>
      <span
        className={`text-[13px] font-bold flex-shrink-0 w-8 text-right ${
          highlight
            ? 'text-ih-accent'
            : 'text-ih-text dark:text-ih-text-dark'
        }`}
      >
        {value > 0 ? value.toFixed(1) : '—'}
      </span>
    </div>
  );
}
