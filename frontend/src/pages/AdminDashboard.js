import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';
import Layout from '@/components/Layout';
import { toast } from 'sonner';
import { Users, Clock, TrendingUp, Activity } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AdminDashboard() {
  const { getAuthHeaders } = useAuth();
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const [usersRes, reportsRes] = await Promise.all([
        axios.get(`${API}/admin/users`, { headers: getAuthHeaders() }),
        axios.get(`${API}/admin/reports`, { headers: getAuthHeaders() })
      ]);
      
      setUsers(usersRes.data);
      setReports(reportsRes.data);
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-testid="admin-dashboard">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Admin Dashboard</h1>
          <p className="text-slate-600 mt-2">Manage users and view platform analytics</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Stats Cards */}
            {reports && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                      <Users className="w-5 h-5 text-indigo-600" />
                    </div>
                    <h3 className="font-semibold text-slate-900">Total Users</h3>
                  </div>
                  <p className="text-3xl font-bold text-slate-900">{reports.total_users}</p>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                      <Activity className="w-5 h-5 text-green-600" />
                    </div>
                    <h3 className="font-semibold text-slate-900">Total Entries</h3>
                  </div>
                  <p className="text-3xl font-bold text-slate-900">{reports.total_entries}</p>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-purple-600" />
                    </div>
                    <h3 className="font-semibold text-slate-900">Total Time</h3>
                  </div>
                  <p className="text-3xl font-bold text-slate-900">{formatDuration(reports.total_duration)}</p>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-orange-600" />
                    </div>
                    <h3 className="font-semibold text-slate-900">Avg Duration</h3>
                  </div>
                  <p className="text-3xl font-bold text-slate-900">{formatDuration(Math.floor(reports.average_duration_per_entry))}</p>
                </div>
              </div>
            )}

            {/* Users Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-xl font-semibold text-slate-900">All Users</h2>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">User</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Entries</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Total Time</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Last Activity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {users.map((userStat) => (
                      <tr key={userStat.user.id} className="hover:bg-slate-50 transition-colors" data-testid={`user-row-${userStat.user.id}`}>
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-900">{userStat.user.name}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-700">{userStat.user.email}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                            userStat.user.role === 'admin'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {userStat.user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-700">{userStat.total_entries}</td>
                        <td className="px-6 py-4 text-sm text-slate-700">{formatDuration(userStat.total_duration)}</td>
                        <td className="px-6 py-4 text-sm text-slate-700">{formatDate(userStat.last_activity)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}