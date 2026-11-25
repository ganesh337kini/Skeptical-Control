import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Activity, AlertTriangle, Gauge, HeartPulse, RotateCcw, Zap } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import api from '../lib/api';

async function research(path: string, method: 'get' | 'post' = 'get', body?: unknown) {
  const response = await api.request({ url: `/api/research${path}`, method, data: body });
  return response.data;
}

function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return <div className="mb-6"><h1 className="text-2xl font-bold text-text dark:text-text-darkPrimary">{title}</h1><p className="mt-1 text-sm text-text-darkTertiary dark:text-text-darkSecondary">{subtitle}</p></div>;
}

export function LiveMonitoringPage() {
  const [experiment, setExperiment] = useState<any>(null);
  const [telemetry, setTelemetry] = useState<any[]>([]);
  useEffect(() => {
    research('/experiments').then(d => {
      const latest = d.experiments?.[0];
      setExperiment(latest);
      setTelemetry(latest?.telemetry || []);
    });
  }, []);
  useEffect(() => { research('/experiments').then(d => setExperiment(d.experiments?.[0])); }, []);

  return <div className="p-8">
    <PageHeader title="Live Monitoring" subtitle="Prometheus metrics and OpenTelemetry trace references" />
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {[['Request rate', `${experiment?.telemetry?.at(-1)?.request_rate || 0} req/s`, Activity], ['Error rate', `${experiment?.telemetry?.at(-1)?.error_rate || 0}%`, AlertTriangle], ['Average latency', `${experiment?.telemetry?.at(-1)?.average_latency_ms || 0} ms`, Gauge], ['Availability', `${experiment?.telemetry?.at(-1)?.availability || 'not captured'}`, HeartPulse]].map(([label, value, Icon]: any) => <div key={label} className="p-4 rounded-xl border border-border dark:border-border-dark bg-surface dark:bg-surface-dark"><Icon className="w-5 h-5 text-accent-primary mb-2"/><div className="text-xs text-text-darkTertiary">{label}</div><div className="text-xl font-bold text-text dark:text-text-darkPrimary">{value}</div></div>)}
    </div>
    <div className="grid lg:grid-cols-2 gap-4"><div className="h-72 p-4 rounded-xl border border-border dark:border-border-dark"><ResponsiveContainer width="100%" height="100%"><AreaChart data={telemetry}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="captured_at"/><YAxis/><Tooltip/><Area type="monotone" dataKey="average_latency_ms" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.25}/></AreaChart></ResponsiveContainer></div><div className="h-72 p-4 rounded-xl border border-border dark:border-border-dark"><ResponsiveContainer width="100%" height="100%"><LineChart data={telemetry}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="captured_at"/><YAxis/><Tooltip/><Line type="monotone" dataKey="request_rate" stroke="#22c55e"/><Line type="monotone" dataKey="error_rate" stroke="#ef4444"/></LineChart></ResponsiveContainer></div></div>
    {experiment && <div className="mt-4 text-sm text-text-darkSecondary">Latest experiment: {experiment.name} — {experiment.status}</div>}
  </div>;
}

export function FaultInjectionPage() {
  const { id } = useParams<{ id: string }>();
  const [target, setTarget] = useState('web');
  const [type, setType] = useState('latency');
  const [intensity, setIntensity] = useState(300);
  const [duration, setDuration] = useState(60);
  const [experimentId, setExperimentId] = useState(id || '');
  const [fault, setFault] = useState<any>(null);

  async function createAndInject() {
    let eid = experimentId;
    if (!eid) { const exp = await research('/experiments', 'post', { project_id: id || 'demo', name: 'Controlled fault experiment' }); eid = exp.id; setExperimentId(eid); }
    const result = await research(`/experiments/${eid}/faults`, 'post', { target_service: target, fault_type: type, intensity, duration_seconds: duration });
    setFault(result.faults?.at(-1));
  }
  async function cleanup() { if (!experimentId) return; const exp = await research('/experiments').then(d => d.experiments.find((e: any) => e.id === experimentId)); const index = exp?.faults?.length - 1; if (index >= 0) setFault((await research(`/experiments/${experimentId}/faults/${index}/cleanup`, 'post')).faults[index]); }

  return <div className="p-8"><div className="p-8"><PageHeader title="Fault Injection" subtitle="Toxiproxy-backed reversible network faults" /><div className="grid md:grid-cols-2 gap-6"><div className="space-y-4 p-5 border rounded-xl"><label className="block text-sm">Target service<input className="mt-1 w-full p-2 border rounded" value={target} onChange={e => setTarget(e.target.value)}/></label><label className="block text-sm">Fault type<select className="mt-1 w-full p-2 border rounded" value={type} onChange={e => setType(e.target.value)}><option value="latency">Network latency</option><option value="timeout">Service timeout</option><option value="reset_peer">Connection interruption</option><option value="bandwidth">Bandwidth pressure</option></select></label><label className="block text-sm">Intensity (ms/rate)<input type="number" className="mt-1 w-full p-2 border rounded" value={intensity} onChange={e => setIntensity(Number(e.target.value))}/></label><label className="block text-sm">Duration (seconds)<input type="number" className="mt-1 w-full p-2 border rounded" value={duration} onChange={e => setDuration(Number(e.target.value))}/></label><button onClick={createAndInject} className="flex items-center gap-2 px-4 py-2 rounded bg-accent-primary text-white"><Zap className="w-4 h-4"/>Inject controlled fault</button></div><div className="p-5 border rounded-xl"><h2 className="font-semibold mb-3">Known ground truth</h2>{fault ? <div className="space-y-2 text-sm"><div>{fault.target_service} / {fault.fault_type}</div><div>Intensity: {fault.intensity}</div><div>Status: {fault.status}</div><div>Start: {fault.start_time}</div><div>Planned end: {fault.end_time}</div><button onClick={cleanup} className="mt-4 flex items-center gap-2 px-3 py-2 border rounded"><RotateCcw className="w-4 h-4"/>Clean up now</button></div> : <div className="text-sm text-text-darkSecondary">No fault injected in this view.</div>}</div></div></div></div>;
}

