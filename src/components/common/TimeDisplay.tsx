/**
 * Current time and service display
 */

import { useState, useEffect } from 'react';
import { minutesToTime } from '../../utils/gtfs';
import { useCurrentTime } from '../../hooks/useCurrentTime';

interface TimeDisplayProps {
  serviceId: string | null;
  calendar: Record<string, string>;
}

const SERVICE_LABELS: Record<string, string> = {
  '0_20': 'Radni dan',
  '0_21': 'Subota',
  '0_22': 'Nedjelja',
  '0_23': 'Praznik (Ned)',
  '0_24': 'Praznik (Rad)',
  '0_25': 'Praznik (Sub)',
  '0_26': 'Poseban (Ned)',
  '0_27': 'Poseban (Rad)',
  '0_28': 'Poseban (Sub)',
};

export function TimeDisplay({ serviceId, calendar }: TimeDisplayProps) {
  const currentTime = useCurrentTime();
  const [, setTick] = useState(0);

  useEffect(() => {
    // Force re-render every 10 seconds to update real time
    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const serviceLabel = serviceId ? SERVICE_LABELS[serviceId] || serviceId : 'Nepoznat';
  
  // Check if we're using fallback service (date not in calendar)
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const isEstimated = serviceId && !calendar[today];

  return (
    <div className="text-xs lg:text-sm">
      <div className="font-bold text-sm lg:text-base">{minutesToTime(currentTime)}</div>
      <div className="text-xs opacity-70">
        {serviceLabel}
        {isEstimated && ' *'}
      </div>
      {isEstimated && (
        <div className="text-xs opacity-50 mt-1">
          * Procijenjen raspored
        </div>
      )}
    </div>
  );
}
