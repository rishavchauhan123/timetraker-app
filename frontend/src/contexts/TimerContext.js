import { createContext, useContext, useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

const TimerContext = createContext();

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const useTimer = () => {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error('useTimer must be used within TimerProvider');
  }
  return context;
};

export const TimerProvider = ({ children }) => {
  const { token, getAuthHeaders } = useAuth();
  const [currentEntry, setCurrentEntry] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (token) {
      fetchCurrentTimer();
    }
  }, [token]);

  useEffect(() => {
    if (currentEntry && currentEntry.is_running) {
      intervalRef.current = setInterval(() => {
        const start = new Date(currentEntry.start_time);
        const now = new Date();
        setElapsed(Math.floor((now - start) / 1000));
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      setElapsed(0);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [currentEntry]);

  const fetchCurrentTimer = async () => {
    try {
      const response = await axios.get(`${API}/timer/current`, {
        headers: getAuthHeaders()
      });
      setCurrentEntry(response.data);
    } catch (error) {
      console.error('Failed to fetch current timer:', error);
    }
  };

  const startTimer = async (taskName, description = '', projectId = null, tags = []) => {
    try {
      const response = await axios.post(
        `${API}/timer/start`,
        { task_name: taskName, description, project_id: projectId, tags },
        { headers: getAuthHeaders() }
      );
      setCurrentEntry(response.data);
      toast.success('Timer started!');
      return response.data;
    } catch (error) {
      toast.error('Failed to start timer');
      throw error;
    }
  };

  const stopTimer = async () => {
    try {
      const response = await axios.post(
        `${API}/timer/stop`,
        {},
        { headers: getAuthHeaders() }
      );
      setCurrentEntry(null);
      setElapsed(0);
      toast.success('Timer stopped!');
      return response.data;
    } catch (error) {
      toast.error('Failed to stop timer');
      throw error;
    }
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <TimerContext.Provider
      value={{
        currentEntry,
        elapsed,
        startTimer,
        stopTimer,
        formatTime,
        isRunning: currentEntry?.is_running || false
      }}
    >
      {children}
    </TimerContext.Provider>
  );
};