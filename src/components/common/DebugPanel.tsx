/**
 * Sandbox panel for time override
 */

import { useState, useEffect } from 'react';
import { Clock, X, Play, Pause } from 'lucide-react';
import { useDebug } from '../../contexts/DebugContext';
import { minutesToTime, timeToMinutes, getCurrentTimeMinutes } from '../../utils/gtfs';
import { useSettingsStore } from '../../stores/settingsStore';

export function DebugPanel() {
  const { debugTime, setDebugTime, isDebugMode, setDebugMode, isPlaying, setIsPlaying, timeSpeed } = useDebug();
  const sandboxVisible = useSettingsStore((state) => state.sandboxVisible);
  const [isOpen, setIsOpen] = useState(false);
  const [timeInput, setTimeInput] = useState('');

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

const handleToggleSandboxMode = () => {
    if (isDebugMode) {
      // Disable sandbox mode
      setDebugMode(false);
      setDebugTime(null);
      setIsPlaying(false);
    } else {
      // Enable sandbox mode
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

if (!sandboxVisible) {
    return null;
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 left-4 z-[1000] btn btn-circle btn-secondary btn-sm shadow-lg"
        aria-label="Open sandbox panel"
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
            Sandbox Mode
          </h3>
          <button
            onClick={() => setIsOpen(false)}
            className="btn btn-ghost btn-circle btn-xs"
            aria-label="Close sandbox panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sandbox mode toggle */}
        <div className="form-control">
          <label className="label cursor-pointer">
            <span className="label-text">Omogući postavljanje vremena</span>
            <input
              type="checkbox"
              className="toggle toggle-primary"
              checked={isDebugMode}
              onChange={handleToggleSandboxMode}
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

            {/* Current sandbox time display */}
            <div className="alert alert-info mt-2">
              <div className="text-sm">
                <div className="font-bold">
                  Sandbox vrijeme: {debugTime !== null ? minutesToTime(debugTime) : '--:--'}
                </div>
                <div className="text-xs opacity-70">
                  Stvarno vrijeme: {minutesToTime(getCurrentTimeMinutes())}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
