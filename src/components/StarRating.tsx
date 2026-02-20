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

  const handleClick = (index: number) => {
    if (interactive && onChange) {
      onChange(index + 1);
    }
  };

  return (
    <div className="flex gap-0.5">
      {[0, 1, 2, 3, 4].map((index) => (
        <button
          key={index}
          type="button"
          onClick={() => handleClick(index)}
          disabled={!interactive}
          className={`${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}`}
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
