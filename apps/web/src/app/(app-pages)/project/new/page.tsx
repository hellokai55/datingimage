'use client';

import { Button } from '@/components/ui/button';
import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Upload,
  X,
  Camera,
  AlertCircle,
  ImagePlus,
  ChevronRight,
  Check,
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

const MAX_FILES = 10;
const MIN_FILES = 5;
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

const STEPS = ['Upload', 'Scene', 'Generate'];

export default function UploadPage() {
  const [files, setFiles] = useState<
    Array<{ file: File; preview: string; id: string }>
  >([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      setError('');
      const newFiles = acceptedFiles
        .filter((file) => file.size <= MAX_SIZE)
        .map((file) => ({
          file,
          preview: URL.createObjectURL(file),
          id: Math.random().toString(36).substring(7),
        }));

      setFiles((prev) => {
        const combined = [...prev, ...newFiles];
        if (combined.length > MAX_FILES) {
          setError(`Maximum ${MAX_FILES} photos allowed`);
          return combined.slice(0, MAX_FILES);
        }
        return combined;
      });
    },
    []
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'] },
    maxSize: MAX_SIZE,
    noClick: files.length >= MAX_FILES,
  });

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleContinue = async () => {
    if (files.length < MIN_FILES) {
      setError(`Please upload at least ${MIN_FILES} photos`);
      return;
    }
    setUploading(true);
    setError('');

    try {
      // Upload files to Supabase Storage using presigned URLs
      const uploadedPaths: string[] = [];

      for (const { file } of files) {
        // 1. Get presigned URL
        const presignRes = await fetch('/api/upload/presigned', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: file.name,
            contentType: file.type,
          }),
        });

        if (!presignRes.ok) {
          throw new Error('Failed to get upload URL');
        }

        const { signedUrl, path } = await presignRes.json();

        // 2. Upload file
        const uploadRes = await fetch(signedUrl, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': file.type },
        });

        if (!uploadRes.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }

        uploadedPaths.push(path);
      }

      // Store paths for next step
      sessionStorage.setItem('uploadPaths', JSON.stringify(uploadedPaths));
      router.push('/project/new/scene');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Upload failed. Please try again.'
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-5 py-10 md:px-8 md:py-14">
      {/* Step Indicator */}
      <div className="mb-10">
        <div className="flex items-center justify-between">
          {STEPS.map((step, i) => (
            <div key={step} className="flex flex-1 items-center">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold transition-colors ${
                    i === 0
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-muted/50 text-muted-foreground'
                  }`}
                >
                  {i === 0 ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                <span
                  className={`hidden text-sm font-medium sm:block ${
                    i === 0
                      ? 'text-foreground'
                      : 'text-muted-foreground'
                  }`}
                >
                  {step}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className="mx-4 h-px flex-1 bg-border/70" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Header */}
      <div className="mb-6">
        <h1 className="flex items-center gap-2.5 text-xl font-semibold tracking-tight text-foreground">
          <Camera className="h-5 w-5 text-muted-foreground" />
          Upload your selfies
        </h1>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          Upload {MIN_FILES} to {MAX_FILES} clear photos of yourself. We use
          these to generate your portraits.
        </p>
      </div>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`group relative cursor-pointer rounded-xl border-2 border-dashed p-10 text-center transition-all duration-300 md:p-12 ${
          isDragActive
            ? 'border-primary bg-primary/[0.03] shadow-sm'
            : files.length >= MAX_FILES
              ? 'cursor-not-allowed border-border/40 bg-muted/20 opacity-60'
              : 'border-border/80 bg-background hover:border-primary/40 hover:bg-muted/20'
        }`}
      >
        <input {...getInputProps()} />
        <div
          className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border transition-colors duration-300 ${
            isDragActive
              ? 'border-primary/30 bg-primary/10'
              : 'border-border/80 bg-muted/50 group-hover:border-primary/20 group-hover:bg-muted'
          }`}
        >
          {files.length >= MAX_FILES ? (
            <Camera className="h-6 w-6 text-muted-foreground" />
          ) : (
            <Upload
              className={`h-6 w-6 transition-colors duration-300 ${
                isDragActive ? 'text-primary' : 'text-muted-foreground'
              }`}
            />
          )}
        </div>
        <p className="text-sm font-medium text-foreground">
          {files.length >= MAX_FILES
            ? 'Maximum photos reached'
            : isDragActive
              ? 'Drop photos here'
              : 'Drag & drop photos here'}
        </p>
        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
          {files.length >= MAX_FILES
            ? 'Remove a photo to add more'
            : 'JPG or PNG, up to 10MB each'}
        </p>
        {files.length < MAX_FILES && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-5 h-9 gap-1.5 rounded-lg px-4 text-xs font-medium"
            onClick={(e) => {
              e.stopPropagation();
              open();
            }}
          >
            <ImagePlus className="h-3.5 w-3.5" />
            Browse files
          </Button>
        )}
      </div>

      {/* Preview Grid */}
      {files.length > 0 && (
        <div className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Selected photos
            </span>
            <span className="text-xs tabular-nums text-muted-foreground">
              {files.length} / {MAX_FILES}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
            {files.map(({ preview, id }, idx) => (
              <div
                key={id}
                className="group relative aspect-square overflow-hidden rounded-lg border border-border/60 bg-muted/30"
              >
                <Image
                  src={preview}
                  alt={`Preview ${idx + 1}`}
                  fill
                  sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, 20vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <button
                  onClick={() => removeFile(id)}
                  className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 shadow-sm backdrop-blur-sm transition-all duration-200 hover:bg-black/80 group-hover:opacity-100"
                  aria-label="Remove photo"
                >
                  <X className="h-3 w-3" strokeWidth={2.5} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Minimum files hint */}
      {files.length > 0 && files.length < MIN_FILES && !error && (
        <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50/60 px-4 py-3 dark:border-amber-900/40 dark:bg-amber-950/20">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <p className="text-xs leading-relaxed text-amber-800 dark:text-amber-300">
            Please upload at least {MIN_FILES} photos to continue. You currently
            have {files.length}.
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50/60 px-4 py-3 dark:border-red-900/40 dark:bg-red-950/20">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
          <p className="text-xs leading-relaxed text-red-800 dark:text-red-300">
            {error}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="mt-8 flex items-center justify-between border-t border-border/60 pt-6">
        <p className="text-xs text-muted-foreground">
          {files.length >= MIN_FILES ? (
            <span className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              Ready to continue
            </span>
          ) : (
            `${MIN_FILES} photos required`
          )}
        </p>
        <Button
          onClick={handleContinue}
          disabled={files.length < MIN_FILES || uploading}
          className="h-10 gap-1.5 rounded-lg px-6 text-sm font-medium"
        >
          {uploading ? 'Processing...' : 'Continue'}
          {!uploading && <ChevronRight className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
