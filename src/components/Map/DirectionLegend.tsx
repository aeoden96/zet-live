import type { Stop } from '../../utils/gtfs';
// import type { Route } from '../../utils/gtfs';
import { getDirectionColor } from './directionColors';

interface DirectionLegendProps {
  orderedStops?: Record<string, string[]>;
  stopsById: Map<string, Stop>;
  routeType: number | null;
  compact?: boolean;
  inline?: boolean;
}

export function DirectionLegend({ orderedStops, stopsById, routeType, compact = false, inline = false }: DirectionLegendProps) {
  if (!orderedStops) return null;

  // Sort keys numerically for stable ordering (0,1,...)
  const keys = Object.keys(orderedStops).sort((a, b) => Number(a) - Number(b));

  const containerClass = compact
    ? 'bg-base-100 rounded-md border border-base-200 px-2 py-1 w-36 text-[11px] shadow'
    : 'bg-base-100 rounded-xl shadow-xl border border-base-200 p-3 w-44 text-xs';
  const itemsClass = inline ? 'flex items-center gap-2' : (compact ? 'space-y-1' : '');

  return (
    <div className={containerClass}>
      {!compact && <div className="font-semibold mb-2">Smjer</div>}
      <div className={itemsClass}>
        {keys.map((k, idx) => {
          const ids = orderedStops[k] || [];
          const endId = ids[ids.length - 1] || ids[0] || null;
          const stopName = endId ? (stopsById.get(endId)?.name || endId) : '—';
          const color = getDirectionColor(routeType ?? null, idx);

          return (
            <div key={k} className={inline ? 'flex items-center gap-2' : 'flex items-center gap-2'}>
              <div style={{ width: compact ? 12 : 14, height: compact ? 10 : 14, borderRadius: 3, background: color, boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.12)' }} />
              <div className={compact ? 'text-[11px] text-base-content/80' : 'text-sm text-base-content/90'}>
                {compact ? stopName : `Smjer ${stopName}`}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
