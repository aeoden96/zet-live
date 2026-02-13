# GTFS Data Usage Examples

Examples of how to use the processed GTFS data in your React frontend.

## 1. Load Initial Data at App Start

```typescript
import { fetchInitialData, type InitialData } from './utils/gtfs';
import { useEffect, useState } from 'react';

function App() {
  const [data, setData] = useState<InitialData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInitialData()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading...</div>;
  if (!data) return <div>Failed to load data</div>;

  return (
    <div>
      <h1>ZET Zagreb Transit</h1>
      <p>{data.stops.length} stops, {data.routes.length} routes</p>
      <p>Feed version: {data.feedVersion}</p>
    </div>
  );
}
```

## 2. Display All Stops on a Map

```typescript
import { fetchInitialData, isParentStation } from './utils/gtfs';

function StopMap() {
  const [stops, setStops] = useState([]);

  useEffect(() => {
    fetchInitialData().then(data => {
      // Show only parent stations to avoid clutter
      const parentStops = data.stops.filter(isParentStation);
      setStops(parentStops);
    });
  }, []);

  return (
    <div>
      {stops.map(stop => (
        <Marker 
          key={stop.id}
          latitude={stop.lat}
          longitude={stop.lon}
          onClick={() => handleStopClick(stop)}
        />
      ))}
    </div>
  );
}
```

## 3. Show Route Details on Click

```typescript
import { fetchRouteTrips, fetchRouteShapes, getRouteTypeName } from './utils/gtfs';

async function handleRouteClick(route: Route) {
  // Fetch trips for this route
  const { trips } = await fetchRouteTrips(route.id);
  
  // Fetch shapes (geographic paths)
  const shapes = await fetchRouteShapes(route.id);
  
  console.log(`Route ${route.shortName} - ${route.longName}`);
  console.log(`Type: ${getRouteTypeName(route.type)}`);
  console.log(`Trips: ${trips.length}`);
  console.log(`Shape variants: ${Object.keys(shapes).length}`);
  
  // Draw shapes on map
  Object.values(shapes).forEach(path => {
    drawPolyline(path); // path is [[lat, lon], [lat, lon], ...]
  });
}
```

## 4. Show Departures at a Stop

```typescript
import { 
  fetchStopDepartures, 
  getCurrentServiceId, 
  getCurrentTimeMinutes,
  getNextDepartures,
  minutesToTime 
} from './utils/gtfs';

async function StopDepartures({ stopId, calendar }: { stopId: string, calendar: Record<string, string> }) {
  const [departures, setDepartures] = useState<any>(null);
  
  useEffect(() => {
    fetchStopDepartures(stopId).then(setDepartures);
  }, [stopId]);
  
  if (!departures) return <div>Loading...</div>;
  
  const serviceId = getCurrentServiceId(calendar);
  if (!serviceId) return <div>No service today</div>;
  
  const currentTime = getCurrentTimeMinutes();
  
  return (
    <div>
      <h3>Routes at this stop:</h3>
      <ul>
        {departures.routes.map(routeId => {
          const times = departures.departures[serviceId]?.[routeId] || [];
          const nextTimes = getNextDepartures(times, currentTime, 3);
          
          return (
            <li key={routeId}>
              <strong>Route {routeId}</strong>:{' '}
              {nextTimes.map(minutesToTime).join(', ') || 'No more departures'}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
```

## 5. Show Full Timetable for a Route

```typescript
import { 
  fetchRouteTimetable, 
  fetchRouteTrips, 
  getTripStopTimes, 
  minutesToTime 
} from './utils/gtfs';

async function RouteTimetable({ routeId, serviceId }: { routeId: string, serviceId: string }) {
  const { trips } = await fetchRouteTrips(routeId);
  const timetable = await fetchRouteTimetable(routeId);
  
  // Filter trips by service
  const todaysTrips = trips.filter(trip => trip.serviceId === serviceId);
  
  return (
    <div>
      <h2>Timetable for Route {routeId}</h2>
      {todaysTrips.map(trip => {
        const stopTimes = getTripStopTimes(timetable, trip.id);
        
        return (
          <div key={trip.id}>
            <h3>{trip.headsign} (Direction {trip.direction})</h3>
            <table>
              <thead>
                <tr>
                  <th>Stop</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {stopTimes.map(st => (
                  <tr key={st.sequence}>
                    <td>{st.stopId}</td>
                    <td>{minutesToTime(st.time)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}
```

