import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';
import Layout from '@/components/Layout';
import { toast } from 'sonner';
import { Download, TrendingUp, Clock, Calendar } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Reports() {
  const { getAuthHeaders } = useAuth();
  const [view, setView] = useState('weekly'); // daily, weekly, monthly
  const [dailySummary, setDailySummary] = useState(null);
  const [weeklySummary, setWeeklySummary] = useState(null);
  const [monthlySummary, setMonthlySummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSummaries();
  }, []);

  const fetchSummaries = async () => {
    try {
      const [daily, weekly, monthly] = await Promise.all([
        axios.get(`${API}/entries/summary/daily`, { headers: getAuthHeaders() }),
        axios.get(`${API}/entries/summary/weekly`, { headers: getAuthHeaders() }),
        axios.get(`${API}/entries/summary/monthly`, { headers: getAuthHeaders() })
      ]);
      
      setDailySummary(daily.data);
      setWeeklySummary(weekly.data);
      setMonthlySummary(monthly.data);
    } catch (error) {
      console.error('Failed to fetch summaries:', error);
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = async () => {
    try {
      const response = await axios.get(`${API}/export/csv`, {
        headers: getAuthHeaders(),
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'time_entries.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('CSV exported successfully!');
    } catch (error) {
      toast.error('Failed to export CSV');
    }
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getCurrentData = () => {
    if (view === 'daily') return dailySummary;
    if (view === 'weekly') return weeklySummary?.summaries || [];
    return monthlySummary?.summaries || [];
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-testid="reports-page">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Reports</h1>
            <p className="text-slate-600 mt-2">Analyze your time tracking data</p>
          </div>
          
          <button
            onClick={exportCSV}
            data-testid="export-csv-button"
            className="flex items-center gap-2 h-11 px-6 bg-indigo-600 text-white rounded-full font-medium hover:bg-indigo-700 shadow-lg shadow-indigo-500/30 transition-all duration-200"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>

        {/* View Selector */}
        <div className="mb-6 flex gap-2" data-testid="view-selector">
          <button
            onClick={() => setView('daily')}
            data-testid="daily-view-button"
            className={`px-6 py-2.5 rounded-full font-medium transition-all duration-200 ${
              view === 'daily'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Daily
          </button>
          <button
            onClick={() => setView('weekly')}
            data-testid="weekly-view-button"
            className={`px-6 py-2.5 rounded-full font-medium transition-all duration-200 ${
              view === 'weekly'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Weekly
          </button>
          <button
            onClick={() => setView('monthly')}
            data-testid="monthly-view-button"
            className={`px-6 py-2.5 rounded-full font-medium transition-all duration-200 ${
              view === 'monthly'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Monthly
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary Cards */}
            {view === 'daily' && dailySummary && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-indigo-600" />
                    </div>
                    <h3 className="font-semibold text-slate-900">Total Time</h3>
                  </div>
                  <p className="text-3xl font-bold text-slate-900">{formatDuration(dailySummary.total_duration)}</p>
                  <p className="text-sm text-slate-600 mt-1">Today's tracked time</p>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    </div>
                    <h3 className="font-semibold text-slate-900">Entries</h3>
                  </div>
                  <p className="text-3xl font-bold text-slate-900">{dailySummary.entries_count}</p>
                  <p className="text-sm text-slate-600 mt-1">Tasks completed</p>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-purple-600" />
                    </div>
                    <h3 className="font-semibold text-slate-900">Date</h3>
                  </div>
                  <p className="text-3xl font-bold text-slate-900">{formatDate(dailySummary.date)}</p>
                  <p className="text-sm text-slate-600 mt-1">Current view</p>
                </div>
              </div>
            )}

            {/* Chart Area */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-6">
                {view === 'daily' ? 'Today\'s Activity' : view === 'weekly' ? 'This Week' : 'This Month'}
              </h3>
              
              {view === 'daily' ? (
                <div className="space-y-3">
                  {dailySummary?.entries?.length > 0 ? (
                    dailySummary.entries.map((entry) => (
                      <div key={entry.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                        <div>
                          <p className="font-medium text-slate-900">{entry.task_name}</p>
                          {entry.description && <p className="text-sm text-slate-600 mt-1">{entry.description}</p>}
                        </div>
                        <span className="text-sm font-medium text-indigo-600">
                          {entry.is_running ? 'Running' : formatDuration(entry.duration)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-center py-8 text-slate-500">No entries for today</p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {getCurrentData().length > 0 ? (
                    getCurrentData().map((summary) => (
                      <div key={summary.date} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                        <div>
                          <p className="font-medium text-slate-900">{formatDate(summary.date)}</p>
                          <p className="text-sm text-slate-600 mt-1">{summary.entries_count} entries</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-slate-900">{formatDuration(summary.total_duration)}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center py-8 text-slate-500">No data available</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}