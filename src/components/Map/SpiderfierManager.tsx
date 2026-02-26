/**
 * SpiderfierManager – lives inside a react-leaflet MapContainer.
 *
 * Responsibilities:
 *  1. Collapse the active spider on map background click or zoom.
 *  2. Render the radial fan (leg lines + node markers) or a scrollable
 *     list-popup when the group is too large to fan out.
 */

import { Fragment, useEffect } from 'react';
import { Circle, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useSpiderfierContext, type SpiderfiedItem } from './SpiderfierContext';

// ── Icon factories ────────────────────────────────────────────────────────────

/**
 * Wraps the marker's own DivIcon HTML in a CSS-animated envelope so the node
 * looks identical to the real marker but pops in with a staggered scale animation.
 * Falls back to a neutral dot when no base icon is available.
 */
function animatedSpiderIcon(
  baseIcon: L.DivIcon | null | undefined,
  label: string,
  index: number,
): L.DivIcon {
  const safe = label
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const innerHtml =
    typeof baseIcon?.options.html === 'string'
      ? baseIcon.options.html
      : `<div class="spider-node-dot" title="${safe}"></div>`;

  const html =
    `<div class="spider-node-wrap" style="--spider-idx:${index}">` +
    innerHtml +
    `</div>`;

  // Preserve the source icon's anchor so the animated copy sits exactly on top
  const iconSize = (baseIcon?.options.iconSize as [number, number] | undefined) ?? [14, 14];
  const iconAnchor = (baseIcon?.options.iconAnchor as [number, number] | undefined) ?? [7, 7];

  return L.divIcon({ html, className: '', iconSize, iconAnchor });
}

function listPopupIcon(items: SpiderfiedItem[]): L.DivIcon {
  const rows = items
    .map(
      (item, i) =>
        `<button data-idx="${i}" class="spider-list-item" type="button">` +
        item.label
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;') +
        `</button>`,
    )
    .join('');
  return L.divIcon({
    html:
      `<div class="spider-list-popup">` +
      `<div class="spider-list-header">${items.length} items – tap to select</div>` +
      rows +
      `</div>`,
    className: '',
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

// ── Component ─────────────────────────────────────────────────────────────────

export function SpiderfierManager() {
  const map = useMap();
  const ctx = useSpiderfierContext();

  // Create custom panes once so we can control z-depth precisely:
  //   spiderBgPane  (610) – bg circle + leg lines, above regular markerPane (600)
  //   spiderNodePane (620) – spider node markers, above the bg circle
  useEffect(() => {
    if (!map.getPane('spiderBgPane')) {
      const bg = map.createPane('spiderBgPane');
      bg.style.zIndex = '610';
      bg.style.pointerEvents = 'none';
    }
    if (!map.getPane('spiderNodePane')) {
      map.createPane('spiderNodePane').style.zIndex = '620';
    }
  }, [map]);

  // Collapse spider on background map click or zoom start
  useEffect(() => {
    if (!ctx) return;
    const collapse = () => ctx.collapse();
    map.on('click', collapse);
    map.on('zoomstart', collapse);
    return () => {
      map.off('click', collapse);
      map.off('zoomstart', collapse);
    };
  }, [map, ctx]);

  if (!ctx?.spiderfied) return null;

  const { centerLat, centerLon, items, useListFallback } = ctx.spiderfied;

  // ── List-popup fallback (large clusters) ───────────────────────────────────
  if (useListFallback) {
    return (
      <Marker
        position={[centerLat, centerLon]}
        icon={listPopupIcon(items)}
        zIndexOffset={1200}
        interactive
        eventHandlers={{
          click: (e) => {
            e.originalEvent.stopPropagation();
            const target = e.originalEvent.target as HTMLElement;
            const btn = target.closest<HTMLButtonElement>('[data-idx]');
            if (btn) {
              const idx = parseInt(btn.dataset.idx ?? '-1', 10);
              if (idx >= 0) items[idx]?.onClick();
            }
          },
        }}
      />
    );
  }

  // ── Radial fan ─────────────────────────────────────────────────────────────

  // Compute encompassing radius: farthest item distance from center + padding.
  // Padding = ~20px in map-meters at current zoom (standard Web Mercator formula).
  const center = L.latLng(centerLat, centerLon);
  const maxMeters = items.reduce((max, item) => {
    const d = center.distanceTo(L.latLng(item.spiderfiedLat, item.spiderfiedLon));
    return d > max ? d : max;
  }, 0);
  const mPerPx = 40075016.686 * Math.abs(Math.cos(centerLat * Math.PI / 180)) / Math.pow(2, map.getZoom() + 8);
  const bgRadius = maxMeters + mPerPx * 20;

  return (
    <>
      {/* Single background circle encompassing all fan nodes */}
      <Circle
        center={[centerLat, centerLon]}
        radius={bgRadius}
        pane="spiderBgPane"
        pathOptions={{
          color: 'transparent',
          fillColor: '#ffffff',
          fillOpacity: 0.72,
          weight: 0,
          className: 'spider-bg-circle',
        }}
        interactive={false}
      />
      {items.map((item, i) => (
        <Fragment key={`spider-${item.id}`}>
          {/* Dashed leg from original position to spiderfied position */}
          <Polyline
            positions={[
              [centerLat, centerLon],
              [item.spiderfiedLat, item.spiderfiedLon],
            ]}
            pane="spiderBgPane"
            pathOptions={{
              color: '#374151',
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
            icon={animatedSpiderIcon(item.icon, item.label, i)}
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
      ))}
    </>
  );
}
