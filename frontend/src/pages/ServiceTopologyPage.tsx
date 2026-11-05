import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { useEffect } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  Handle,
  Position,
  NodeProps,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { ArrowLeft, Database, Globe, Server, Cpu } from 'lucide-react';
import api from '../lib/api';

const iconMap = {
  database: Database,
  application: Server,
  cache: Cpu,
  proxy: Globe,
};

function CustomNode({ data }: NodeProps) {
  const Icon = iconMap[data.type as keyof typeof iconMap] || Server;

  return (
    <div className="px-4 py-2 bg-surface-dark border border-border-dark rounded-lg shadow-lg">
      <Handle type="target" position={Position.Top} />
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-accent-primary" />
        <span className="text-sm font-medium text-text-darkPrimary">{data.label}</span>
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

const nodeTypes = {
  custom: CustomNode,
};

export default function ServiceTopologyPage() {
  const { id } = useParams<{ id: string }>();

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      const response = await api.get(`/api/projects/${id}`);
      return response.data.project;
    },
  });

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    if (project) {
      // For now, create placeholder nodes since we don't have inspection data
      // In a full implementation, this would come from the inspection API
      const serviceNodes: Node[] = [
        {
          id: 'web',
          type: 'custom',
          position: { x: 250, y: 0 },
          data: { label: 'Web Service', type: 'application' },
        },
        {
          id: 'database',
          type: 'custom',
          position: { x: 100, y: 150 },
          data: { label: 'Database', type: 'database' },
        },
        {
          id: 'cache',
          type: 'custom',
          position: { x: 400, y: 150 },
          data: { label: 'Cache', type: 'cache' },
        },
      ];

      const serviceEdges: Edge[] = [
        { id: 'web-db', source: 'web', target: 'database', animated: true },
        { id: 'web-cache', source: 'web', target: 'cache', animated: true },
      ];

      setNodes(serviceNodes);
      setEdges(serviceEdges);
    }
  }, [project, setNodes, setEdges]);

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="h-96 bg-surface-dark border border-border-dark rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-8">
        <div className="text-center text-text-darkSecondary">Project not found</div>
      </div>
    );
  }

  return (
    <div className="p-8 h-screen flex flex-col">
      <div className="mb-4 flex items-center justify-between">
        <Link
          to={`/projects/${id}`}
          className="flex items-center gap-2 text-sm text-text-darkSecondary hover:text-text-darkPrimary"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Project
        </Link>
        <h1 className="text-2xl font-bold text-text-darkPrimary">Service Topology</h1>
        <div className="w-32" />
      </div>

      <div className="flex-1 bg-surface-dark border border-border-dark rounded-xl overflow-hidden">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
        >
          <Controls />
          <MiniMap />
          <Background variant={BackgroundVariant.Dots} color="#71717a" gap={16} />
        </ReactFlow>
      </div>
    </div>
  );
}
