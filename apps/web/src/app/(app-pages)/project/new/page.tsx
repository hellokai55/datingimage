'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Camera, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

const MAX_FILES = 10;
const MIN_FILES = 5;
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export default function UploadPage() {
  const [files, setFiles] = useState<Array<{ file: File; preview: string; id: string }>>([]);
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

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'] },
    maxSize: MAX_SIZE,
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
      setError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl p-4 md:p-8">
      {/* Step Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {['Upload', 'Scene', 'Generate'].map((step, i) => (
            <div key={step} className="flex items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                  i === 0
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {i + 1}
              </div>
              <span
                className={`ml-2 text-sm ${
                  i === 0 ? 'font-medium' : 'text-muted-foreground'
                }`}
              >
                {step}
              </span>
              {i < 2 && (
                <div className="mx-4 h-px w-12 bg-border" />
              )}
            </div>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Upload Your Selfies
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
              isDragActive
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-2 text-sm font-medium">
              {isDragActive ? 'Drop photos here' : 'Drag & drop photos here'}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              or click to browse. JPG/PNG, max 10MB each.
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Upload {MIN_FILES}-{MAX_FILES} selfies for best results
            </p>
          </div>

          {/* Preview Grid */}
          {files.length > 0 && (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
              {files.map(({ preview, id }) => (
                <div key={id} className="group relative aspect-square">
                  <Image
                    src={preview}
                    alt="Preview"
                    fill
                    className="rounded-md object-cover"
                  />
                  <button
                    onClick={() => removeFile(id)}
                    className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-600">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <p className="self-center text-sm text-muted-foreground">
              {files.length} / {MAX_FILES} photos
            </p>
            <Button
              onClick={handleContinue}
              disabled={files.length < MIN_FILES || uploading}
            >
              {uploading ? 'Processing...' : 'Continue'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
