import { getUserProjects, getUserProfile } from '@/data/user/projects';
import { Suspense } from 'react';
import { DashboardHeader } from './dashboard-header';
import { DashboardProjectsList } from './dashboard-projects-list';
import { DashboardEmpty } from './dashboard-empty';
import { DashboardSkeleton } from './dashboard-skeleton';

export default function DashboardPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-8">
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}

async function DashboardContent() {
  const [projects, profile] = await Promise.all([
    getUserProjects(),
    getUserProfile(),
  ]);

  return (
    <>
      <DashboardHeader credits={profile?.credits || 0} />
      {projects.length === 0 ? (
        <DashboardEmpty />
      ) : (
        <DashboardProjectsList projects={projects} />
      )}
    </>
  );
}
