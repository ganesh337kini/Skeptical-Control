import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import EmptyState from '../components/EmptyState';
import LoadingSkeleton from '../components/LoadingSkeleton';
import StatusIndicator from '../components/StatusIndicator';
import { FolderOpen, Upload } from 'lucide-react';
import api from '../lib/api';

export default function ProjectsPage() {
  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await api.get('/api/projects');
      return response.data.projects;
    },
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text dark:text-text-darkPrimary mb-2">Projects</h1>
          <p className="text-text-darkSecondary dark:text-text-darkSecondary">Manage your microservices projects</p>
        </div>
        <Link
          to="/projects/upload"
          className="flex items-center gap-2 px-4 py-2 bg-accent-primary hover:bg-accent-primaryHover text-white rounded-lg font-medium transition-colors"
        >
          <Upload className="w-4 h-4" />
          Upload Project
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <LoadingSkeleton key={i} className="h-48" />
          ))}
        </div>
      ) : projects && projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project: any) => (
            <Link
              key={project.id}
              to={`/projects/${project.id}`}
              className="bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-xl p-6 hover:border-accent-primary transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-2 bg-accent-primary/10 rounded-lg">
                  <FolderOpen className="w-5 h-5 text-accent-primary" />
                </div>
                <StatusIndicator status={project.status || 'uploaded'} />
              </div>
              <h3 className="font-semibold text-text dark:text-text-darkPrimary mb-2">{project.name}</h3>
              <p className="text-sm text-text-darkSecondary dark:text-text-darkSecondary mb-4 line-clamp-2">
                {project.description || 'No description provided'}
              </p>
              <div className="text-xs text-text-darkTertiary">
                Uploaded {new Date(project.created_at).toLocaleDateString()}
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
  );
}
