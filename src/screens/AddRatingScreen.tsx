import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar } from 'lucide-react';
import { Rating, Rater } from '../types/rating';
import { StarRating } from '../components/StarRating';
import { PlacesAutocomplete } from '../components/PlacesAutocomplete';
import { PhotoUpload } from '../components/PhotoUpload';

type RaterMode = 'Both' | 'S+K' | 'Sam' | 'Katie';

interface AddRatingScreenProps {
  onSave: (rating: {
    barName: string;
    location: string;
    dateVisited: string;
    rating: number;
    tastingNotes: string;
    rater: Rater;
    price?: number;
    photoUrl?: string;
  }) => Promise<unknown>;
  onUpdate?: (id: string, updates: Partial<Rating>) => Promise<void>;
  getRating?: (id: string) => Rating | undefined;
  ratings?: Rating[];
}

export function AddRatingScreen({ onSave, onUpdate, getRating, ratings }: AddRatingScreenProps) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const existingRating = id && getRating ? getRating(id) : undefined;
  const isEditing = !!existingRating;

  // Find partner rating (Sam↔Katie) at the same bar+location when editing
  const partnerRating = existingRating && ratings
    ? ratings.find(
        (r) =>
          r.id !== existingRating.id &&
          r.barName === existingRating.barName &&
          r.location === existingRating.location &&
          r.tastingNotes === existingRating.tastingNotes &&
          ((existingRating.rater === 'Sam' && r.rater === 'Katie') ||
            (existingRating.rater === 'Katie' && r.rater === 'Sam'))
      )
    : undefined;

  // Determine initial rater mode: if editing a split pair, start in S+K mode
  const initialRaterMode = (): RaterMode => {
    if (existingRating && partnerRating) return 'S+K';
    return existingRating?.rater || 'Both';
  };

  const [barName, setBarName] = useState(existingRating?.barName || '');
  const [location, setLocation] = useState(existingRating?.location || '');
  const [dateVisited, setDateVisited] = useState(
    existingRating?.dateVisited || new Date().toISOString().split('T')[0]
  );
  const [rating, setRating] = useState(existingRating?.rating || 0);
  const [tastingNotes, setTastingNotes] = useState(existingRating?.tastingNotes || '');
  const [raterMode, setRaterMode] = useState<RaterMode>(initialRaterMode);
  const [price, setPrice] = useState(existingRating?.price?.toString() || '');
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(existingRating?.photoUrl);
  const [isSaving, setIsSaving] = useState(false);

  // S+K mode: separate ratings for Sam and Katie
  // Pre-populate from existing split pair when editing
  const getInitialSamRating = () => {
    if (!existingRating || !partnerRating) return 0;
    if (existingRating.rater === 'Sam') return existingRating.rating;
    return partnerRating.rating;
  };
  const getInitialKatieRating = () => {
    if (!existingRating || !partnerRating) return 0;
    if (existingRating.rater === 'Katie') return existingRating.rating;
    return partnerRating.rating;
  };
  const [samRating, setSamRating] = useState(getInitialSamRating);
  const [katieRating, setKatieRating] = useState(getInitialKatieRating);

  const isSplitMode = raterMode === 'S+K';

  // Map raterMode to actual Rater for DB
  const getDbRater = (): Rater => {
    if (raterMode === 'S+K') return 'Sam'; // handled specially
    return raterMode;
  };

  const isFormValid = () => {
    if (!barName || !location || isSaving) return false;
    if (isSplitMode) {
      return samRating > 0 && katieRating > 0;
    }
    return rating > 0;
  };

  const handleSubmit = async () => {
    if (!isFormValid()) return;

    setIsSaving(true);
    try {
      if (isEditing && onUpdate) {
        if (isSplitMode && partnerRating) {
          // Update both Sam and Katie entries
          const samId = existingRating.rater === 'Sam' ? existingRating.id : partnerRating.id;
          const katieId = existingRating.rater === 'Katie' ? existingRating.id : partnerRating.id;
          const shared = {
            barName,
            location,
            dateVisited,
            tastingNotes,
            price: price ? parseFloat(price) : undefined,
            photoUrl,
          };
          await onUpdate(samId, { ...shared, rating: samRating, rater: 'Sam' });
          await onUpdate(katieId, { ...shared, rating: katieRating, rater: 'Katie' });
        } else {
          await onUpdate(existingRating.id, {
            barName,
            location,
            dateVisited,
            rating,
            tastingNotes,
            rater: getDbRater(),
            price: price ? parseFloat(price) : undefined,
            photoUrl,
          });
        }
        navigate(`/rating/${existingRating.id}`);
      } else if (isSplitMode) {
        // Create two separate entries for Sam and Katie
        await onSave({
          barName,
          location,
          dateVisited,
          rating: samRating,
          tastingNotes,
          rater: 'Sam',
          price: price ? parseFloat(price) : undefined,
          photoUrl,
        });
        await onSave({
          barName,
          location,
          dateVisited,
          rating: katieRating,
          tastingNotes,
          rater: 'Katie',
          price: price ? parseFloat(price) : undefined,
          photoUrl,
        });
        navigate('/');
      } else {
        await onSave({
          barName,
          location,
          dateVisited,
          rating,
          tastingNotes,
          rater: getDbRater(),
          price: price ? parseFloat(price) : undefined,
          photoUrl,
        });
        navigate('/');
      }
    } catch (err) {
      console.error('Failed to save rating:', err);
      setIsSaving(false);
    }
  };

  const handlePlaceSelect = (place: { name: string; address: string }) => {
    // Auto-fill the bar name if it's empty
    if (!barName) {
      setBarName(place.name);
    }
  };

  const raterModes: RaterMode[] = ['Both', 'S+K', 'Sam', 'Katie'];

  return (
    <div className="h-full flex flex-col bg-ih-bg dark:bg-ih-bg-dark overflow-auto">
      {/* Safe area spacer */}
      <div className="h-[env(safe-area-inset-top,20px)]" />

      {/* Content */}
      <div className="px-6 py-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => isEditing ? navigate(`/rating/${existingRating.id}`) : navigate('/')}
            className="w-11 h-11 bg-ih-surface dark:bg-ih-surface-dark rounded-xl flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-ih-text dark:text-ih-text-dark" />
          </button>
          <h1 className="text-lg font-semibold text-ih-text dark:text-ih-text-dark">{isEditing ? 'Edit rating' : 'Add rating'}</h1>
          <div className="w-11 h-11" />
        </div>

        {/* Form Card */}
        <div className="bg-ih-surface dark:bg-ih-surface-dark rounded-2xl p-5 space-y-5">
          {/* Location - Now first with Places Autocomplete */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-ih-text dark:text-ih-text-dark">Search bar or restaurant</label>
            <PlacesAutocomplete
              value={location}
              onChange={setLocation}
              onPlaceSelect={handlePlaceSelect}
              placeholder="Search for a bar..."
            />
          </div>

          {/* Bar Name */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-ih-text dark:text-ih-text-dark">Bar name</label>
            <input
              type="text"
              value={barName}
              onChange={(e) => setBarName(e.target.value)}
              placeholder="Enter bar name"
              className="w-full px-4 py-3 rounded-xl border border-ih-border-strong dark:border-ih-border-strong-dark bg-transparent text-ih-text dark:text-ih-text-dark placeholder:text-ih-text-muted dark:placeholder:text-ih-text-muted-dark focus:outline-none focus:border-ih-accent"
            />
          </div>

          {/* Date */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-ih-text dark:text-ih-text-dark">Date visited</label>
            <div className="relative">
              <input
                type="date"
                value={dateVisited}
                onChange={(e) => setDateVisited(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-ih-border-strong dark:border-ih-border-strong-dark bg-transparent text-ih-text dark:text-ih-text-dark focus:outline-none focus:border-ih-accent appearance-none"
              />
              <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-ih-text-muted dark:text-ih-text-muted-dark pointer-events-none" />
            </div>
          </div>

          {/* Who rated it */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-ih-text dark:text-ih-text-dark">Who rated it?</label>
            <div className="flex gap-2">
              {raterModes.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRaterMode(r)}
                  className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-colors ${
                    raterMode === r
                      ? 'bg-ih-accent text-white'
                      : 'bg-ih-surface dark:bg-ih-surface-dark border border-ih-border dark:border-ih-border-dark text-ih-text dark:text-ih-text-dark'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Rating - Single mode */}
          {!isSplitMode && (
            <div className="space-y-3">
              <label className="text-sm font-semibold text-ih-text dark:text-ih-text-dark">Rating</label>
              <StarRating
                rating={rating}
                size="lg"
                interactive
                onChange={setRating}
              />
            </div>
          )}

          {/* Ratings - S+K split mode: stacked cards */}
          {isSplitMode && (
            <div className="space-y-3">
              <label className="text-sm font-semibold text-ih-text dark:text-ih-text-dark">Ratings</label>

              {/* Sam Card */}
              <div className="flex items-center gap-3.5 rounded-[14px] bg-ih-surface-warm dark:bg-ih-surface-warm-dark border border-ih-border dark:border-ih-border-dark px-4 py-3.5">
                <span className="rounded-lg bg-ih-accent-soft px-3 py-1 text-[13px] font-semibold text-ih-accent-text">
                  Sam
                </span>
                <StarRating
                  rating={samRating}
                  size="lg"
                  interactive
                  onChange={setSamRating}
                />
              </div>

              {/* Katie Card */}
              <div className="flex items-center gap-3.5 rounded-[14px] bg-ih-surface-warm dark:bg-ih-surface-warm-dark border border-ih-border dark:border-ih-border-dark px-4 py-3.5">
                <span className="rounded-lg bg-ih-accent-soft px-3 py-1 text-[13px] font-semibold text-ih-accent-text">
                  Katie
                </span>
                <StarRating
                  rating={katieRating}
                  size="lg"
                  interactive
                  onChange={setKatieRating}
                />
              </div>
            </div>
          )}

          {/* Tasting Notes */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-ih-text dark:text-ih-text-dark">Tasting notes</label>
            <textarea
              value={tastingNotes}
              onChange={(e) => setTastingNotes(e.target.value)}
              placeholder="How was the espresso martini?"
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-ih-border-strong dark:border-ih-border-strong-dark bg-transparent text-ih-text dark:text-ih-text-dark placeholder:text-ih-text-muted dark:placeholder:text-ih-text-muted-dark focus:outline-none focus:border-ih-accent resize-none"
            />
          </div>
        </div>

        {/* Optional Section */}
        <div className="space-y-3.5">
          <h2 className="text-sm font-semibold text-ih-text dark:text-ih-text-dark">Optional</h2>
          <div className="bg-ih-surface dark:bg-ih-surface-dark rounded-2xl p-5 space-y-5">
            {/* Price */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-ih-text dark:text-ih-text-dark">Price</label>
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-ih-border-strong dark:border-ih-border-strong-dark">
                <span className="text-ih-text-muted dark:text-ih-text-muted-dark font-medium">$</span>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  className="flex-1 bg-transparent text-ih-text dark:text-ih-text-dark placeholder:text-ih-text-muted dark:placeholder:text-ih-text-muted-dark focus:outline-none"
                />
              </div>
            </div>

            {/* Photo Upload */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-ih-text dark:text-ih-text-dark">Photo</label>
              <PhotoUpload value={photoUrl} onChange={setPhotoUrl} />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSubmit}
          disabled={!isFormValid()}
          className="w-full py-4 rounded-2xl bg-ih-accent text-white font-semibold text-base disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? 'Saving...' : isEditing ? 'Update rating' : 'Save rating'}
        </button>
      </div>

      {/* Safe area spacer for bottom */}
      <div className="h-[env(safe-area-inset-bottom,20px)]" />
    </div>
  );
}