## 6. Find Nearest Stops to User Location

```typescript
import { fetchInitialData, findNearestStops } from './utils/gtfs';

function NearbyStops() {
  const [nearbyStops, setNearbyStops] = useState([]);
  
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      
      const data = await fetchInitialData();
      const nearest = findNearestStops(data.stops, latitude, longitude, 5);
      
      setNearbyStops(nearest);
    });
  }, []);
  
  return (
    <div>
      <h3>Nearest Stops</h3>
      <ul>
        {nearbyStops.map(stop => (
          <li key={stop.id}>
            {stop.name} - {(stop.distance * 1000).toFixed(0)}m away
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## 7. Filter Routes by Type

```typescript
import { fetchInitialData, isRouteTypeTram, isRouteTypeBus } from './utils/gtfs';

function RouteList() {
  const [routes, setRoutes] = useState([]);
  const [filter, setFilter] = useState<'all' | 'tram' | 'bus'>('all');
  
  useEffect(() => {
    fetchInitialData().then(data => setRoutes(data.routes));
  }, []);
  
  const filteredRoutes = routes.filter(route => {
    if (filter === 'tram') return isRouteTypeTram(route.type);
    if (filter === 'bus') return isRouteTypeBus(route.type);
    return true;
  });
  
  return (
    <div>
      <div>
        <button onClick={() => setFilter('all')}>All</button>
        <button onClick={() => setFilter('tram')}>Trams</button>
        <button onClick={() => setFilter('bus')}>Buses</button>
      </div>
      <ul>
        {filteredRoutes.map(route => (
          <li key={route.id}>
            {route.shortName} - {route.longName}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## 8. Real-time Countdown Timer

```typescript
import { minutesToTime, getCurrentTimeMinutes } from './utils/gtfs';
import { useEffect, useState } from 'react';

function DepartureCountdown({ departureTime }: { departureTime: number }) {
  const [minutesUntil, setMinutesUntil] = useState(0);
  
  useEffect(() => {
    const updateCountdown = () => {
      const now = getCurrentTimeMinutes();
      setMinutesUntil(departureTime - now);
    };
    
    updateCountdown();
    const interval = setInterval(updateCountdown, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, [departureTime]);
  
  if (minutesUntil < 0) return <span className="text-gray-400">Departed</span>;
  if (minutesUntil === 0) return <span className="text-green-600">Now</span>;
  if (minutesUntil < 5) return <span className="text-orange-600">{minutesUntil} min</span>;
  
  return <span>{minutesToTime(departureTime)}</span>;
}
```

## 9. Estimate Vehicle Positions (Schedule-Based)

**Requirement:** B1 — Show approximate vehicle locations  
**File:** `route_active_trips/{route_id}.json`  
**Size:** ~72 KB average (285 KB for route 6)

**Note:** This is NOT real-time tracking. It estimates positions based on schedule.

```typescript
import { getCurrentTimeMinutes } from './utils/gtfs';
import { useEffect, useState } from 'react';

interface VehiclePosition {
  tripId: string;
  headsign: string;
  position: [number, number]; // [lat, lon]
  progress: number; // 0-1
  start: number;
  end: number;
}

async function estimateVehiclePositions(routeId: string): Promise<VehiclePosition[]> {
  // Single fetch with all required data  
  const { trips, shapes } = await fetch(`/data/route_active_trips/${routeId}.json`)
    .then(r => r.json());

  const minutesNow = getCurrentTimeMinutes();
  const activeVehicles: VehiclePosition[] = [];

  // Check each trip to see if it's currently active
  trips.forEach((trip: any) => {
    // Is this vehicle currently en route?
    if (minutesNow >= trip.start && minutesNow <= trip.end) {
      const progress = (minutesNow - trip.start) / (trip.end - trip.start);

      // Get shape for this trip (use first shape if null)
      const shapeId = trip.shapeId || Object.keys(shapes)[0];
      const shapePath = shapes[shapeId];
      if (!shapePath) return;

      // Interpolate position along shape
      const pathIndex = Math.floor(progress * (shapePath.length - 1));
      const position = shapePath[pathIndex];

      activeVehicles.push({
        tripId: trip.id,
        headsign: trip.headsign,
        position,
        progress,
        start: trip.start,
        end: trip.end
      });
    }
  });

  return activeVehicles;
}

function VehicleTracker({ routeId }: { routeId: string }) {
  const [vehicles, setVehicles] = useState<VehiclePosition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const updateVehicles = async () => {
      try {
        const positions = await estimateVehiclePositions(routeId);
        setVehicles(positions);
      } catch (error) {
        console.error('Failed to estimate vehicles:', error);
      } finally {
        setLoading(false);
      }
    };

    updateVehicles();
    // Update every 30 seconds
    const interval = setInterval(updateVehicles, 30000);
    return () => clearInterval(interval);
  }, [routeId]);

  if (loading) return <div>Estimating vehicles...</div>;

  return (
    <div className="space-y-2">
      <h3 className="font-bold">Estimated Vehicles: {vehicles.length}</h3>
      {vehicles.map(v => (
        <div key={v.tripId} className="border p-2 rounded">
          <div className="font-medium">{v.headsign}</div>
          <div className="text-sm text-gray-600">
            Progress: {(v.progress * 100).toFixed(0)}%
          </div>
          <div className="text-sm text-gray-500">
            Position: {v.position[0].toFixed(5)}, {v.position[1].toFixed(5)}
          </div>
          {/* Draw vehicle marker on map at v.position */}
        </div>
      ))}
      {vehicles.length === 0 && (
        <div className="text-gray-500">No vehicles currently running</div>
      )}
      <div className="text-xs text-yellow-600 mt-2">
        ⚠️ Estimated positions based on schedule. Does not account for delays or traffic.
      </div>
    </div>
  );
}
```

**Performance:** 72 KB average (76% reduction vs 3-file approach)

**Limitations:**
- No actual GPS data—positions are interpolated along route shapes
- Assumes vehicles run exactly on schedule (no delays)
- Linear interpolation may not match actual vehicle speed patterns
- Best used for visualizing service frequency, not precise tracking

**For real-time tracking:** Check if ZET provides GTFS-Realtime API.

## Data Loading Strategy

### Initial Load (Required for App Start)
- **File:** `initial.json` (456 KB)
- **Contains:** All stops, all routes, calendar
- **When:** App mount

### On-Demand Loading (Lazy)
- **Route details:** Fetch when user clicks a route
  - `routes/{route_id}.json` (trips)
  - `timetables/{route_id}.json` (full timetable)
  - `shapes/{route_id}.json` (geographic path)
  
- **Stop details:** Fetch when user clicks a stop
  - `stops/{stop_id}.json` (which routes serve it, departure times)

### Caching Strategy
```typescript
const cache = new Map<string, any>();

async function fetchWithCache(url: string) {
  if (cache.has(url)) {
    return cache.get(url);
  }
  
  const response = await fetch(url);
  const data = await response.json();
  cache.set(url, data);
  return data;
}
```

## Performance Tips

1. **Lazy load everything except initial.json**
2. **Use parent stations only for map markers** (reduces 3,829 to ~500 markers)
3. **Virtualize long lists** (e.g., route timetables with 100+ trips)
4. **Cache fetched data** in memory or localStorage
5. **Enable gzip compression** on your CDN/server (reduces 47 MB → ~8-12 MB)
6. **Preload likely next clicks** (e.g., prefetch popular routes)
7. **Service Worker** for offline support and faster repeat loads
