import { useState, useRef } from 'react';
import { Camera, X, Loader2, Move } from 'lucide-react';
import { uploadPhoto } from '../lib/photoUpload';

interface PhotoUploadProps {
  value?: string;
  onChange: (url: string | undefined) => void;
  photoPositionX?: number;
  photoPositionY?: number;
  onPositionChange?: (x: number, y: number) => void;
}

export function PhotoUpload({ value, onChange, photoPositionX = 50, photoPositionY = 50, onPositionChange }: PhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [posX, setPosX] = useState(photoPositionX);
  const [posY, setPosY] = useState(photoPositionY);
  const [isDragging, setIsDragging] = useState(false);
  const [hasDragged, setHasDragged] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef<{ clientX: number; clientY: number; posX: number; posY: number } | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      const result = await uploadPhoto(file);
      onChange(result.url);
      // Reset position to center for new photo
      setPosX(50);
      setPosY(50);
      onPositionChange?.(50, 50);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  const handleRemove = () => {
    onChange(undefined);
    setError(null);
    setPosX(50);
    setPosY(50);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    containerRef.current?.setPointerCapture(e.pointerId);
    dragStart.current = { clientX: e.clientX, clientY: e.clientY, posX, posY };
    setIsDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !dragStart.current || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const dx = e.clientX - dragStart.current.clientX;
    const dy = e.clientY - dragStart.current.clientY;

    // Convert pixel delta to percentage, invert direction (drag right = show more left = decrease x%)
    const newX = Math.max(0, Math.min(100, dragStart.current.posX - (dx / rect.width) * 100));
    const newY = Math.max(0, Math.min(100, dragStart.current.posY - (dy / rect.height) * 100));

    setPosX(newX);
    setPosY(newY);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    containerRef.current?.releasePointerCapture(e.pointerId);
    setIsDragging(false);
    setHasDragged(true);
    dragStart.current = null;
    onPositionChange?.(posX, posY);
  };

  if (value) {
    return (
      <div
        ref={containerRef}
        className={`relative h-[120px] rounded-xl overflow-hidden select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <img
          src={value}
          alt="Rating photo"
          className="w-full h-full object-cover pointer-events-none"
          style={{ objectPosition: `${posX}% ${posY}%` }}
          draggable={false}
        />
        {/* Drag hint — fades after first drag */}
        {!hasDragged && (
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1.5 py-2 bg-gradient-to-t from-black/50 to-transparent pointer-events-none">
            <Move className="w-3 h-3 text-white" />
            <span className="text-white text-[11px] font-medium">Drag to reposition</span>
          </div>
        )}
        {/* Remove button */}
        <button
          type="button"
          onClick={handleRemove}
          className="absolute top-2 right-2 w-8 h-8 bg-black/60 dark:bg-black/70 rounded-full flex items-center justify-center"
        >
          <X className="w-4 h-4 text-white" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        id="photo-upload"
      />
      <label
        htmlFor="photo-upload"
        className={`h-[120px] rounded-xl border border-dashed border-ih-border dark:border-ih-border-dark bg-ih-surface-warm dark:bg-ih-surface-warm-dark flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-ih-accent transition-colors ${
          isUploading ? 'pointer-events-none opacity-50' : ''
        }`}
      >
        {isUploading ? (
          <>
            <Loader2 className="w-6 h-6 text-ih-text-muted dark:text-ih-text-muted-dark animate-spin" />
            <span className="text-sm text-ih-text-muted dark:text-ih-text-muted-dark">
              Uploading...
            </span>
          </>
        ) : (
          <>
            <Camera className="w-6 h-6 text-ih-text-muted dark:text-ih-text-muted-dark" />
            <span className="text-sm text-ih-text-muted dark:text-ih-text-muted-dark">
              Add photo
            </span>
          </>
        )}
      </label>
      {error && (
        <p className="text-xs text-ih-negative">{error}</p>
      )}
    </div>
  );
}
