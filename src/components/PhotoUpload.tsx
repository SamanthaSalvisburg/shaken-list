import { useState, useRef } from 'react';
import { Camera, X, Loader2 } from 'lucide-react';
import { uploadPhoto } from '../lib/photoUpload';

interface PhotoUploadProps {
  value?: string;
  onChange: (url: string | undefined) => void;
}

export function PhotoUpload({ value, onChange }: PhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      const result = await uploadPhoto(file);
      onChange(result.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
      // Reset input so same file can be selected again
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  const handleRemove = () => {
    onChange(undefined);
    setError(null);
  };

  if (value) {
    return (
      <div className="relative h-[120px] rounded-xl overflow-hidden">
        <img
          src={value}
          alt="Rating photo"
          className="w-full h-full object-cover"
        />
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
