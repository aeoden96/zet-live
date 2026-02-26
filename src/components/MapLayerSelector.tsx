import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Settings, HelpCircle, Bus, Bike, Construction, LocateFixed, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSettingsStore } from '../stores/settingsStore';

/** Radius from hub center to each item in the centered overlay */
const RADIUS = 130;
/** Gear button size in px */
const HUB_SIZE = 48;

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
  /** Whether to show a colored badge dot on the corner gear when active */
  showDot?: boolean;
}

export interface MapLayerSelectorProps {
  onHelpClick: () => void;
  onLocateClick: () => void;
  locating?: boolean;
}

export function MapLayerSelector({ onHelpClick, onLocateClick, locating = false }: MapLayerSelectorProps) {
  const [open, setOpen] = useState(false);
  /** Portal is mounted */
  const [visible, setVisible] = useState(false);
  /** Hub has slid to / is at screen center */
  const [hubAtCenter, setHubAtCenter] = useState(false);
  /** Items are fanned out */
  const [expanded, setExpanded] = useState(false);
  /** Corner position of the gear button (captured on open) */
  const [cornerPos, setCornerPos] = useState({ x: 0, y: 0 });
  /** Screen-center hub position (captured on open) */
  const [centerPos, setCenterPos] = useState({ x: 0, y: 0 });

  const hubRef = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();

  const showAllVehicles = useSettingsStore((s) => s.showAllVehicles);
  const setShowAllVehicles = useSettingsStore((s) => s.setShowAllVehicles);
  const showBikeStations = useSettingsStore((s) => s.showBikeStations);
  const setShowBikeStations = useSettingsStore((s) => s.setShowBikeStations);
  const showRoadClosures = useSettingsStore((s) => s.showRoadClosures);
  const setShowRoadClosures = useSettingsStore((s) => s.setShowRoadClosures);
  // ── Animation state machine ──────────────────────────────────────────────
  useEffect(() => {
    let raf1: number;
    let raf2: number;
    let t1: ReturnType<typeof setTimeout>;
    let t2: ReturnType<typeof setTimeout>;
    let t3: ReturnType<typeof setTimeout>;

    if (open) {
      // opening: portal mounts at corner → hub slides to center → items fan out
      setVisible(true);
      raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => setHubAtCenter(true));
      });
      t1 = setTimeout(() => setExpanded(true), 390);
    } else {
      // closing: items collapse → hub slides back → portal unmounts
      setExpanded(false);
      t2 = setTimeout(() => setHubAtCenter(false), 260);
      t3 = setTimeout(() => setVisible(false), 680);
    }

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [open]);

  const handleOpen = () => {
    if (!open && hubRef.current) {
      const rect = hubRef.current.getBoundingClientRect();
      setCornerPos({ x: rect.left, y: rect.top });
      setCenterPos({
        x: window.innerWidth / 2 - HUB_SIZE / 2,
        y: window.innerHeight / 2 - HUB_SIZE / 2,
      });
    }
    setOpen((o) => !o);
  };

  const items: MenuItem[] = [
    {
      key: 'help',
      label: 'Pomoć',
      icon: <HelpCircle className="w-5 h-5" />,
      angle: 30,
      onAction: () => { onHelpClick(); setOpen(false); },
      activeClass: 'btn-secondary',
    },
    {
      key: 'settings',
      label: 'Postavke',
      icon: <Settings className="w-5 h-5" />,
      angle: 330,
      onAction: () => { navigate('/settings'); setOpen(false); },
      activeClass: 'btn-secondary',
    },
    {
      key: 'vehicles',
      label: 'Javni prijevoz',
      icon: <Bus className="w-5 h-5" />,
      angle: 270,
      active: showAllVehicles,
      onToggle: () => setShowAllVehicles(!showAllVehicles),
      activeClass: 'btn-success',
      showDot: true,
    },
    {
      key: 'bikes',
      label: 'BAJS bicikli',
      icon: <Bike className="w-5 h-5" />,
      angle: 210,
      active: showBikeStations,
      onToggle: () => setShowBikeStations(!showBikeStations),
      activeClass: 'btn-warning',
      showDot: true,
    },
    {
      key: 'closures',
      label: 'Zatv. ceste',
      icon: <Construction className="w-5 h-5" />,
      angle: 150,
      active: showRoadClosures,
      onToggle: () => setShowRoadClosures(!showRoadClosures),
      activeClass: 'btn-error',
      showDot: true,
    },
  ];

  const hubCenter = HUB_SIZE / 2;

  // ── Colored positional dots ──────────────────────────────────────────────
  // Each active layer toggle renders a small dot at the corresponding angle on
  // the gear button perimeter, colored to match that layer's accent.
  const DOT_RADIUS = 22;
  const DOT_SIZE = 9;
  const dotBadges = items
    .filter((it) => it.showDot && it.active)
    .map((it) => {
      const rad = degToRad(it.angle);
      return {
        key: it.key,
        x: hubCenter + Math.cos(rad) * DOT_RADIUS - DOT_SIZE / 2,
        y: hubCenter - Math.sin(rad) * DOT_RADIUS - DOT_SIZE / 2,
        colorClass: it.activeClass.replace('btn-', 'bg-'),
      };
    });

  // Hub position in the overlay: transitions between corner and center
  const hubX = hubAtCenter ? centerPos.x : cornerPos.x;
  const hubY = hubAtCenter ? centerPos.y : cornerPos.y;

  const overlay = visible
    ? createPortal(
      <>
        {/* Backdrop — click to close */}
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9998,
            backdropFilter: hubAtCenter ? 'blur(6px)' : 'blur(0px)',
            backgroundColor: hubAtCenter ? 'rgba(0,0,0,0.45)' : 'rgba(0,0,0,0)',
            transition: 'backdrop-filter 320ms ease, background-color 320ms ease',
          }}
          onPointerDown={() => setOpen(false)}
        />

        {/* Hub container — flows from corner to center and back */}
        <div
          style={{
            position: 'fixed',
            zIndex: 9999,
            left: hubX,
            top: hubY,
            width: HUB_SIZE,
            height: HUB_SIZE,
            transition: 'left 370ms cubic-bezier(0.34,1.4,0.64,1), top 370ms cubic-bezier(0.34,1.4,0.64,1)',
          }}
        >
          {/* SVG spoke lines */}
          <svg
            style={{
              position: 'absolute',
              left: -(RADIUS + 32),
              top: -(RADIUS + 32),
              width: (RADIUS + 32) * 2 + HUB_SIZE,
              height: (RADIUS + 32) * 2 + HUB_SIZE,
              pointerEvents: 'none',
              overflow: 'visible',
            }}
            aria-hidden="true"
          >
            {items.map((item, i) => {
              const rad = degToRad(item.angle);
              const dx = Math.cos(rad) * RADIUS;
              const dy = -Math.sin(rad) * RADIUS;
              const ox = RADIUS + 32 + hubCenter;
              const oy = RADIUS + 32 + hubCenter;
              return (
                <line
                  key={item.key}
                  x1={ox}
                  y1={oy}
                  x2={ox + dx}
                  y2={oy + dy}
                  stroke="white"
                  strokeWidth="1.5"
                  strokeDasharray="4 3"
                  style={{
                    transition: `opacity 250ms ease ${50 + i * 30}ms`,
                    opacity: expanded ? 0.35 : 0,
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
            const delay = expanded ? i * 40 : (items.length - 1 - i) * 30;
            const isToggle = item.onToggle != null;

            return (
              <div
                key={item.key}
                style={{
                  position: 'absolute',
                  left: hubCenter + (expanded ? dx : 0),
                  top: hubCenter + (expanded ? dy : 0),
                  transform: 'translate(-50%, -50%)',
                  transition: `left ${expanded ? 210 + delay : 150}ms ease,
                                 top ${expanded ? 210 + delay : 150}ms ease,
                                 opacity ${expanded ? 190 + delay : 110}ms ease`,
                  opacity: expanded ? 1 : 0,
                  pointerEvents: expanded ? 'auto' : 'none',
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

          {/* Center close button */}
          <button
            className="btn btn-primary btn-circle shadow-xl"
            style={{
              width: HUB_SIZE,
              height: HUB_SIZE,
              position: 'absolute',
              top: 0,
              left: 0,
              transition: 'opacity 200ms ease',
              opacity: hubAtCenter ? 1 : 0,
              pointerEvents: hubAtCenter ? 'auto' : 'none',
            }}
            onClick={() => setOpen(false)}
            title="Zatvori izbornik"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </>,
      document.body,
    )
    : null;

  return (
    <>
      {overlay}

      {/* Corner controls column */}
      <div className="flex flex-col items-center gap-2">

        {/* Gear hub — fades out while the overlay hub takes its visual place */}
        <div style={{ position: 'relative', width: HUB_SIZE, height: HUB_SIZE }}>
          <button
            ref={hubRef}
            className="btn btn-circle btn-neutral shadow-lg"
            style={{
              width: HUB_SIZE,
              height: HUB_SIZE,
              transition: 'opacity 220ms ease',
              opacity: visible ? 0 : 1,
              pointerEvents: visible ? 'none' : 'auto',
            }}
            onClick={handleOpen}
            title="Izbornik slojeva"
            aria-haspopup="true"
            aria-expanded={open}
          >
            <Settings className="w-5 h-5" />
          </button>

          {/* Colored positional dot badges (visible when menu closed, layer active) */}
          {!visible && dotBadges.map((dot) => (
            <span
              key={dot.key}
              aria-hidden="true"
              className={`${dot.colorClass} absolute rounded-full border-2 border-base-100`}
              style={{
                width: DOT_SIZE,
                height: DOT_SIZE,
                left: dot.x,
                top: dot.y,
                pointerEvents: 'none',
              }}
            />
          ))}
        </div>

        {/* Standalone locate button — always visible below the gear */}
        <button
          className="btn btn-circle btn-neutral shadow-lg"
          style={{ width: HUB_SIZE, height: HUB_SIZE }}
          onClick={onLocateClick}
          title="Moja lokacija"
          disabled={locating}
        >
          {locating
            ? <span className="loading loading-spinner loading-xs" />
            : <LocateFixed className="w-5 h-5" />
          }
        </button>
      </div>
    </>
  );
}