export function RCAAnalysisPage() {
  const [metrics] = useState({ by_service: { web: { error_rate: 0.08, p95_latency_ms: 820, availability: 0.96, dependency_failures: 12 }, db: { error_rate: 0.01, p95_latency_ms: 180, availability: 1, dependency_failures: 0 } } });
  const [result, setResult] = useState<any>(null);
  const [, setExperimentId] = useState('');
  async function run() { const exp = await research('/experiments', 'post', { project_id: 'demo', name: 'RCA experiment' }); const out = await research(`/experiments/${exp.id}/rca`, 'post', { metrics, services: [{ name: 'web' }, { name: 'db' }], dependencies: [{ from: 'web', to: 'db' }], logs: [], traces: [] }); setExperimentId(exp.id); setResult(out.rca); }
  return <div className="p-8"><PageHeader title="RCA Analysis" subtitle="Explainable hypotheses derived only from observed telemetry"/><button onClick={run} className="px-4 py-2 rounded bg-accent-primary text-white mb-4">Run baseline RCA</button>{result && <div className="space-y-3"><div className="p-3 rounded border text-sm">Method: {result.method}. <strong>{result.score_disclaimer}</strong></div>{result.suspects.map((s: any) => <div key={s.service} className="p-5 rounded-xl border"><div className="flex justify-between"><h2 className="font-semibold">#{s.rank} {s.service}</h2><span className="text-sm">Hypothesis weight {s.hypothesis_score} · uncertainty {s.uncertainty}</span></div><ul className="mt-3 text-sm list-disc ml-5">{s.evidence.map((e: any, i: number) => <li key={i}>{e.observation}</li>)}</ul><div className="mt-2 text-xs">Impacted: {s.impacted_services.join(', ') || 'none observed'} · Traces: {s.supporting_traces.join(', ') || 'none'}</div></div>)}</div>}</div>;
}

export function ServiceHealthPage() {
  const services = [{ name: 'web', status: 'Degraded', cpu: 72, memory: 68, availability: '96.0%' }, { name: 'db', status: 'Healthy', cpu: 31, memory: 54, availability: '100%' }];
  return <div className="p-8"><PageHeader title="Service Health" subtitle="Availability and resource utilization"/><div className="grid md:grid-cols-2 gap-4">{services.map(s => <div key={s.name} className="p-5 rounded-xl border"><div className="flex justify-between"><h2 className="font-semibold">{s.name}</h2><span className={s.status === 'Healthy' ? 'text-green-600' : 'text-red-600'}>{s.status}</span></div><div className="grid grid-cols-3 mt-4 text-sm"><span>CPU {s.cpu}%</span><span>Memory {s.memory}%</span><span>Available {s.availability}</span></div></div>)}</div></div>;
}

export function ExperimentTimelinePage() {
  const [experiment, setExperiment] = useState<any>(null);
  useEffect(() => { research('/experiments').then(d => setExperiment(d.experiments?.[0])); }, []);
  return <div className="p-8"><PageHeader title="Experiment Timeline" subtitle="Workloads, faults, telemetry, RCA, and cleanup events"/><div className="border-l pl-5 space-y-5">{experiment?.timeline?.map((event: any, i: number) => <div key={i} className="relative"><div className="absolute -left-[29px] w-3 h-3 rounded-full bg-accent-primary mt-1"/><div className="text-xs text-text-darkSecondary">{event.at}</div><div className="font-medium">{event.event}</div></div>) || <div className="text-sm text-text-darkSecondary">Create an experiment to begin timeline recording.</div>}</div></div>;
}
