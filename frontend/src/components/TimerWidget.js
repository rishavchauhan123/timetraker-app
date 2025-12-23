import { useState } from 'react';
import { useTimer } from '@/contexts/TimerContext';
import { Play, Square } from 'lucide-react';
import { toast } from 'sonner';

export default function TimerWidget({ onTimerUpdate }) {
  const { currentEntry, elapsed, startTimer, stopTimer, formatTime, isRunning } = useTimer();
  const [taskName, setTaskName] = useState('');
  const [description, setDescription] = useState('');

  const handleStart = async (e) => {
    e.preventDefault();
    if (!taskName.trim()) {
      toast.error('Please enter a task name');
      return;
    }

    try {
      await startTimer(taskName, description);
      setTaskName('');
      setDescription('');
      if (onTimerUpdate) onTimerUpdate();
    } catch (error) {
      console.error('Failed to start timer:', error);
    }
  };

  const handleStop = async () => {
    try {
      await stopTimer();
      if (onTimerUpdate) onTimerUpdate();
    } catch (error) {
      console.error('Failed to stop timer:', error);
    }
  };

  return (
    <div className="bg-slate-900 rounded-2xl shadow-2xl p-8" data-testid="timer-widget">
      {/* Timer Display */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Active Timer</h2>
          {isRunning && (
            <span className="flex items-center gap-2 px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              Running
            </span>
          )}
        </div>
        
        <div className="timer-digits text-6xl font-bold text-white mb-2" data-testid="timer-display">
          {formatTime(elapsed)}
        </div>
        
        {currentEntry && (
          <div className="text-slate-400">
            <p className="text-lg font-medium text-white">{currentEntry.task_name}</p>
            {currentEntry.description && (
              <p className="text-sm mt-1">{currentEntry.description}</p>
            )}
          </div>
        )}
      </div>

      {/* Timer Controls */}
      {isRunning ? (
        <button
          onClick={handleStop}
          data-testid="stop-timer-button"
          className="w-full flex items-center justify-center gap-3 h-14 bg-red-600 hover:bg-red-700 text-white rounded-full font-semibold text-lg shadow-xl transition-all duration-200"
        >
          <Square className="w-5 h-5" fill="currentColor" />
          Stop Timer
        </button>
      ) : (
        <form onSubmit={handleStart} className="space-y-4">
          <div>
            <input
              type="text"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              placeholder="What are you working on?"
              data-testid="task-name-input"
              className="w-full h-12 px-4 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:bg-slate-750 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all"
            />
          </div>
          
          <div>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add description (optional)"
              data-testid="description-input"
              className="w-full h-12 px-4 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:bg-slate-750 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all"
            />
          </div>

          <button
            type="submit"
            data-testid="start-timer-button"
            className="w-full flex items-center justify-center gap-3 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-semibold text-lg shadow-xl shadow-indigo-500/30 transition-all duration-200"
          >
            <Play className="w-5 h-5" fill="currentColor" />
            Start Timer
          </button>
        </form>
      )}
    </div>
  );
}