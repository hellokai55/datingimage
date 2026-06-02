'use client';

import { Button } from '@/components/ui/button';
import { Download, X, ArrowLeft, ImageOff } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useCallback, useEffect } from 'react';

const SCENE_LABELS: Record<string, string> = {
  beach: 'Beach & Waterfront',
  coffee: 'Coffee Shop',
  office: 'Professional Office',
  street: 'Urban Street',
  outdoor: 'Outdoor Adventure',
  art: 'Art Gallery',
  wine: 'Wine Bar',
  gym: 'Gym & Fitness',
};

export function GalleryContent({
  project,
}: {
  project: {
    id: string;
    title: string;
    scene: string;
    status: string;
    generated_photos: Array<{
      id: string;
      storage_path: string;
      signedUrl: string;
      sort_order: number;
    }>;
  };
}) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const sceneName = SCENE_LABELS[project.scene] || project.scene;
  const photos = project.generated_photos;
  const selectedImage = selectedIndex !== null ? photos[selectedIndex]?.signedUrl : null;

  const handleDownload = useCallback((url: string, index: number) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = `dating-photo-${index + 1}.jpg`;
    a.click();
  }, []);

  const handleDownloadAll = useCallback(() => {
    photos.forEach((photo, i) => {
      setTimeout(() => {
        handleDownload(photo.signedUrl, i);
      }, i * 500);
    });
  }, [photos, handleDownload]);

  const handlePrev = useCallback(() => {
    if (selectedIndex === null) return;
    setSelectedIndex(selectedIndex === 0 ? photos.length - 1 : selectedIndex - 1);
  }, [selectedIndex, photos.length]);

  const handleNext = useCallback(() => {
    if (selectedIndex === null) return;
    setSelectedIndex(selectedIndex === photos.length - 1 ? 0 : selectedIndex + 1);
  }, [selectedIndex, photos.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (selectedIndex === null) return;
      if (e.key === 'Escape') setSelectedIndex(null);
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedIndex, handlePrev, handleNext]);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-[1400px] px-5 py-8 md:px-10 md:py-12">
        {/* Header */}
        <div className="mb-10 md:mb-14">
          <Link
            href="/dashboard"
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Link>

          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                {project.title}
              </h1>
              <p className="mt-1.5 text-base text-muted-foreground">
                {sceneName}
              </p>
            </div>

            {photos.length > 0 && (
              <Button
                variant="outline"
                onClick={handleDownloadAll}
                className="h-10 gap-2 rounded-md border-border/60 bg-card px-5 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <Download className="h-4 w-4" />
                Download All
              </Button>
            )}
          </div>
        </div>

        {/* Photo Grid */}
        {photos.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-card/50 py-28 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <ImageOff className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="mt-5 text-lg font-medium text-foreground">
              No photos generated yet
            </h3>
            <p className="mt-1.5 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Your generated photos will appear here once they are ready.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {photos.map((photo, index) => (
              <div
                key={photo.id}
                className={`group relative cursor-pointer overflow-hidden rounded-xl border border-border/40 bg-muted shadow-sm transition-all duration-300 hover:border-border/80 hover:shadow-md ${
                  index === 0
                    ? 'sm:col-span-2 sm:row-span-2 lg:col-span-1 lg:row-span-1 xl:col-span-2 xl:row-span-2'
                    : ''
                }`}
                onClick={() => setSelectedIndex(index)}
              >
                <div className={index === 0 ? 'aspect-[3/4] xl:aspect-auto xl:h-full' : 'aspect-[3/4]'}>
                  <Image
                    src={photo.signedUrl}
                    alt={`Generated photo ${index + 1}`}
                    fill
                    sizes={index === 0
                      ? '(min-width: 1280px) 50vw, (min-width: 640px) 50vw, 100vw'
                      : '(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw'
                    }
                    className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                  />
                </div>

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/40" />

                {/* Best badge */}
                {index === 0 && (
                  <div className="absolute left-3 top-3">
                    <div className="flex items-center gap-1.5 rounded-md bg-background/90 px-2.5 py-1 text-xs font-medium text-foreground shadow-sm backdrop-blur-sm">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-500 opacity-75" />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-500" />
                      </span>
                      Best Pick
                    </div>
                  </div>
                )}

                {/* Photo number */}
                <div className="absolute right-3 top-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <span className="rounded-md bg-black/60 px-2 py-1 text-xs font-medium text-white backdrop-blur-sm">
                    {index + 1}
                  </span>
                </div>

                {/* Actions */}
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <span className="rounded-md bg-black/60 px-2 py-1 text-xs text-white/90 backdrop-blur-sm">
                    View
                  </span>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-9 w-9 rounded-md bg-background/90 text-foreground shadow-sm backdrop-blur-sm transition-colors hover:bg-background"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(photo.signedUrl, index);
                    }}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {selectedImage && selectedIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
          onClick={() => setSelectedIndex(null)}
        >
          {/* Close button */}
          <Button
            size="icon"
            variant="ghost"
            className="absolute right-4 top-4 z-10 h-10 w-10 rounded-full bg-white/10 text-white backdrop-blur-md transition-colors hover:bg-white/20 hover:text-white"
            onClick={() => setSelectedIndex(null)}
          >
            <X className="h-5 w-5" />
          </Button>

          {/* Photo index */}
          <div className="absolute left-4 top-4 z-10 rounded-full bg-white/10 px-3 py-1.5 text-sm font-medium text-white backdrop-blur-md">
            {selectedIndex + 1} / {photos.length}
          </div>

          {/* Download button */}
          <Button
            variant="ghost"
            className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 gap-2 rounded-full bg-white/10 px-5 text-sm font-medium text-white backdrop-blur-md transition-colors hover:bg-white/20 hover:text-white"
            onClick={(e) => {
              e.stopPropagation();
              handleDownload(selectedImage, selectedIndex);
            }}
          >
            <Download className="h-4 w-4" />
            Download
          </Button>

          {/* Main image */}
          <div
            className="relative flex max-h-[85vh] max-w-[90vw] items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={selectedImage}
              alt={`Photo ${selectedIndex + 1}`}
              width={1200}
              height={1600}
              className="max-h-[85vh] w-auto rounded-lg object-contain shadow-2xl"
              priority
            />
          </div>
        </div>
      )}
    </div>
  );
}
