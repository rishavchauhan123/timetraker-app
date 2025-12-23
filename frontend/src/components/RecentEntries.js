import { Clock } from 'lucide-react';

export default function RecentEntries({ entries, onUpdate }) {
  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm" data-testid="recent-entries">
      <div className="p-6 border-b border-slate-100">
        <h3 className="text-lg font-semibold text-slate-900">Recent Activity</h3>
      </div>
      
      <div className="p-6">
        {entries.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No recent entries</p>
          </div>
        ) : (
          <div className="space-y-3">
            {entries.slice(0, 5).map((entry) => (
              <div
                key={entry.id}
                data-testid={`recent-entry-${entry.id}`}
                className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <div className="flex-1">
                  <p className="font-medium text-slate-900">{entry.task_name}</p>
                  {entry.description && (
                    <p className="text-sm text-slate-600 mt-1">{entry.description}</p>
                  )}
                  <p className="text-xs text-slate-500 mt-1">
                    {formatTime(entry.start_time)}
                    {entry.end_time && ` - ${formatTime(entry.end_time)}`}
                  </p>
                </div>
                <div className="ml-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-700">
                    {entry.is_running ? 'Running' : formatDuration(entry.duration)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}