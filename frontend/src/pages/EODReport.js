import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';
import Layout from '@/components/Layout';
import { toast } from 'sonner';
import { Calendar, Edit2, Save, X, Download, Eye } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function EODReport() {
  const { getAuthHeaders, user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [eodData, setEodData] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetchEODData();
    fetchProjects();
  }, [selectedDate]);

  const fetchProjects = async () => {
    try {
      const response = await axios.get(`${API}/projects`, { headers: getAuthHeaders() });
      setProjects(response.data);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    }
  };

  const fetchEODData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/entries/summary/daily?date=${selectedDate}`, {
        headers: getAuthHeaders()
      });
      setEodData(response.data.entries || []);
    } catch (error) {
      console.error('Failed to fetch EOD data:', error);
      toast.error('Failed to load EOD report');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (entry) => {
    setEditingId(entry.id);
    setEditForm({
      task_name: entry.task_name,
      description: entry.description,
      project_id: entry.project_id || '',
      start_time: new Date(entry.start_time).toISOString().slice(0, 16),
      end_time: entry.end_time ? new Date(entry.end_time).toISOString().slice(0, 16) : ''
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = async (entryId) => {
    try {
      // Calculate new duration based on edited times
      const start = new Date(editForm.start_time);
      const end = new Date(editForm.end_time);
      const duration = Math.floor((end - start) / 1000);

      await axios.put(
        `${API}/entries/${entryId}`,
        {
          task_name: editForm.task_name,
          description: editForm.description,
          project_id: editForm.project_id || null
        },
        { headers: getAuthHeaders() }
      );

      toast.success('Entry updated successfully!');
      setEditingId(null);
      setEditForm({});
      fetchEODData();
    } catch (error) {
      toast.error('Failed to update entry');
    }
  };

  const getProjectName = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    return project?.name || 'No Project';
  };

  const formatTime = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const calculateTotalTime = () => {
    return eodData.reduce((total, entry) => total + (entry.duration || 0), 0);
  };

  const exportEOD = () => {
    const csv = [
      ['Date', 'Employee Name', 'Project', 'Task Description', 'Start Time', 'End Time', 'Total Time'],
      ...eodData.map(entry => [
        selectedDate,
        user?.name || '',
        getProjectName(entry.project_id),
        entry.task_name,
        formatTime(entry.start_time),
        formatTime(entry.end_time),
        formatDuration(entry.duration)
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `EOD_${user?.name}_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    toast.success('EOD report exported!');
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-testid="eod-report-page">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 tracking-tight">EOD Report</h1>
            <p className="text-slate-600 mt-2">Review and edit your daily time entries</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowPreview(!showPreview)}
              data-testid="toggle-preview"
              className="flex items-center gap-2 h-11 px-6 bg-white text-slate-700 border border-slate-200 rounded-full font-medium hover:bg-slate-50 transition-all duration-200"
            >
              <Eye className="w-4 h-4" />
              {showPreview ? 'Edit Mode' : 'Preview'}
            </button>
            <button
              onClick={exportEOD}
              data-testid="export-eod"
              className="flex items-center gap-2 h-11 px-6 bg-indigo-600 text-white rounded-full font-medium hover:bg-indigo-700 shadow-lg shadow-indigo-500/30 transition-all duration-200"
            >
              <Download className="w-4 h-4" />
              Export EOD
            </button>
          </div>
        </div>

        {/* Date Selector */}
        <div className="mb-6 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-4">
            <Calendar className="w-5 h-5 text-slate-600" />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Select Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                data-testid="date-selector"
                className="h-11 px-4 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
              />
            </div>
            <div className="ml-auto text-right">
              <p className="text-sm text-slate-600">Total Time</p>
              <p className="text-2xl font-bold text-indigo-600">{formatDuration(calculateTotalTime())}</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent"></div>
          </div>
        ) : eodData.length === 0 ? (
          <div className="text-center py-16 bg-slate-50 rounded-xl border border-slate-200">
            <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No entries for this date</h3>
            <p className="text-slate-600">Start tracking your time to see EOD reports!</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Preview Mode */}
            {showPreview ? (
              <div className="p-8" data-testid="eod-preview">
                <div className="mb-6 pb-4 border-b border-slate-200">
                  <h2 className="text-2xl font-bold text-slate-900">End of Day Report</h2>
                  <p className="text-slate-600 mt-1">{formatDate(selectedDate)}</p>
                  <p className="text-sm text-slate-600 mt-1">Employee: {user?.name}</p>
                </div>

                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-slate-200">
                      <th className="py-3 px-4 text-left text-sm font-semibold text-slate-900">Task</th>
                      <th className="py-3 px-4 text-left text-sm font-semibold text-slate-900">Project</th>
                      <th className="py-3 px-4 text-left text-sm font-semibold text-slate-900">Description</th>
                      <th className="py-3 px-4 text-left text-sm font-semibold text-slate-900">Start</th>
                      <th className="py-3 px-4 text-left text-sm font-semibold text-slate-900">End</th>
                      <th className="py-3 px-4 text-left text-sm font-semibold text-slate-900">Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {eodData.map((entry) => (
                      <tr key={entry.id} className="border-b border-slate-100">
                        <td className="py-3 px-4 text-slate-900">{entry.task_name}</td>
                        <td className="py-3 px-4 text-slate-700">{getProjectName(entry.project_id)}</td>
                        <td className="py-3 px-4 text-slate-700">{entry.description || '-'}</td>
                        <td className="py-3 px-4 text-slate-700">{formatTime(entry.start_time)}</td>
                        <td className="py-3 px-4 text-slate-700">{formatTime(entry.end_time)}</td>
                        <td className="py-3 px-4 font-medium text-slate-900">{formatDuration(entry.duration)}</td>
                      </tr>
                    ))}
                    <tr className="bg-slate-50 font-semibold">
                      <td colSpan="5" className="py-3 px-4 text-right text-slate-900">Total:</td>
                      <td className="py-3 px-4 text-indigo-600">{formatDuration(calculateTotalTime())}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              /* Edit Mode */
              <div className="overflow-x-auto" data-testid="eod-edit-table">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Employee</th>
                      <th className="px-4 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Project</th>
                      <th className="px-4 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Task</th>
                      <th className="px-4 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Description</th>
                      <th className="px-4 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Start Time</th>
                      <th className="px-4 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">End Time</th>
                      <th className="px-4 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Total Time</th>
                      <th className="px-4 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {eodData.map((entry) => (
                      <tr key={entry.id} className="hover:bg-slate-50 transition-colors" data-testid={`eod-row-${entry.id}`}>
                        <td className="px-4 py-4 text-sm text-slate-700">{selectedDate}</td>
                        <td className="px-4 py-4 text-sm text-slate-700">{user?.name}</td>
                        
                        {editingId === entry.id ? (
                          <>
                            <td className="px-4 py-4">
                              <select
                                value={editForm.project_id}
                                onChange={(e) => setEditForm({ ...editForm, project_id: e.target.value })}
                                className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                              >
                                <option value="">No Project</option>
                                {projects.map(p => (
                                  <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                              </select>
                            </td>
                            <td className="px-4 py-4">
                              <input
                                type="text"
                                value={editForm.task_name}
                                onChange={(e) => setEditForm({ ...editForm, task_name: e.target.value })}
                                className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                              />
                            </td>
                            <td className="px-4 py-4">
                              <input
                                type="text"
                                value={editForm.description}
                                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                              />
                            </td>
                            <td className="px-4 py-4 text-sm text-slate-500">{formatTime(entry.start_time)}</td>
                            <td className="px-4 py-4 text-sm text-slate-500">{formatTime(entry.end_time)}</td>
                            <td className="px-4 py-4 text-sm font-medium text-slate-900">{formatDuration(entry.duration)}</td>
                            <td className="px-4 py-4">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => saveEdit(entry.id)}
                                  data-testid={`save-edit-${entry.id}`}
                                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                >
                                  <Save className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={cancelEdit}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-4 py-4 text-sm text-slate-700">{getProjectName(entry.project_id)}</td>
                            <td className="px-4 py-4 text-sm font-medium text-slate-900">{entry.task_name}</td>
                            <td className="px-4 py-4 text-sm text-slate-700">{entry.description || '-'}</td>
                            <td className="px-4 py-4 text-sm text-slate-700">{formatTime(entry.start_time)}</td>
                            <td className="px-4 py-4 text-sm text-slate-700">{formatTime(entry.end_time)}</td>
                            <td className="px-4 py-4 text-sm font-medium text-indigo-600">{formatDuration(entry.duration)}</td>
                            <td className="px-4 py-4">
                              <button
                                onClick={() => startEdit(entry)}
                                data-testid={`edit-entry-${entry.id}`}
                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                    <tr>
                      <td colSpan="7" className="px-4 py-4 text-right text-sm font-semibold text-slate-900">Total Time:</td>
                      <td className="px-4 py-4 text-sm font-bold text-indigo-600">{formatDuration(calculateTotalTime())}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}