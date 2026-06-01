import { getProjectById } from '@/data/user/projects';
import { notFound } from 'next/navigation';
import { GalleryContent } from './gallery-content';

export default async function ProjectPage({ params }: { params: { id: string } }) {
  try {
    const project = await getProjectById(params.id);
    return <GalleryContent project={project} />;
  } catch {
    notFound();
  }
}
