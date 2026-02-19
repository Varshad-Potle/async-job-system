import React, { useState } from 'react';
import { Send, Zap, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';

export const JobForm: React.FC<{ onJobAdded: () => void }> = ({ onJobAdded }) => {
    const [jobType, setJobType] = useState('email');
    const [shouldFail, setShouldFail] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // We send a payload that the worker can use to decide if it should fail
            const payload = {
                subject: `Test Job - ${new Date().toLocaleTimeString()}`,
                simulateFailure: shouldFail, // This flag tells the worker to throw an error
            };

            await api.createJob(jobType, payload);
            onJobAdded(); // Refresh the list immediately
        } catch (error) {
            console.error("Failed to enqueue job", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 h-full">
            <div className="flex items-center gap-2 mb-6">
                <Zap className="text-indigo-600" />
                <h2 className="text-lg font-semibold text-gray-900">Inject Job</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Job Type</label>
                    <select
                        value={jobType}
                        onChange={(e) => setJobType(e.target.value)}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 pl-3 pr-10 border"
                    >
                        <option value="email">📧 Email Notification</option>
                    </select>
                </div>

                <div className="bg-orange-50 p-4 rounded-md border border-orange-200">
                    <div className="flex items-start">
                        <div className="flex h-5 items-center">
                            <input
                                id="fail"
                                type="checkbox"
                                checked={shouldFail}
                                onChange={(e) => setShouldFail(e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                        </div>
                        <div className="ml-3 text-sm">
                            <label htmlFor="fail" className="font-medium text-orange-900">Simulate Failure</label>
                            <p className="text-orange-700">Check this to force the worker to throw an error (tests Retries & DLQ).</p>
                        </div>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
            ${loading ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'} 
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors`}
                >
                    {loading ? 'Enqueuing...' : (
                        <span className="flex items-center gap-2">
                            Enqueue Job <Send size={16} />
                        </span>
                    )}
                </button>

                {/* Footer Section */}
                <div className="pt-4 mt-4 border-t border-gray-200 space-y-2">
                    <div className="text-center">
                        <a
                            href="https://github.com/Varshad-Potle/async-job-system"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium hover:underline inline-flex items-center gap-1 transition-colors"
                        >
                            📚 View Documentation on GitHub
                        </a>
                    </div>
                    <div className="text-center text-xs text-gray-500">
                        Made with <span className="text-red-500 animate-pulse">❤️</span> by{' '}
                        <span className="font-semibold text-gray-700">VARSHAD</span>
                    </div>
                </div>
            </form>
        </div>
    );
};