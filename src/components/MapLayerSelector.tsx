import { useState, useEffect, useRef } from 'react';
import { Settings, HelpCircle, Bus, Bike, Construction, LocateFixed } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSettingsStore } from '../stores/settingsStore';

const RADIUS = 120; // px, distance from hub center to item center

function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** A menu item — either a layer toggle or a one-shot action */
interface MenuItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  /** Angle in standard math convention: 0° = right, 90° = up, CCW */
  angle: number;
  /** For layer toggles */
  active?: boolean;
  onToggle?: () => void;
  /** For action items (Help, Settings) */
  onAction?: () => void;
  /** DaisyUI btn color class when active / highlighted */
  activeClass: string;
}

export interface MapLayerSelectorProps {
  onHelpClick: () => void;
  onLocateClick: () => void;
  locating?: boolean;
}

export function MapLayerSelector({ onHelpClick, onLocateClick, locating = false }: MapLayerSelectorProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const showAllVehicles = useSettingsStore((s) => s.showAllVehicles);
  const setShowAllVehicles = useSettingsStore((s) => s.setShowAllVehicles);
  const showBikeStations = useSettingsStore((s) => s.showBikeStations);
  const setShowBikeStations = useSettingsStore((s) => s.setShowBikeStations);
  const showRoadClosures = useSettingsStore((s) => s.showRoadClosures);
  const setShowRoadClosures = useSettingsStore((s) => s.setShowRoadClosures);

  // Close when clicking outside
  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (e: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [open]);

  // Angles fan LEFT and DOWN from the top-right position (safe screen area)
  // Standard math: 0°=right, 90°=up, CCW positive
  // 168°–283° → 23° apart, 115° arc — chord ≈ 48 px, clears 44 px buttons
  const items: MenuItem[] = [
    {
      key: 'locate',
      label: 'Lokacija',
      icon: locating
        ? <span className="loading loading-spinner loading-xs" />
        : <LocateFixed className="w-5 h-5" />,
      angle: 168,
      onAction: () => { onLocateClick(); setOpen(false); },
      activeClass: 'btn-info',
    },
    {
      key: 'help',
      label: 'Pomoć',
      icon: <HelpCircle className="w-5 h-5" />,
      angle: 191,
      onAction: () => { onHelpClick(); setOpen(false); },
      activeClass: 'btn-secondary',
    },
    {
      key: 'settings',
      label: 'Postavke',
      icon: <Settings className="w-5 h-5" />,
      angle: 214,
      onAction: () => { navigate('/settings'); setOpen(false); },
      activeClass: 'btn-secondary',
    },
    {
      key: 'vehicles',
      label: 'Sva vozila',
      icon: <Bus className="w-5 h-5" />,
      angle: 237,
      active: showAllVehicles,
      onToggle: () => setShowAllVehicles(!showAllVehicles),
      activeClass: 'btn-success',
    },
    {
      key: 'bikes',
      label: 'BAJS bicikli',
      icon: <Bike className="w-5 h-5" />,
      angle: 260,
      active: showBikeStations,
      onToggle: () => setShowBikeStations(!showBikeStations),
      activeClass: 'btn-warning',
    },
    {
      key: 'closures',
      label: 'Zatv. ceste',
      icon: <Construction className="w-5 h-5" />,
      angle: 283,
      active: showRoadClosures,
      onToggle: () => setShowRoadClosures(!showRoadClosures),
      activeClass: 'btn-error',
    },
  ];

  // Hub size: 48×48 px. Items are positioned relative to hub center.
  const HUB_SIZE = 48;
  const hubCenter = HUB_SIZE / 2; // 24

  const hasActiveLayer = items.some((it) => it.active);

  return (
    // Overflow visible so items can extend outside the hub boundaries
    <div ref={containerRef} style={{ position: 'relative', width: HUB_SIZE, height: HUB_SIZE }}>

      {/* SVG spoke lines */}
      <svg
        style={{
          position: 'absolute',
          left: -RADIUS - 32,
          top: -RADIUS - 32,
          width: (RADIUS + 32) * 2 + HUB_SIZE,
          height: (RADIUS + 32) * 2 + HUB_SIZE,
          pointerEvents: 'none',
          overflow: 'visible',
        }}
        aria-hidden="true"
      >
        {items.map((item) => {
          const rad = degToRad(item.angle);
          const dx = Math.cos(rad) * RADIUS;
          const dy = -Math.sin(rad) * RADIUS;
          const svgOriginX = RADIUS + 32 + hubCenter;
          const svgOriginY = RADIUS + 32 + hubCenter;
          return (
            <line
              key={item.key}
              x1={svgOriginX}
              y1={svgOriginY}
              x2={svgOriginX + dx}
              y2={svgOriginY + dy}
              stroke="currentColor"
              strokeWidth="1.5"
              strokeDasharray="4 3"
              className="text-base-content/25"
              style={{
                transition: open
                  ? 'opacity 250ms ease 50ms'
                  : 'opacity 150ms ease',
                opacity: open ? 1 : 0,
              }}
            />
          );
        })}
      </svg>

      {/* Radial items */}
      {items.map((item, i) => {
        const rad = degToRad(item.angle);
        const dx = Math.cos(rad) * RADIUS;
        const dy = -Math.sin(rad) * RADIUS;
        const delay = open ? i * 40 : (items.length - 1 - i) * 30;
        const isToggle = item.onToggle != null;

        return (
          <div
            key={item.key}
            style={{
              position: 'absolute',
              left: hubCenter + (open ? dx : 0),
              top: hubCenter + (open ? dy : 0),
              transform: 'translate(-50%, -50%)',
              transition: `left ${open ? 200 + delay : 150}ms ease,
                           top ${open ? 200 + delay : 150}ms ease,
                           opacity ${open ? 180 + delay : 120}ms ease`,
              opacity: open ? 1 : 0,
              pointerEvents: open ? 'auto' : 'none',
            }}
          >
            <div className="flex flex-col items-center gap-0.5">
              <button
                className={`btn btn-circle btn-sm w-11 h-11 shadow-md border-2 transition-colors
                  ${isToggle && item.active
                    ? `${item.activeClass} border-transparent`
                    : !isToggle
                      ? `btn-neutral border-transparent hover:${item.activeClass}`
                      : 'btn-neutral border-transparent'
                  }`}
                onClick={() => {
                  if (item.onAction) item.onAction();
                  else if (item.onToggle) item.onToggle();
                }}
                title={item.label}
              >
                {item.icon}
              </button>
              <span
                className="text-[9px] font-semibold leading-tight whitespace-nowrap
                  bg-base-100/85 backdrop-blur-sm text-base-content px-1.5 py-0.5 rounded-full
                  border border-base-200/50 shadow-sm"
              >
                {item.label}
              </span>
            </div>
          </div>
        );
      })}

      {/* Hub button — Settings gear icon */}
      <button
        className={`btn btn-circle shadow-lg transition-all duration-200
          ${open ? 'btn-primary scale-110' : 'btn-neutral'}
        `}
        style={{ width: HUB_SIZE, height: HUB_SIZE }}
        onClick={() => setOpen((o) => !o)}
        title={open ? 'Zatvori izbornik' : 'Izbornik'}
        aria-haspopup="true"
        aria-expanded={open}
      >
        <Settings
          className={`w-5 h-5 transition-transform duration-300 ${open ? 'rotate-90' : ''}`}
        />
        {/* Dot badge when a layer is active and menu is closed */}
        {!open && hasActiveLayer && (
          <span
            className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-success border-2 border-base-100"
            aria-hidden="true"
          />
        )}
      </button>
    </div>
  );
}
