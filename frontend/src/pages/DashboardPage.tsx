import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import MetricCard from '../components/MetricCard';
import EmptyState from '../components/EmptyState';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { FolderOpen, Activity, Cpu, Database } from 'lucide-react';
import api from '../lib/api';

export default function DashboardPage() {
  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await api.get('/api/projects');
      return response.data.projects;
    },
  });

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text dark:text-text-darkPrimary mb-2">Dashboard</h1>
        <p className="text-text-darkSecondary dark:text-text-darkSecondary">Overview of your projects and environments</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Total Projects"
          value={projects?.length || 0}
          icon={FolderOpen}
        />
        <MetricCard
          title="Active Environments"
          value="0"
          icon={Cpu}
        />
        <MetricCard
          title="Total Experiments"
          value="0"
          icon={Activity}
        />
        <MetricCard
          title="System Health"
          value="OK"
          icon={Database}
        />
      </div>

      <div className="bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-text dark:text-text-darkPrimary">Recent Projects</h2>
          <Link
            to="/projects"
            className="text-sm text-accent-primary hover:text-accent-primaryHover"
          >
            View all
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <LoadingSkeleton key={i} className="h-16" />
            ))}
          </div>
        ) : projects && projects.length > 0 ? (
          <div className="space-y-4">
            {projects.slice(0, 5).map((project: any) => (
              <Link
                key={project.id}
                to={`/projects/${project.id}`}
                className="block p-4 bg-background dark:bg-background-dark border border-border dark:border-border-dark rounded-lg hover:border-accent-primary transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-text dark:text-text-darkPrimary">{project.name}</h3>
                    <p className="text-sm text-text-darkSecondary dark:text-text-darkSecondary mt-1">
                      {project.description || 'No description'}
                    </p>
                  </div>
                  <div className="text-xs text-text-darkTertiary">
                    {new Date(project.created_at).toLocaleDateString()}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={FolderOpen}
            title="No projects yet"
            description="Upload your first microservices project to get started"
            action={{
              label: 'Upload Project',
              onClick: () => (window.location.href = '/projects/upload'),
            }}
          />
        )}
      </div>
    </div>
  );
}
