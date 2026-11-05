import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import StatusIndicator from '../components/StatusIndicator';
import EmptyState from '../components/EmptyState';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { Play, Square, ArrowLeft, Database, Server, Globe } from 'lucide-react';
import api from '../lib/api';

export default function ProjectDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      const response = await api.get(`/api/projects/${id}`);
      return response.data.project;
    },
  });

  const { data: envStatus } = useQuery({
    queryKey: ['environment-status', id],
    queryFn: async () => {
      const response = await api.get(`/api/environments/${id}/status`);
      return response.data;
    },
    refetchInterval: 5000,
  });

  const startMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/api/environments/${id}/start`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['environment-status', id] });
    },
  });

  const stopMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/api/environments/${id}/stop`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['environment-status', id] });
    },
  });

  if (isLoading) {
    return (
      <div className="p-8">
        <LoadingSkeleton className="h-96" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-8">
        <EmptyState
          icon={Server}
          title="Project not found"
          description="The project you're looking for doesn't exist"
        />
      </div>
    );
  }

  const isRunning = envStatus?.liveStatus?.status === 'running';

  return (
    <div className="p-8">
      <div className="mb-8">
        <Link
          to="/projects"
          className="flex items-center gap-2 text-sm text-text-darkSecondary dark:text-text-darkSecondary hover:text-text dark:hover:text-text-darkPrimary mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Projects
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text dark:text-text-darkPrimary mb-2">{project.name}</h1>
            <p className="text-text-darkSecondary dark:text-text-darkSecondary">{project.description || 'No description'}</p>
          </div>
          <StatusIndicator status={project.status || 'uploaded'} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-accent-primary/10 rounded-lg">
              <Server className="w-5 h-5 text-accent-primary" />
            </div>
            <h3 className="font-semibold text-text dark:text-text-darkPrimary">Environment</h3>
          </div>
          <div className="mb-4">
            <div className="text-2xl font-bold text-text dark:text-text-darkPrimary mb-1">
              {isRunning ? 'Running' : 'Stopped'}
            </div>
            <div className="text-sm text-text-darkSecondary dark:text-text-darkSecondary">
              {envStatus?.liveStatus?.containers?.length || 0} containers
            </div>
          </div>
          <div className="flex gap-2">
            {!isRunning ? (
              <button
                onClick={() => startMutation.mutate()}
                disabled={startMutation.isPending}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-accent-primary hover:bg-accent-primaryHover text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                <Play className="w-4 h-4" />
                {startMutation.isPending ? 'Starting...' : 'Start'}
              </button>
            ) : (
              <button
                onClick={() => stopMutation.mutate()}
                disabled={stopMutation.isPending}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                <Square className="w-4 h-4" />
                {stopMutation.isPending ? 'Stopping...' : 'Stop'}
              </button>
            )}
          </div>
        </div>

        <div className="bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-accent-primary/10 rounded-lg">
              <Database className="w-5 h-5 text-accent-primary" />
            </div>
            <h3 className="font-semibold text-text dark:text-text-darkPrimary">Resources</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-text-darkSecondary dark:text-text-darkSecondary">CPU Limit</span>
              <span className="text-text dark:text-text-darkPrimary">2 cores</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-darkSecondary dark:text-text-darkSecondary">Memory Limit</span>
              <span className="text-text dark:text-text-darkPrimary">2 GB</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-darkSecondary dark:text-text-darkSecondary">Time Limit</span>
              <span className="text-text dark:text-text-darkPrimary">5 min</span>
            </div>
          </div>
        </div>

        <div className="bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-accent-primary/10 rounded-lg">
              <Globe className="w-5 h-5 text-accent-primary" />
            </div>
            <h3 className="font-semibold text-text dark:text-text-darkPrimary">Network</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-text-darkSecondary dark:text-text-darkSecondary">Isolation</span>
              <span className="text-text dark:text-text-darkPrimary">Enabled</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-darkSecondary dark:text-text-darkSecondary">External Access</span>
              <span className="text-text dark:text-text-darkPrimary">Restricted</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-text dark:text-text-darkPrimary">Container Status</h2>
          <Link
            to={`/projects/${id}/topology`}
            className="text-sm text-accent-primary hover:text-accent-primaryHover"
          >
            View Topology
          </Link>
        </div>

        {envStatus?.liveStatus?.containers && envStatus.liveStatus.containers.length > 0 ? (
          <div className="space-y-3">
            {envStatus.liveStatus.containers.map((container: any) => (
              <div
                key={container.id}
                className="p-4 bg-background dark:bg-background-dark border border-border dark:border-border-dark rounded-lg"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-text dark:text-text-darkPrimary">{container.name}</div>
                    <div className="text-xs text-text-darkTertiary mt-1">{container.id.slice(0, 12)}</div>
                  </div>
                  <StatusIndicator
                    status={container.status === 'running' ? 'running' : 'stopped'}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Server}
            title="No containers running"
            description="Start the environment to see container status"
          />
        )}
      </div>
    </div>
  );
}
