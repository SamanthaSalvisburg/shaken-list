import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Pencil, MapPin, Calendar, Trash2 } from 'lucide-react';
import { Rating } from '../types/rating';
import { StarRating } from '../components/StarRating';
import { RaterBadge } from '../components/RaterBadge';

interface RatingDetailScreenProps {
  getRating: (id: string) => Rating | undefined;
  ratings: Rating[];
  onDelete: (id: string) => Promise<void>;
}

export function RatingDetailScreen({ getRating, ratings, onDelete }: RatingDetailScreenProps) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const rating = id ? getRating(id) : undefined;

  // Find partner rating (Sam↔Katie) at the same bar+location
  const partnerRating = rating
    ? ratings.find(
        (r) =>
          r.id !== rating.id &&
          r.barName === rating.barName &&
          r.location === rating.location &&
          ((rating.rater === 'Sam' && r.rater === 'Katie') ||
            (rating.rater === 'Katie' && r.rater === 'Sam'))
      )
    : undefined;

  const isSplit = !!partnerRating;

  if (!rating) {
    return (
      <div className="h-full flex items-center justify-center bg-ih-bg dark:bg-ih-bg-dark">
        <p className="text-ih-text-muted dark:text-ih-text-muted-dark">Rating not found</p>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this rating?')) {
      await onDelete(rating.id);
      navigate('/');
    }
  };

  const combinedNotes = [rating.tastingNotes, partnerRating?.tastingNotes]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="h-full flex flex-col bg-ih-bg dark:bg-ih-bg-dark">
      {/* Safe area spacer */}
      <div className="h-[env(safe-area-inset-top,20px)]" />

      {/* Scrollable Content */}
      <div className="flex-1 overflow-auto hide-scrollbar">
        <div className="px-6 space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/')}
              className="w-11 h-11 bg-ih-surface dark:bg-ih-surface-dark rounded-xl flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5 text-ih-text dark:text-ih-text-dark" />
            </button>
            <h1 className="text-lg font-semibold text-ih-text dark:text-ih-text-dark">
              Rating details
            </h1>
            <button
              onClick={() => navigate(`/rating/${rating.id}/edit`)}
              className="w-11 h-11 bg-ih-surface dark:bg-ih-surface-dark rounded-xl flex items-center justify-center"
            >
              <Pencil className="w-5 h-5 text-ih-text dark:text-ih-text-dark" />
            </button>
          </div>

          {/* Photo Card */}
          {rating.photoUrl && (
            <div className="h-[200px] rounded-2xl overflow-hidden">
              <img
                src={rating.photoUrl}
                alt={`${rating.barName} espresso martini`}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Hero Info Card */}
          <div className="bg-ih-surface dark:bg-ih-surface-dark rounded-2xl px-5 py-6 space-y-4">
            {/* Bar name */}
            <h2 className="text-[26px] font-semibold text-ih-text dark:text-ih-text-dark tracking-tight">
              {rating.barName}
            </h2>

            {/* Location */}
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-ih-text-muted dark:text-ih-text-muted-dark" />
              <span className="text-sm text-ih-text-secondary dark:text-ih-text-secondary-dark">
                {rating.location}
              </span>
            </div>

            {/* Divider */}
            <div className="h-px bg-ih-border dark:bg-ih-border-dark" />

            {/* Rating row(s) — stars left, badge right */}
            {isSplit ? (
              <div className="space-y-3">
                {/* Sam row (or whichever is the current rating) */}
                <div className="flex items-center justify-between">
                  <StarRating rating={rating.rating} size="md" />
                  <RaterBadge rater={rating.rater} size="md" accent />
                </div>
                {/* Partner row */}
                <div className="flex items-center justify-between">
                  <StarRating rating={partnerRating!.rating} size="md" />
                  <RaterBadge rater={partnerRating!.rater} size="md" accent />
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <StarRating rating={rating.rating} size="md" />
                <RaterBadge rater={rating.rater} size="md" />
              </div>
            )}

            {/* Date */}
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-ih-text-muted dark:text-ih-text-muted-dark" />
              <span className="text-sm text-ih-text-secondary dark:text-ih-text-secondary-dark">
                {formatDate(rating.dateVisited)}
              </span>
            </div>
          </div>

          {/* Tasting Notes */}
          {combinedNotes && (
            <div className="space-y-3.5">
              <h3 className="text-sm font-semibold text-ih-text dark:text-ih-text-dark">
                Tasting notes
              </h3>
              <div className="bg-ih-surface dark:bg-ih-surface-dark rounded-2xl p-5">
                <p className="text-sm text-ih-text-secondary dark:text-ih-text-secondary-dark leading-relaxed">
                  {combinedNotes}
                </p>
              </div>
            </div>
          )}

          {/* Delete Button */}
          <button
            onClick={handleDelete}
            className="w-full py-4 rounded-2xl bg-ih-surface dark:bg-ih-surface-dark border border-ih-negative text-ih-negative font-semibold text-base flex items-center justify-center gap-2"
          >
            <Trash2 className="w-[18px] h-[18px]" />
            Delete rating
          </button>

          {/* Bottom spacing */}
          <div className="h-2" />
        </div>
      </div>

      {/* Safe area spacer for bottom */}
      <div className="h-[env(safe-area-inset-bottom,20px)]" />
    </div>
  );
}
