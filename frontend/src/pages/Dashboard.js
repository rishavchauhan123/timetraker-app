import { useState, useEffect } from 'react';
import { useTimer } from '@/contexts/TimerContext';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';
import Layout from '@/components/Layout';
import TimerWidget from '@/components/TimerWidget';
import RecentEntries from '@/components/RecentEntries';
import ProjectsList from '@/components/ProjectsList';
import DailySummary from '@/components/DailySummary';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Dashboard() {
  const { getAuthHeaders } = useAuth();
  const { currentEntry } = useTimer();
  const [entries, setEntries] = useState([]);
  const [projects, setProjects] = useState([]);
  const [dailySummary, setDailySummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [currentEntry]);

  const fetchDashboardData = async () => {
    try {
      const [entriesRes, projectsRes, summaryRes] = await Promise.all([
        axios.get(`${API}/entries?limit=10`, { headers: getAuthHeaders() }),
        axios.get(`${API}/projects`, { headers: getAuthHeaders() }),
        axios.get(`${API}/entries/summary/daily`, { headers: getAuthHeaders() })
      ]);
      
      setEntries(entriesRes.data);
      setProjects(projectsRes.data);
      setDailySummary(summaryRes.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-testid="dashboard-page">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-slate-600 mt-2">Welcome back! Track your time and boost productivity.</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Timer Widget - Full width on mobile, 8 cols on desktop */}
            <div className="lg:col-span-8">
              <TimerWidget onTimerUpdate={fetchDashboardData} />
            </div>

            {/* Daily Summary - 4 cols */}
            <div className="lg:col-span-4">
              <DailySummary summary={dailySummary} />
            </div>

            {/* Recent Entries - 8 cols */}
            <div className="lg:col-span-8">
              <RecentEntries entries={entries} onUpdate={fetchDashboardData} />
            </div>

            {/* Projects List - 4 cols */}
            <div className="lg:col-span-4">
              <ProjectsList projects={projects} onUpdate={fetchDashboardData} />
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}