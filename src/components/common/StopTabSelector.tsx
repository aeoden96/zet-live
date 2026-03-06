/**
 * Tab selector for stop view: "Vozila" (live GPS) and "Red vožnje" (timetable).
 */

import { Bus, Clock } from 'lucide-react';

export type StopTab = 'vehicles' | 'timetable';

interface StopTabSelectorProps {
  activeTab: StopTab;
  onTabChange: (tab: StopTab) => void;
  /** Number of live GPS vehicles — shown as a badge on the Vehicles tab */
  liveVehicleCount?: number;
  /** Smaller variant for compact StopInfoBar */
  compact?: boolean;
  /** When true, the Vozila (vehicles) tab is not rendered. Useful for modes without realtime. */
  hideVehicles?: boolean;
}

export function StopTabSelector({
  activeTab,
  onTabChange,
  liveVehicleCount,
  compact = false,
  hideVehicles = false,
}: StopTabSelectorProps) {
  // reduce overall padding/size so tabs take less space
  const tabClass = compact ? 'tab text-xs px-2 py-1' : 'tab text-xs px-3 py-1';
  const activeClass = 'tab-active font-semibold';
  const iconSize = compact ? 'w-3 h-3' : 'w-4 h-4';

  return (
    <div role="tablist" className="tabs tabs-box bg-base-200 rounded-lg w-full">
      {!hideVehicles && (
        <button
          role="tab"
          className={`${tabClass} ${activeTab === 'vehicles' ? activeClass : ''} flex flex-1 items-center justify-center gap-1`}
          onClick={() => onTabChange('vehicles')}
        >
          <Bus className={iconSize} />
          <span>Vozila u blizini</span>
          {liveVehicleCount !== undefined && liveVehicleCount > 0 && (
            <span className={`badge badge-success badge-xs font-bold tabular-nums`}>
              {liveVehicleCount}
            </span>
          )}
        </button>
      )}
      <button
        role="tab"
        className={`${tabClass} ${activeTab === 'timetable' ? activeClass : ''} flex flex-1 items-center justify-center gap-1`}
        onClick={() => onTabChange('timetable')}
      >
        <Clock className={iconSize} />
        <span>Red vožnje</span>
      </button>
    </div>
  );
}
