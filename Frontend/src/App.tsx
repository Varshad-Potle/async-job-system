import { useEffect, useState, useCallback } from 'react';
import { api } from './services/api';
import type { Job, Stats } from './services/api';
import { JobQueue } from './components/JobQueue';
import { JobForm } from './components/JobForm';
import { Activity, Server, Database, ShieldAlert } from 'lucide-react';

type JobFilter = 'all' | 'failed';

function App() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [stats, setStats] = useState<Stats>({ pending: 0, processing: 0, completed: 0, failed: 0 });
  const [jobFilter, setJobFilter] = useState<JobFilter>('all');

  const fetchData = useCallback(async () => {
    try {
      const jobsPromise = jobFilter === 'all' ? api.getJobs() : api.getFailedJobs();
      const [jobsData, statsData] = await Promise.all([
        jobsPromise,
        api.getStats()
      ]);
      setJobs(jobsData);
      setStats(statsData);
    } catch (error) {
      console.error("Failed to fetch data", error);
    }
  }, [jobFilter]);

  // Poll every 2 seconds
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, [fetchData]); // Refetch when filter changes

  const handleRetry = async (id: string) => {
    await api.retryJob(id);
    fetchData(); // Refresh immediately
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <Server className="text-indigo-600" size={32} />
              Async Job System
            </h1>
            <p className="text-slate-500 mt-1">Distributed Task Queue with Redis & PostgreSQL</p>
          </div>
          <div className="flex gap-4">
            <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200 flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-gray-600">System Online</span>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard title="Pending" value={stats.pending} icon={<Database size={20} />} color="text-yellow-600" bg="bg-yellow-50" />
          <StatCard title="Processing" value={stats.processing} icon={<Activity size={20} />} color="text-blue-600" bg="bg-blue-50" />
          <StatCard title="Completed" value={stats.completed} icon={<Server size={20} />} color="text-green-600" bg="bg-green-50" />
          <StatCard title="Failed (DLQ)" value={stats.failed} icon={<ShieldAlert size={20} />} color="text-red-600" bg="bg-red-50" />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Producer */}
          <div className="lg:col-span-1">
            <JobForm onJobAdded={fetchData} />
          </div>

          {/* Right: Consumer/Queue */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-800">Live Job Queue</h2>
              <span className="text-xs text-gray-400">Auto-refreshing every 2s</span>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-gray-200 shadow-sm w-fit">
              <button
                onClick={() => setJobFilter('all')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${jobFilter === 'all'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
              >
                <Database size={16} />
                All Jobs
              </button>
              <button
                onClick={() => setJobFilter('failed')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${jobFilter === 'failed'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
              >
                <ShieldAlert size={16} />
                Failed/Dead ({stats.failed})
              </button>
            </div>

            <JobQueue jobs={jobs} onRetry={handleRetry} />
          </div>
        </div>

      </div>
    </div>
  );
}

// Simple Helper Component for Stats
const StatCard = ({ title, value, icon, color, bg }: any) => (
  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex items-center justify-between">
    <div>
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
    <div className={`p-3 rounded-full ${bg} ${color}`}>
      {icon}
    </div>
  </div>
);

export default App;