/**
 * Debug panel for time override
 */

import { useState, useEffect } from 'react';
import { Clock, X, Play, Pause, Database, Trash2 } from 'lucide-react';
import { useDebug } from '../../contexts/DebugContext';
import { minutesToTime, timeToMinutes, getCurrentTimeMinutes } from '../../utils/gtfs';
import { useDataCacheStore } from '../../stores/dataCache';

export function DebugPanel() {
  const { debugTime, setDebugTime, isDebugMode, setDebugMode, isPlaying, setIsPlaying, timeSpeed } = useDebug();
  const { getCacheStats, clearCache, version } = useDataCacheStore();
  const [isOpen, setIsOpen] = useState(false);
  const [timeInput, setTimeInput] = useState('');
  const [cacheStats, setCacheStats] = useState({ entryCount: 0, sizeBytes: 0 });

  // Update cache stats when panel is open
  useEffect(() => {
    if (isOpen) {
      setCacheStats(getCacheStats());
      const interval = setInterval(() => {
        setCacheStats(getCacheStats());
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isOpen, getCacheStats]);

  // Initialize time input with current time
  useEffect(() => {
    if (!timeInput) {
      const currentMinutes = debugTime ?? getCurrentTimeMinutes();
      setTimeInput(minutesToTime(currentMinutes));
    }
  }, [debugTime, timeInput]);

  // Update input when debug time changes (smooth updates)
  useEffect(() => {
    if (isPlaying && debugTime !== null) {
      // Update less frequently to avoid too many updates
      const interval = setInterval(() => {
        setTimeInput(minutesToTime(debugTime));
      }, 500);
      return () => clearInterval(interval);
    }
  }, [isPlaying, debugTime]);

  // Update input when debug time changes externally
  useEffect(() => {
    if (debugTime !== null) {
      setTimeInput(minutesToTime(debugTime));
    }
  }, [debugTime]);

  const handleToggleDebugMode = () => {
    if (isDebugMode) {
      // Disable debug mode
      setDebugMode(false);
      setDebugTime(null);
      setIsPlaying(false);
    } else {
      // Enable debug mode
      setDebugMode(true);
      const currentMinutes = getCurrentTimeMinutes();
      setDebugTime(currentMinutes);
      setTimeInput(minutesToTime(currentMinutes));
    }
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTimeInput(value);
    
    if (value.match(/^\d{2}:\d{2}$/)) {
      const minutes = timeToMinutes(value);
      setDebugTime(minutes);
    }
  };

  const handleSetTime = (minutes: number) => {
    setDebugTime(minutes);
    setTimeInput(minutesToTime(minutes));
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleClearCache = () => {
    if (confirm('Are you sure you want to clear all cached data? The app will need to re-download data on next use.')) {
      clearCache();
      setCacheStats({ entryCount: 0, sizeBytes: 0 });
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 left-4 z-[1000] btn btn-circle btn-secondary btn-sm shadow-lg"
        aria-label="Open debug panel"
      >
        <Clock className="w-4 h-4" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 z-[1000] card bg-base-100 shadow-xl w-80">
      <div className="card-body p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Debug Mode
          </h3>
          <button
            onClick={() => setIsOpen(false)}
            className="btn btn-ghost btn-circle btn-xs"
            aria-label="Close debug panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Debug mode toggle */}
        <div className="form-control">
          <label className="label cursor-pointer">
            <span className="label-text">Enable time override</span>
            <input
              type="checkbox"
              className="toggle toggle-primary"
              checked={isDebugMode}
              onChange={handleToggleDebugMode}
            />
          </label>
        </div>

        {isDebugMode && (
          <>
            {/* Time input */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Current time (HH:MM)</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="time"
                  value={timeInput}
                  onChange={handleTimeChange}
                  className="input input-bordered input-sm flex-1"
                />
                <button
                  onClick={handlePlayPause}
                  className={`btn btn-sm ${isPlaying ? 'btn-warning' : 'btn-success'}`}
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
              </div>
              {isPlaying && (
                <label className="label">
                  <span className="label-text-alt text-warning">
                    ⚡ Auto-advancing ({timeSpeed} min/sec)
                  </span>
                </label>
              )}
            </div>

            {/* Quick time presets */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Quick presets</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleSetTime(6 * 60)} // 6:00
                  className="btn btn-xs btn-outline"
                >
                  06:00
                </button>
                <button
                  onClick={() => handleSetTime(9 * 60)} // 9:00
                  className="btn btn-xs btn-outline"
                >
                  09:00
                </button>
                <button
                  onClick={() => handleSetTime(12 * 60)} // 12:00
                  className="btn btn-xs btn-outline"
                >
                  12:00
                </button>
                <button
                  onClick={() => handleSetTime(15 * 60)} // 15:00
                  className="btn btn-xs btn-outline"
                >
                  15:00
                </button>
                <button
                  onClick={() => handleSetTime(18 * 60)} // 18:00
                  className="btn btn-xs btn-outline"
                >
                  18:00
                </button>
                <button
                  onClick={() => handleSetTime(22 * 60)} // 22:00
                  className="btn btn-xs btn-outline"
                >
                  22:00
                </button>
              </div>
            </div>

            {/* Current debug time display */}
            <div className="alert alert-info mt-2">
              <div className="text-sm">
                <div className="font-bold">
                  Debug time: {debugTime !== null ? minutesToTime(debugTime) : '--:--'}
                </div>
                <div className="text-xs opacity-70">
                  Real time: {minutesToTime(getCurrentTimeMinutes())}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Data Cache Section - Always visible */}
        <div className="divider my-3"></div>
        
        <div className="space-y-3">
          <h4 className="font-bold flex items-center gap-2 text-sm">
            <Database className="w-4 h-4" />
            Data Cache
          </h4>

          {/* Cache stats */}
          <div className="bg-base-200 rounded-lg p-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="opacity-70">Cached entries:</span>
              <span className="font-mono font-medium">{cacheStats.entryCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-70">Cache size:</span>
              <span className="font-mono font-medium">{formatBytes(cacheStats.sizeBytes)}</span>
            </div>
            {version && (
              <div className="flex justify-between">
                <span className="opacity-70">Version:</span>
                <span className="font-mono font-medium text-xs">{version}</span>
              </div>
            )}
          </div>

          {/* Clear cache button */}
          <button
            onClick={handleClearCache}
            className="btn btn-error btn-sm btn-outline w-full"
            disabled={cacheStats.entryCount === 0}
          >
            <Trash2 className="w-4 h-4" />
            Clear Cache
          </button>
        </div>
      </div>
    </div>
  );
}
