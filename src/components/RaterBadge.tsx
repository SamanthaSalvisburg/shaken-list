import { Rater } from '../types/rating';

interface RaterBadgeProps {
  rater: Rater;
  size?: 'sm' | 'md';
  accent?: boolean;
}

export function RaterBadge({ rater, size = 'sm', accent = false }: RaterBadgeProps) {
  const useAccent = accent || rater === 'Both';

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-1',
    md: 'text-sm px-3.5 py-2',
  };

  return (
    <span
      className={`rounded-lg font-medium ${sizeClasses[size]} ${
        useAccent
          ? 'bg-ih-accent-soft text-ih-accent-text'
          : 'bg-ih-surface-warm dark:bg-ih-surface-warm-dark text-ih-text-secondary dark:text-ih-text-secondary-dark'
      }`}
    >
      {rater}
    </span>
  );
}
