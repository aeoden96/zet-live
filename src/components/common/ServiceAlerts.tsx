/**
 * Service alerts banner + panel.
 * Shows a badge when active alerts exist; expands to a list panel on click.
 */

import { useState } from 'react';
import { AlertTriangle, X, ChevronRight } from 'lucide-react';
import type { ParsedServiceAlert } from '../../utils/realtime';
import type { Route } from '../../utils/gtfs';

const EFFECT_HR: Record<string, string> = {
  NO_SERVICE: 'Nema usluge',
  REDUCED_SERVICE: 'Smanjena usluga',
  SIGNIFICANT_DELAYS: 'Velika kašnjenja',
  DETOUR: 'Preusmjeravanje',
  ADDITIONAL_SERVICE: 'Dodatna usluga',
  MODIFIED_SERVICE: 'Izmijenjena usluga',
  STOP_MOVED: 'Stanica premještena',
  OTHER_EFFECT: 'Ostalo',
  UNKNOWN_EFFECT: 'Nepoznato',
};

interface ServiceAlertsProps {
  alerts: ParsedServiceAlert[];
  routesById: Map<string, Route>;
  selectedRouteId?: string | null;
  onRouteClick?: (routeId: string, routeType: number) => void;
}

export function ServiceAlerts({ alerts, routesById, selectedRouteId, onRouteClick }: ServiceAlertsProps) {
  const [open, setOpen] = useState(false);

  if (alerts.length === 0) return null;

  // When a route is selected, highlight relevant alerts first
  const sorted = selectedRouteId
    ? [
        ...alerts.filter((a) => a.routeIds.includes(selectedRouteId!)),
        ...alerts.filter((a) => !a.routeIds.includes(selectedRouteId!)),
      ]
    : alerts;

  const hasRelevant = selectedRouteId && alerts.some((a) => a.routeIds.includes(selectedRouteId));

  return (
    <>
      {/* Badge button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className={`badge gap-1.5 shadow cursor-pointer transition-all ${
          hasRelevant
            ? 'badge-error hover:badge-outline'
            : 'badge-warning hover:badge-outline'
        }`}
        title="Obavijesti o prometu"
      >
        <AlertTriangle className="w-3 h-3" />
        {alerts.length} {alerts.length === 1 ? 'obavijest' : alerts.length < 5 ? 'obavijesti' : 'obavijesti'}
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed inset-0 z-[1150] flex items-start justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            style={{ animation: 'backdrop-fade-in 0.15s ease-out' }}
            onClick={() => setOpen(false)}
          />

          {/* Modal */}
          <div
            className="relative w-full max-w-lg mx-2 mt-2 sm:mt-8 max-h-[90vh] bg-base-100 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            style={{ animation: 'modal-fade-in 0.2s ease-out' }}
          >
            {/* Header */}
            <div className="p-4 border-b border-base-300 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-warning shrink-0" />
              <h2 className="text-lg font-bold flex-1">Prometne obavijesti</h2>
              <button
                onClick={() => setOpen(false)}
                className="btn btn-ghost btn-circle btn-sm min-h-[44px] min-w-[44px]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto overscroll-contain divide-y divide-base-300">
              {sorted.map((alert) => {
                const isRelevant = selectedRouteId && alert.routeIds.includes(selectedRouteId);
                return (
                  <div key={alert.id} className={`p-4 ${isRelevant ? 'bg-error/5' : ''}`}>
                    {/* Effect badge */}
                    <div className="flex items-start gap-2 mb-2">
                      <span className={`badge badge-sm shrink-0 mt-0.5 ${isRelevant ? 'badge-error' : 'badge-warning'}`}>
                        {EFFECT_HR[alert.effect] ?? alert.effect}
                      </span>
                    </div>

                    {/* Header text */}
                    {alert.header && (
                      <p className="font-semibold text-sm mb-1">{alert.header}</p>
                    )}

                    {/* Description */}
                    {alert.description && (
                      <p className="text-xs text-base-content/70 mb-2 whitespace-pre-wrap">
                        {alert.description}
                      </p>
                    )}

                    {/* Affected routes */}
                    {alert.routeIds.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {alert.routeIds.map((rid) => {
                          const route = routesById.get(rid);
                          if (!route) return null;
                          return (
                            <button
                              key={rid}
                              onClick={() => {
                                onRouteClick?.(rid, route.type);
                                setOpen(false);
                              }}
                              className={`badge ${
                                route.type === 0 ? 'badge-primary' : 'badge-accent'
                              } badge-sm font-bold gap-1 hover:opacity-80 transition-opacity`}
                            >
                              {route.shortName}
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
