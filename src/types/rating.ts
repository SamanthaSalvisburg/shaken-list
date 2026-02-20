export type Rater = 'Sam' | 'Katie' | 'Both';

export interface Rating {
  id: string;
  barName: string;
  location: string;
  dateVisited: string;
  rating: number;
  tastingNotes: string;
  rater: Rater;
  price?: number;
  photoUrl?: string;
  photoPositionX?: number;
  photoPositionY?: number;
  createdAt: string;
}

export type FilterType = 'All' | 'Sam' | 'Katie' | 'Both';

export type SortType = 'date' | 'highest' | 'lowest' | 'sam' | 'katie' | 'both';

// A grouped rating combines Sam + Katie entries for the same bar into one row
export interface GroupedRating {
  barName: string;
  location: string;
  dateVisited: string;
  tastingNotes: string;
  // For "Both" rated entries
  rating?: number;
  rater: 'Both' | 'Split' | 'Sam' | 'Katie';
  // For split entries (separate Sam & Katie ratings)
  samRating?: number;
  katieRating?: number;
  // Keep original IDs for navigation
  id: string;
  samId?: string;
  katieId?: string;
}
