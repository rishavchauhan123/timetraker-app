import { Clock, TrendingUp } from 'lucide-react';

export default function DailySummary({ summary }) {
  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return { hours, minutes };
  };

  const duration = summary ? formatDuration(summary.total_duration) : { hours: 0, minutes: 0 };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm" data-testid="daily-summary">
      <div className="p-6 border-b border-slate-100">
        <h3 className="text-lg font-semibold text-slate-900">Today's Summary</h3>
      </div>
      
      <div className="p-6 space-y-6">
        {/* Total Time */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
              <Clock className="w-4 h-4 text-indigo-600" />
            </div>
            <span className="text-sm font-medium text-slate-600">Total Time</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-slate-900">{duration.hours}</span>
            <span className="text-lg text-slate-600">h</span>
            <span className="text-4xl font-bold text-slate-900">{duration.minutes}</span>
            <span className="text-lg text-slate-600">m</span>
          </div>
        </div>

        {/* Entries Count */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-green-600" />
            </div>
            <span className="text-sm font-medium text-slate-600">Tasks Completed</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-slate-900">{summary?.entries_count || 0}</span>
            <span className="text-lg text-slate-600">tasks</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-600">Daily Goal (8h)</span>
            <span className="text-sm font-medium text-indigo-600">
              {Math.min(Math.round((duration.hours / 8) * 100), 100)}%
            </span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 rounded-full transition-all duration-500"
              style={{ width: `${Math.min((duration.hours / 8) * 100, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}