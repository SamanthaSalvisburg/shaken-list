import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Rating, Rater } from '../types/rating';

const STORAGE_KEY = 'shaken-list-ratings';

// Helper to convert database row to Rating type
function dbRowToRating(row: {
  id: string;
  bar_name: string;
  location: string;
  date_visited: string;
  rating: number;
  tasting_notes: string | null;
  rater: string;
  price: number | null;
  photo_url: string | null;
  created_at: string;
}): Rating {
  return {
    id: row.id,
    barName: row.bar_name,
    location: row.location,
    dateVisited: row.date_visited,
    rating: row.rating,
    tastingNotes: row.tasting_notes || '',
    rater: row.rater as Rater,
    price: row.price ?? undefined,
    photoUrl: row.photo_url ?? undefined,
    createdAt: row.created_at,
  };
}

// Helper to convert Rating to database insert format
function ratingToDbInsert(rating: Omit<Rating, 'id' | 'createdAt'>) {
  return {
    bar_name: rating.barName,
    location: rating.location,
    date_visited: rating.dateVisited,
    rating: rating.rating,
    tasting_notes: rating.tastingNotes || null,
    rater: rating.rater,
    price: rating.price ?? null,
    photo_url: rating.photoUrl ?? null,
  };
}

export function useRatings() {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all ratings from Supabase
  const fetchRatings = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('ratings')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const fetchedRatings = (data || []).map(dbRowToRating);
      setRatings(fetchedRatings);

      // Cache in localStorage for offline support
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fetchedRatings));
      setError(null);
    } catch (err) {
      console.error('Failed to fetch ratings:', err);
      setError('Failed to load ratings. Using cached data.');

      // Fall back to localStorage
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        try {
          setRatings(JSON.parse(cached));
        } catch {
          setRatings([]);
        }
      }
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchRatings();
  }, [fetchRatings]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('ratings-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ratings' },
        () => {
          // Refetch all ratings on any change
          fetchRatings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchRatings]);

  const addRating = async (rating: Omit<Rating, 'id' | 'createdAt'>) => {
    const insertData = ratingToDbInsert(rating);

    const { data, error: insertError } = await supabase
      .from('ratings')
      .insert(insertData)
      .select()
      .single();

    if (insertError) {
      throw new Error(`Failed to save rating: ${insertError.message}`);
    }

    const newRating = dbRowToRating(data);
    setRatings((prev) => [newRating, ...prev]);
    return newRating;
  };

  const updateRating = async (id: string, updates: Partial<Rating>) => {
    const updateData: Record<string, unknown> = {};

    if (updates.barName !== undefined) updateData.bar_name = updates.barName;
    if (updates.location !== undefined) updateData.location = updates.location;
    if (updates.dateVisited !== undefined) updateData.date_visited = updates.dateVisited;
    if (updates.rating !== undefined) updateData.rating = updates.rating;
    if (updates.tastingNotes !== undefined) updateData.tasting_notes = updates.tastingNotes;
    if (updates.rater !== undefined) updateData.rater = updates.rater;
    if (updates.price !== undefined) updateData.price = updates.price;
    if (updates.photoUrl !== undefined) updateData.photo_url = updates.photoUrl;

    const { error: updateError } = await supabase
      .from('ratings')
      .update(updateData)
      .eq('id', id);

    if (updateError) {
      throw new Error(`Failed to update rating: ${updateError.message}`);
    }

    setRatings((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updates } : r))
    );
  };

  const deleteRating = async (id: string) => {
    const { error: deleteError } = await supabase
      .from('ratings')
      .delete()
      .eq('id', id);

    if (deleteError) {
      throw new Error(`Failed to delete rating: ${deleteError.message}`);
    }

    setRatings((prev) => prev.filter((r) => r.id !== id));
  };

  const getRating = (id: string) => {
    return ratings.find((r) => r.id === id);
  };

  const getStats = () => {
    if (ratings.length === 0) {
      return { averageRating: 0, totalMartinis: 0 };
    }
    const totalRating = ratings.reduce((sum, r) => sum + r.rating, 0);
    return {
      averageRating: Math.round((totalRating / ratings.length) * 10) / 10,
      totalMartinis: ratings.length,
    };
  };

  return {
    ratings,
    isLoaded,
    error,
    addRating,
    updateRating,
    deleteRating,
    getRating,
    getStats,
    refetch: fetchRatings,
  };
}
