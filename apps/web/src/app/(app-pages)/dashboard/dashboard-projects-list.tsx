'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, ImageIcon, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { deleteProjectAction } from '@/data/user/projects';
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';

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

const STATUS_COLORS: Record<string, string> = {
  uploading: 'bg-yellow-500',
  queued: 'bg-blue-500',
  generating: 'bg-purple-500',
  completed: 'bg-green-500',
  failed: 'bg-red-500',
  cancelled: 'bg-gray-500',
};

export function DashboardProjectsList({
  projects,
}: {
  projects: Array<{
    id: string;
    title: string;
    scene: string;
    status: string;
    created_at: string;
    photo_count: number;
    generated_photos?: Array<{ id: string; storage_path: string }>;
  }>;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}

function ProjectCard({
  project,
}: {
  project: {
    id: string;
    title: string;
    scene: string;
    status: string;
    created_at: string;
    photo_count: number;
    generated_photos?: Array<{ id: string; storage_path: string }>;
  };
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleDelete = () => {
    if (!confirm('Delete this project? This cannot be undone.')) return;
    startTransition(async () => {
      await deleteProjectAction({ projectId: project.id });
      router.refresh();
    });
  };

  const statusColor = STATUS_COLORS[project.status] || 'bg-gray-500';
  const isClickable = project.status === 'completed';

  return (
    <Card className="group relative overflow-hidden transition-shadow hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="font-semibold leading-tight">{project.title}</h3>
            <p className="text-xs text-muted-foreground">
              {SCENE_LABELS[project.scene] || project.scene}
            </p>
          </div>
          <Badge
            variant="secondary"
            className={`text-white ${statusColor}`}
          >
            {project.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {isClickable ? (
          <Link href={`/project/${project.id}`} className="block">
            <div className="aspect-video rounded-md bg-muted flex items-center justify-center overflow-hidden">
              {project.generated_photos && project.generated_photos.length > 0 ? (
                <ProjectThumbnail projectId={project.id} />
              ) : (
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
          </Link>
        ) : (
          <div className="aspect-video rounded-md bg-muted flex items-center justify-center">
            {project.status === 'generating' ? (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Clock className="h-6 w-6 animate-pulse" />
                <span className="text-xs">Generating...</span>
              </div>
            ) : (
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
            )}
          </div>
        )}
        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>{project.photo_count} photos</span>
          <span>{formatDistanceToNow(new Date(project.created_at), { addSuffix: true })}</span>
        </div>
      </CardContent>
      <button
        onClick={handleDelete}
        disabled={isPending}
        className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100"
      >
        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-red-500" />
      </button>
    </Card>
  );
}

function ProjectThumbnail({ projectId }: { projectId: string }) {
  // Server-rendered thumbnail URL would be passed via props in a real implementation
  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
      <ImageIcon className="h-8 w-8 text-primary/60" />
    </div>
  );
}
