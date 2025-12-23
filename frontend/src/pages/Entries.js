import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';
import Layout from '@/components/Layout';
import { toast } from 'sonner';
import { Trash2, Edit2, Clock } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Entries() {
  const { getAuthHeaders } = useAuth();
  const [entries, setEntries] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [entriesRes, projectsRes] = await Promise.all([
        axios.get(`${API}/entries?limit=500`, { headers: getAuthHeaders() }),
        axios.get(`${API}/projects`, { headers: getAuthHeaders() })
      ]);
      setEntries(entriesRes.data);
      setProjects(projectsRes.data);
    } catch (error) {
      console.error('Failed to fetch entries:', error);
      toast.error('Failed to load entries');
    } finally {
      setLoading(false);
    }
  };

  const deleteEntry = async (entryId) => {
    if (!window.confirm('Are you sure you want to delete this entry?')) return;
    
    try {
      await axios.delete(`${API}/entries/${entryId}`, { headers: getAuthHeaders() });
      toast.success('Entry deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete entry');
    }
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const getProjectName = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    return project?.name || 'No Project';
  };

  const getProjectColor = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    return project?.color || '#94A3B8';
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-testid="entries-page">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Time Entries</h1>
            <p className="text-slate-600 mt-2">View and manage all your tracked time</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent"></div>
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-16 bg-slate-50 rounded-xl border border-slate-200">
            <Clock className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No time entries yet</h3>
            <p className="text-slate-600">Start tracking your time from the dashboard!</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Task</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Project</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Time</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Duration</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {entries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-slate-50 transition-colors" data-testid={`entry-row-${entry.id}`}>
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-slate-900">{entry.task_name}</div>
                          {entry.description && (
                            <div className="text-sm text-slate-600 mt-1">{entry.description}</div>
                          )}
                          {entry.tags.length > 0 && (
                            <div className="flex gap-1 mt-2">
                              {entry.tags.map((tag, idx) => (
                                <span key={idx} className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-md">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: getProjectColor(entry.project_id) }}
                          />
                          <span className="text-sm text-slate-700">{getProjectName(entry.project_id)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700">
                        {formatDate(entry.start_time)}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700">
                        {formatTime(entry.start_time)} - {entry.end_time ? formatTime(entry.end_time) : 'Running'}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-700">
                          {entry.is_running ? 'Running' : formatDuration(entry.duration)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => deleteEntry(entry.id)}
                          data-testid={`delete-entry-${entry.id}`}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}