import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  size?: 'sm' | 'md' | 'lg';
  onChange?: (rating: number) => void;
  interactive?: boolean;
}

export function StarRating({ rating, size = 'sm', onChange, interactive = false }: StarRatingProps) {
  const sizeClasses = {
    sm: 'w-3.5 h-3.5',
    md: 'w-5 h-5',
    lg: 'w-7 h-7',
  };

  if (!interactive) {
    return (
      <div className="flex gap-0.5" role="img" aria-label={`${rating} out of 5 stars`}>
        {[0, 1, 2, 3, 4].map((index) => (
          <Star
            key={index}
            className={`${sizeClasses[size]} ${
              index < rating
                ? 'fill-ih-accent text-ih-accent'
                : 'fill-transparent text-ih-border dark:text-ih-border-dark'
            }`}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-0.5">
      {[0, 1, 2, 3, 4].map((index) => (
        <button
          key={index}
          type="button"
          onClick={() => onChange?.(index + 1)}
          aria-label={`Rate ${index + 1} ${index === 0 ? 'star' : 'stars'}`}
          className="cursor-pointer hover:scale-110 transition-transform"
        >
          <Star
            className={`${sizeClasses[size]} ${
              index < rating
                ? 'fill-ih-accent text-ih-accent'
                : 'fill-transparent text-ih-border dark:text-ih-border-dark'
            }`}
          />
        </button>
      ))}
    </div>
  );
}
