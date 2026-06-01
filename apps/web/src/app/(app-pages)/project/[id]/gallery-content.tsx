'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, Trash2, ImageIcon } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

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
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const sceneName = SCENE_LABELS[project.scene] || project.scene;

  const handleDownload = (url: string, index: number) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = `dating-photo-${index + 1}.jpg`;
    a.click();
  };

  const handleDownloadAll = () => {
    project.generated_photos.forEach((photo, i) => {
      setTimeout(() => {
        handleDownload(photo.signedUrl, i);
      }, i * 500);
    });
  };

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{project.title}</h1>
          <p className="text-sm text-muted-foreground">{sceneName}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownloadAll}>
            <Download className="mr-2 h-4 w-4" />
            Download All
          </Button>
        </div>
      </div>

      {/* Photo Grid */}
      {project.generated_photos.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center">
          <ImageIcon className="h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">No photos generated yet</p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {project.generated_photos.map((photo, index) => (
            <div
              key={photo.id}
              className="group relative aspect-square cursor-pointer overflow-hidden rounded-lg border"
              onClick={() => setSelectedImage(photo.signedUrl)}
            >
              <Image
                src={photo.signedUrl}
                alt={`Generated photo ${index + 1}`}
                fill
                className="object-cover transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/30" />
              <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload(photo.signedUrl, index);
                  }}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
              {index === 0 && (
                <div className="absolute left-2 top-2 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                  Best
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-h-[90vh] max-w-[90vw]">
            <Image
              src={selectedImage}
              alt="Full size"
              width={1024}
              height={1024}
              className="max-h-[90vh] w-auto rounded-lg object-contain"
            />
            <Button
              className="absolute -right-4 -top-4 h-8 w-8 rounded-full p-0"
              onClick={() => setSelectedImage(null)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
