import { Folder, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ProjectsList({ projects, onUpdate }) {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm" data-testid="projects-list">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">Projects</h3>
        <button
          onClick={() => navigate('/projects')}
          data-testid="view-all-projects"
          className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
        >
          View All
        </button>
      </div>
      
      <div className="p-6">
        {projects.length === 0 ? (
          <div className="text-center py-8">
            <Folder className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 mb-3">No projects yet</p>
            <button
              onClick={() => navigate('/projects')}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Create your first project
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {projects.slice(0, 5).map((project) => (
              <div
                key={project.id}
                data-testid={`project-item-${project.id}`}
                className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                onClick={() => navigate('/projects')}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${project.color}20` }}
                >
                  <Folder className="w-5 h-5" style={{ color: project.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 truncate">{project.name}</p>
                  <p className="text-xs text-slate-500">Active</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}