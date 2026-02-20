import { GroupedRating } from '../types/rating';
import { StarRating } from './StarRating';
import { RaterBadge } from './RaterBadge';

interface RatingCardProps {
  rating: GroupedRating;
  onClick: () => void;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function RatingCard({ rating, onClick }: RatingCardProps) {
  const isSplit = rating.rater === 'Split';

  return (
    <button
      onClick={onClick}
      className="group w-full flex items-center gap-4 px-4 py-5 text-left hover:bg-[#F5EFE9] dark:hover:bg-ih-surface-warm-dark/50 hover:border-l-[3px] hover:border-ih-accent hover:pl-[13px] dark:hover:border-ih-accent transition-all"
    >
      <div className="flex-1 min-w-0">
        <div className="text-base font-medium text-ih-text dark:text-ih-text-dark truncate">
          {rating.barName}
        </div>
        <div className="text-sm text-ih-text-muted dark:text-ih-text-muted-dark group-hover:text-[#696560] dark:group-hover:text-ih-text-secondary-dark truncate">
          {rating.location}
        </div>
        <div className="text-sm text-ih-text-muted dark:text-ih-text-muted-dark group-hover:text-[#696560] dark:group-hover:text-ih-text-secondary-dark">
          {formatDate(rating.dateVisited)}
        </div>
      </div>
      {isSplit ? (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-3.5">
            <RaterBadge rater="Sam" />
            <StarRating rating={rating.samRating ?? 0} />
          </div>
          <div className="flex items-center gap-3.5">
            <RaterBadge rater="Katie" />
            <StarRating rating={rating.katieRating ?? 0} />
          </div>
        </div>
      ) : (
        <>
          <RaterBadge rater={rating.rater as 'Sam' | 'Katie' | 'Both'} />
          <StarRating rating={rating.rating ?? 0} />
        </>
      )}
    </button>
  );
}
