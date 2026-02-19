import React from 'react';
import type { Job } from '../services/api';
import { Clock, CheckCircle, XCircle, Loader2, RotateCcw, AlertOctagon } from 'lucide-react';

interface JobQueueProps {
    jobs: Job[];
    onRetry: (id: string) => void;
}

const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    processing: 'bg-blue-100 text-blue-800 border-blue-200',
    completed: 'bg-green-100 text-green-800 border-green-200',
    failed: 'bg-red-100 text-red-800 border-red-200',
    dead: 'bg-red-100 text-red-800 border-red-200',
    retrying: 'bg-orange-100 text-orange-800 border-orange-200',
};

const statusIcons = {
    pending: <Clock size={16} />,
    processing: <Loader2 size={16} className="animate-spin" />,
    completed: <CheckCircle size={16} />,
    failed: <AlertOctagon size={16} />,
    dead: <XCircle size={16} />,
    retrying: <RotateCcw size={16} className="animate-spin" />,
};

export const JobQueue: React.FC<JobQueueProps> = ({ jobs, onRetry }) => {
    if (jobs.length === 0) {
        return (
            <div className="text-center py-10 text-gray-500 bg-white rounded-lg border border-dashed border-gray-300">
                No jobs in the queue. Start the engine!
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
                        <tr>
                            <th className="px-6 py-3">Job ID</th>
                            <th className="px-6 py-3">Type</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3">Attempts</th>
                            <th className="px-6 py-3">Created</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {jobs.map((job) => (
                            <tr key={job.id} className="border-b hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 font-mono text-xs text-gray-500">
                                    {String(job.id).slice(0, 8)}...
                                </td>
                                <td className="px-6 py-4 font-medium text-gray-900">
                                    {job.type}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColors[job.status]}`}>
                                        {statusIcons[job.status]}
                                        {job.status.toUpperCase()}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-gray-500">
                                    {job.attempts}
                                </td>
                                <td className="px-6 py-4 text-gray-400 text-xs">
                                    {new Date(job.createdAt).toLocaleTimeString()}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    {(job.status === 'failed' || job.status === 'dead') && (
                                        <button
                                            onClick={() => onRetry(String(job.id))}
                                            className="text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 p-1.5 rounded transition-colors"
                                            title="Resurrect Job (Retry)"
                                        >
                                            <RotateCcw size={18} />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};