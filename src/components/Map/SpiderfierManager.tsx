import { Fragment, useEffect } from 'react';
import { Circle, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useSpiderfierContext } from './SpiderfierContext';
import { useSettingsStore } from '../../stores/settingsStore';

// ── Icon factories ────────────────────────────────────────────────────────────

/**
 * Wraps the marker's own DivIcon HTML in a CSS-animated envelope so the node
 * looks identical to the real marker but pops in with a staggered scale animation.
 * Falls back to a neutral dot when no base icon is available.
 */
/**
 * Distance (px) from the icon centre to the label centre in the outward direction.
 * Should comfortably clear the largest icon (stop: ~24 px radius).
 */
const LABEL_DIST_PX = 50;

function animatedSpiderIcon(
  baseIcon: L.DivIcon | null | undefined,
  label: string,
  index: number,
  hideLabel = false,
  labelOffsetX = 0,
  labelOffsetY = 0,
): L.DivIcon {
  const safe = label
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const innerHtml =
    typeof baseIcon?.options.html === 'string'
      ? baseIcon.options.html
      : `<div class="spider-node-dot" title="${safe}"></div>`;

  // Embed outward offsets as CSS variables so both the resting position
  // and the fade-in animation keyframes use the correct direction.
  const labelHtml = hideLabel
    ? ''
    : `<span class="spider-node-label" style="--lx:${labelOffsetX.toFixed(1)}px;--ly:${labelOffsetY.toFixed(1)}px;">${label}</span>`;

  const html =
    `<div class="spider-node-wrap" style="--spider-idx:${index}">` +
    innerHtml +
    labelHtml +
    `</div>`;

  // Preserve the source icon's anchor so the animated copy sits exactly on top
  const iconSize = (baseIcon?.options.iconSize as [number, number] | undefined) ?? [14, 14];
  const iconAnchor = (baseIcon?.options.iconAnchor as [number, number] | undefined) ?? [7, 7];

  return L.divIcon({ html, className: '', iconSize, iconAnchor });
}


// ── Component ─────────────────────────────────────────────────────────────────

export function SpiderfierManager() {
  const map = useMap();
  const ctx = useSpiderfierContext();
  const theme = useSettingsStore((s) => s.theme);
  const isDark = theme === 'dark';

  // Create custom panes once so we can control z-depth precisely:
  //   spiderBgPane  (610) – bg circle + leg lines, above regular markerPane (600)
  //   spiderNodePane (620) – spider node markers, above the bg circle
  useEffect(() => {
    if (!map.getPane('spiderBgPane')) {
      const bg = map.createPane('spiderBgPane');
      bg.style.zIndex = '610';
      // bg.style.pointerEvents = 'none'; // Removed so it can block clicks on underlying markers
    }
    if (!map.getPane('spiderNodePane')) {
      map.createPane('spiderNodePane').style.zIndex = '620';
    }
  }, [map]);

  // Collapse spider on background map click or zoom start
  // Plus a mousedown listener to catch clicks on other markers
  useEffect(() => {
    if (!ctx) return;
    const collapse = () => ctx.collapse();

    // Catch-all mousedown to collapse if clicking outside any spider node
    const handleGlobalMousedown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // If a spider is open and we click something that isn't a spider node or the list popup
      if (ctx.spiderfied && !target.closest('.spider-node-wrap, .spider-list-popup')) {
        collapse();
      }
    };

    map.on('click', collapse);
    map.on('zoomstart', collapse);
    window.addEventListener('mousedown', handleGlobalMousedown, true);

    return () => {
      map.off('click', collapse);
      map.off('zoomstart', collapse);
      window.removeEventListener('mousedown', handleGlobalMousedown, true);
    };
  }, [map, ctx]);

  if (!ctx?.spiderfied) return null;

  const { centerLat, centerLon, items } = ctx.spiderfied;

  // ── Radial fan ─────────────────────────────────────────────────────────────

  // Compute encompassing radius: farthest item distance from center + padding.
  const center = L.latLng(centerLat, centerLon);
  const maxMeters = items.reduce((max, item) => {
    const d = center.distanceTo(L.latLng(item.spiderfiedLat, item.spiderfiedLon));
    return d > max ? d : max;
  }, 0);
  const mPerPx = 40075016.686 * Math.abs(Math.cos(centerLat * Math.PI / 180)) / Math.pow(2, map.getZoom() + 8);
  const bgRadius = maxMeters + mPerPx * 14; // just past the icon edges

  // Pre-compute the center pixel position so each item can derive
  // the outward angle (center → item) for label placement.
  const centerPx = map.latLngToContainerPoint([centerLat, centerLon]);

  return (
    <>
      {/* Single background circle encompassing all fan nodes */}
      <Circle
        center={[centerLat, centerLon]}
        radius={bgRadius}
        pane="spiderBgPane"
        pathOptions={{
          color: 'transparent',
          fillColor: isDark ? '#1f2937' : '#ffffff',
          fillOpacity: 0.93,
          weight: 0,
          className: 'spider-bg-circle',
        }}
        interactive={true}
        eventHandlers={{
          click: (e) => {
            L.DomEvent.stopPropagation(e.originalEvent);
            ctx.collapse();
          }
        }}
      />
      {items.map((item, i) => {
        // Compute outward angle in pixel space (center → item),
        // then derive the label offset vector at LABEL_DIST_PX distance.
        const itemPx = map.latLngToContainerPoint([item.spiderfiedLat, item.spiderfiedLon]);
        const dxPx = itemPx.x - centerPx.x;
        const dyPx = itemPx.y - centerPx.y;
        const angle = Math.atan2(dyPx, dxPx);
        // Base distance is fine for top/bottom labels (short pill height).
        // Left/right labels are wide, so add extra push proportional to |cos(angle)|
        // to prevent the pill from overlapping the icon on horizontal positions.
        const LABEL_H_EXTRA = 38; // extra px at pure left/right
        const distPx = LABEL_DIST_PX + Math.abs(Math.cos(angle)) * LABEL_H_EXTRA;
        const lx = Math.cos(angle) * distPx;
        const ly = Math.sin(angle) * distPx;

        return (
          <Fragment key={`spider-${item.id}`}>
            {/* Dashed leg from original position to spiderfied position */}
            <Polyline
              positions={[
                [centerLat, centerLon],
                [item.spiderfiedLat, item.spiderfiedLon],
              ]}
              pane="spiderBgPane"
              pathOptions={{
                color: isDark ? '#9ca3af' : '#374151',
                weight: 1.5,
                opacity: 0.65,
                dashArray: '3 5',
                className: 'spider-leg',
              }}
              interactive={false}
            />
            {/* Clickable node at spiderfied position – uses the real marker icon */}
            <Marker
              position={[item.spiderfiedLat, item.spiderfiedLon]}
              icon={animatedSpiderIcon(item.icon, item.label, i, item.hideLabel, lx, ly)}
              pane="spiderNodePane"
              zIndexOffset={1100}
              eventHandlers={{
                click: (e) => {
                  e.originalEvent.stopPropagation();
                  item.onClick();
                },
              }}
            />
          </Fragment>
        );
      })}
    </>
  );
}

