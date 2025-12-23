import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';
import Layout from '@/components/Layout';
import { toast } from 'sonner';
import { Plus, Trash2, Folder } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const PRESET_COLORS = [
  '#4F46E5', '#7C3AED', '#DB2777', '#DC2626', '#EA580C',
  '#D97706', '#CA8A04', '#65A30D', '#16A34A', '#059669',
  '#0D9488', '#0891B2', '#0284C7', '#2563EB', '#4F46E5'
];

export default function Projects() {
  const { getAuthHeaders } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', color: '#4F46E5' });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await axios.get(`${API}/projects`, { headers: getAuthHeaders() });
      setProjects(response.data);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const createProject = async (e) => {
    e.preventDefault();
    
    try {
      await axios.post(`${API}/projects`, newProject, { headers: getAuthHeaders() });
      toast.success('Project created!');
      setNewProject({ name: '', color: '#4F46E5' });
      setShowForm(false);
      fetchProjects();
    } catch (error) {
      toast.error('Failed to create project');
    }
  };

  const deleteProject = async (projectId) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;
    
    try {
      await axios.delete(`${API}/projects/${projectId}`, { headers: getAuthHeaders() });
      toast.success('Project deleted');
      fetchProjects();
    } catch (error) {
      toast.error('Failed to delete project');
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-testid="projects-page">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Projects</h1>
            <p className="text-slate-600 mt-2">Organize your time entries by projects</p>
          </div>
          
          <button
            onClick={() => setShowForm(!showForm)}
            data-testid="toggle-project-form"
            className="flex items-center gap-2 h-11 px-6 bg-indigo-600 text-white rounded-full font-medium hover:bg-indigo-700 shadow-lg shadow-indigo-500/30 transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            New Project
          </button>
        </div>

        {/* Create Project Form */}
        {showForm && (
          <div className="mb-6 bg-white rounded-xl border border-slate-200 shadow-sm p-6" data-testid="project-form">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Create New Project</h3>
            <form onSubmit={createProject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Project Name</label>
                <input
                  type="text"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  required
                  data-testid="project-name-input"
                  className="w-full h-11 px-4 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                  placeholder="Website Redesign"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Color</label>
                <div className="flex gap-2 flex-wrap">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewProject({ ...newProject, color })}
                      data-testid={`color-${color}`}
                      className={`w-10 h-10 rounded-lg transition-all ${
                        newProject.color === color
                          ? 'ring-2 ring-offset-2 ring-indigo-600 scale-110'
                          : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  data-testid="submit-project"
                  className="h-11 px-6 bg-indigo-600 text-white rounded-full font-medium hover:bg-indigo-700 shadow-lg shadow-indigo-500/30 transition-all duration-200"
                >
                  Create Project
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="h-11 px-6 bg-white text-slate-700 border border-slate-200 rounded-full font-medium hover:bg-slate-50 transition-all duration-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent"></div>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-16 bg-slate-50 rounded-xl border border-slate-200">
            <Folder className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No projects yet</h3>
            <p className="text-slate-600">Create your first project to get started!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div
                key={project.id}
                data-testid={`project-${project.id}`}
                className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${project.color}20` }}
                    >
                      <Folder className="w-6 h-6" style={{ color: project.color }} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{project.name}</h3>
                      <p className="text-sm text-slate-500">Active</p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => deleteProject(project.id)}
                    data-testid={`delete-project-${project.id}`}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}