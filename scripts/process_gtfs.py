#!/usr/bin/env python3
"""
GTFS Data Processor for ZET Zagreb Transit
Converts raw GTFS CSV data into optimized, chunked JSON files for frontend consumption.

Input: ./data/*.txt (GTFS CSV files)
Output: ./public/data/ (chunked JSON files)
"""

import csv
import json
import os
from collections import defaultdict
from pathlib import Path


# Paths
DATA_DIR = Path("data")
OUTPUT_DIR = Path("public/data")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


def time_to_minutes(time_str):
    """Convert HH:MM:SS to minutes from midnight (integer)."""
    parts = time_str.split(':')
    hours = int(parts[0])
    minutes = int(parts[1])
    return hours * 60 + minutes


def read_csv(filename):
    """Read a CSV file and return list of dicts."""
    filepath = DATA_DIR / filename
    with open(filepath, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        return list(reader)


def write_json(filepath, data):
    """Write data to JSON file with compact formatting."""
    filepath.parent.mkdir(parents=True, exist_ok=True)
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, separators=(',', ':'), ensure_ascii=False)


def process_initial_bundle():
    """Generate initial.json with stops, routes, and calendar data."""
    print("📦 Processing initial bundle...")
    
    # Process stops
    stops_raw = read_csv("stops.txt")
    stops = []
    for stop in stops_raw:
        stops.append({
            'id': stop['stop_id'],
            'code': stop['stop_code'],
            'name': stop['stop_name'],
            'lat': round(float(stop['stop_lat']), 5),
            'lon': round(float(stop['stop_lon']), 5),
            'locationType': int(stop['location_type']) if stop['location_type'] else 0,
            'parentStation': stop['parent_station'] if stop['parent_station'] else None
        })
    
    # Process routes
    routes_raw = read_csv("routes.txt")
    routes = []
    for route in routes_raw:
        routes.append({
            'id': route['route_id'],
            'shortName': route['route_short_name'],
            'longName': route['route_long_name'],
            'type': int(route['route_type'])
        })
    
    # Process calendar dates (date -> service_id mapping)
    calendar_dates_raw = read_csv("calendar_dates.txt")
    calendar = {}
    for entry in calendar_dates_raw:
        calendar[entry['date']] = entry['service_id']
    
    # Get feed info
    feed_info_raw = read_csv("feed_info.txt")
    feed_info = feed_info_raw[0] if feed_info_raw else {}
    
    initial_data = {
        'stops': stops,
        'routes': routes,
        'calendar': calendar,
        'feedVersion': feed_info.get('feed_version', ''),
        'feedStartDate': feed_info.get('feed_start_date', ''),
        'feedEndDate': feed_info.get('feed_end_date', '')
    }
    
    write_json(OUTPUT_DIR / 'initial.json', initial_data)
    print(f"  ✓ Wrote initial.json ({len(stops)} stops, {len(routes)} routes, {len(calendar)} calendar entries)")


def process_shapes():
    """Chunk shapes by route."""
    print("🗺️  Processing shapes...")
    
    shapes_raw = read_csv("shapes.txt")
    
    # Group by shape_id
    shapes_by_id = defaultdict(list)
    for point in shapes_raw:
        shape_id = point['shape_id']
        shapes_by_id[shape_id].append({
            'lat': round(float(point['shape_pt_lat']), 5),
            'lon': round(float(point['shape_pt_lon']), 5),
            'seq': int(point['shape_pt_sequence'])
        })
    
    # Sort by sequence and remove seq field
    for shape_id in shapes_by_id:
        shapes_by_id[shape_id].sort(key=lambda p: p['seq'])
        shapes_by_id[shape_id] = [[p['lat'], p['lon']] for p in shapes_by_id[shape_id]]
    
    # Group by route_id (shape_id format is {route_id}_{variant})
    shapes_by_route = defaultdict(dict)
    for shape_id, points in shapes_by_id.items():
        route_id = shape_id.split('_')[0]
        shapes_by_route[route_id][shape_id] = points
    
    # Write per-route files
    shapes_dir = OUTPUT_DIR / 'shapes'
    shapes_dir.mkdir(exist_ok=True)
    
    for route_id, shapes in shapes_by_route.items():
        write_json(shapes_dir / f'{route_id}.json', shapes)
    
    print(f"  ✓ Wrote {len(shapes_by_route)} shape files")


def process_trips():
    """Chunk trips by route and return trip lookup dict."""
    print("🚌 Processing trips...")
    
    trips_raw = read_csv("trips.txt")
    
    # Build trip lookup: trip_id -> (route_id, service_id, headsign, direction, shape)
    trip_lookup = {}
    trips_by_route = defaultdict(list)
    
    for trip in trips_raw:
        trip_id = trip['trip_id']
        route_id = trip['route_id']
        service_id = trip['service_id']
        headsign = trip['trip_headsign']
        direction = int(trip['direction_id']) if trip['direction_id'] else 0
        shape_id = trip['shape_id'] if trip['shape_id'] else None
        
        trip_lookup[trip_id] = (route_id, service_id, headsign, direction, shape_id)
        
        trips_by_route[route_id].append({
            'id': trip_id,
            'serviceId': service_id,
            'headsign': headsign,
            'direction': direction,
            'shapeId': shape_id
        })
    
    # Write per-route files
    routes_dir = OUTPUT_DIR / 'routes'
    routes_dir.mkdir(exist_ok=True)
    
    for route_id, trips in trips_by_route.items():
        write_json(routes_dir / f'{route_id}.json', {'trips': trips})
    
    print(f"  ✓ Wrote {len(trips_by_route)} route files ({len(trip_lookup)} trips)")
    
    return trip_lookup


def process_stop_times(trip_lookup):
    """Stream stop_times and create dual chunks (by route and by stop)."""
    print("⏰ Processing stop times (streaming)...")
    
    # Accumulators
    timetables_by_route = defaultdict(lambda: defaultdict(list))  # route_id -> trip_id -> [(stop_id, seq, time)]
    departures_by_stop = defaultdict(lambda: defaultdict(lambda: defaultdict(list)))  # stop_id -> service_id -> route_id -> [times]
    route_set_by_stop = defaultdict(set)  # stop_id -> {route_ids}
    
    # Stream stop_times.txt
    filepath = DATA_DIR / "stop_times.txt"
    line_count = 0
    
    with open(filepath, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        
        for row in reader:
            line_count += 1
            if line_count % 100000 == 0:
                print(f"  ... processed {line_count:,} rows")
            
            trip_id = row['trip_id']
            stop_id = row['stop_id']
            stop_sequence = int(row['stop_sequence'])
            time_str = row['departure_time']  # arrival == departure
            
            # Skip if trip not found
            if trip_id not in trip_lookup:
                continue
            
            route_id, service_id, _, _, _ = trip_lookup[trip_id]
            time_minutes = time_to_minutes(time_str)
            
            # Accumulate for route timetable
            timetables_by_route[route_id][trip_id].append([stop_id, stop_sequence, time_minutes])
            
            # Accumulate for stop departures
            departures_by_stop[stop_id][service_id][route_id].append(time_minutes)
            route_set_by_stop[stop_id].add(route_id)
    
    print(f"  ✓ Processed {line_count:,} stop times")
    
    # Write route timetables
    print("  💾 Writing route timetables...")
    timetables_dir = OUTPUT_DIR / 'timetables'
    timetables_dir.mkdir(exist_ok=True)
    
    for route_id, trips in timetables_by_route.items():
        # Sort stop times by sequence
        for trip_id in trips:
            trips[trip_id].sort(key=lambda x: x[1])
        
        # Optimize: use compact format [stopId, seq, time]
        write_json(timetables_dir / f'{route_id}.json', dict(trips))
    
    print(f"    ✓ Wrote {len(timetables_by_route)} timetable files")
    
    # Write stop departures
    print("  💾 Writing stop departures...")
    stops_dir = OUTPUT_DIR / 'stops'
    stops_dir.mkdir(exist_ok=True)
    
    for stop_id, services in departures_by_stop.items():
        # Sort times and remove duplicates
        for service_id in services:
            for route_id in services[service_id]:
                services[service_id][route_id] = sorted(set(services[service_id][route_id]))
        
        stop_data = {
            'routes': sorted(route_set_by_stop[stop_id]),
            'departures': services
        }
        
        write_json(stops_dir / f'{stop_id}.json', stop_data)
    
    print(f"    ✓ Wrote {len(departures_by_stop)} stop files")
    
    return timetables_by_route


def generate_route_stops_index(timetables_by_route):
    """Generate lightweight stop list per route (B2 optimization)."""
    print("🗺️  Generating route stops index...")
    
    route_stops_dir = OUTPUT_DIR / 'route_stops'
    route_stops_dir.mkdir(exist_ok=True)
    
    for route_id, trips_data in timetables_by_route.items():
        stops_set = set()
        for trip_stops in trips_data.values():
            for stop_id, seq, time in trip_stops:
                stops_set.add(stop_id)
        
        route_stops = {
            'stops': sorted(stops_set)
        }
        
        write_json(route_stops_dir / f'{route_id}.json', route_stops)
    
    print(f"    ✓ Wrote {len(timetables_by_route)} route stops files")


def generate_stop_timetables_index(timetables_by_route, trip_lookup):
    """Generate pre-filtered timetables by stop (A2 optimization)."""
    print("⏱️  Generating stop timetables index...")
    
    stop_timetables_dir = OUTPUT_DIR / 'stop_timetables'
    stop_timetables_dir.mkdir(exist_ok=True)
    
    # Accumulator: stop_id -> route_id -> trip_id -> {time, sequence}
    stop_timetables = defaultdict(lambda: defaultdict(dict))
    
    for route_id, trips_data in timetables_by_route.items():
        for trip_id, trip_stops in trips_data.items():
            for stop_id, sequence, time in trip_stops:
                stop_timetables[stop_id][route_id][trip_id] = {
                    'time': time,
                    'sequence': sequence
                }
    
    # Write per-stop timetable files
    for stop_id, routes_data in stop_timetables.items():
        # Convert to regular dict for JSON serialization
        routes_dict = {route_id: dict(trips) for route_id, trips in routes_data.items()}
        write_json(stop_timetables_dir / f'{stop_id}.json', routes_dict)
    
    print(f"    ✓ Wrote {len(stop_timetables)} stop timetable files")


def generate_route_active_trips_index(timetables_by_route, trip_lookup):
    """Generate optimized index for vehicle position estimation (B1 optimization)."""
    print("🚗 Generating route active trips index...")
    
    route_active_trips_dir = OUTPUT_DIR / 'route_active_trips'
    route_active_trips_dir.mkdir(exist_ok=True)
    
    for route_id, trips_data in timetables_by_route.items():
        # Extract trip metadata with start/end times
        trips = []
        for trip_id, trip_stops in trips_data.items():
            if not trip_stops:
                continue
            
            # Get metadata from trip_lookup
            _, service_id, headsign, direction, shape_id = trip_lookup[trip_id]
            
            # Get start time (first stop) and end time (last stop)
            first_stop = trip_stops[0]  # [stop_id, sequence, time]
            last_stop = trip_stops[-1]
            
            trips.append({
                'id': trip_id,
                'headsign': headsign,
                'direction': direction,
                'shapeId': shape_id,
                'start': first_stop[2],  # departure time in minutes
                'end': last_stop[2]      # arrival time in minutes
            })
        
        # Load shapes for this route
        shapes_file = OUTPUT_DIR / 'shapes' / f'{route_id}.json'
        shapes = {}
        if shapes_file.exists():
            with open(shapes_file, 'r', encoding='utf-8') as f:
                shapes = json.load(f)
        
        # Write combined file
        active_trips_data = {
            'trips': trips,
            'shapes': shapes
        }
        
        write_json(route_active_trips_dir / f'{route_id}.json', active_trips_data)
    
    print(f"    ✓ Wrote {len(timetables_by_route)} route active trips files")


def generate_all_active_trips_index(timetables_by_route, trip_lookup):
    """Generate combined index for all vehicle positions (show all vehicles feature)."""
    print("🚗 Generating all active trips index...")
    
    # Load routes data for type and short name
    routes_raw = read_csv("routes.txt")
    routes_metadata = {}
    for route in routes_raw:
        routes_metadata[route['route_id']] = {
            'type': int(route['route_type']),
            'shortName': route['route_short_name']
        }
    
    all_routes = {}
    all_shapes = {}
    
    for route_id, trips_data in timetables_by_route.items():
        # Extract trip metadata with start/end times
        trips = []
        for trip_id, trip_stops in trips_data.items():
            if not trip_stops:
                continue
            
            # Get metadata from trip_lookup
            _, service_id, headsign, direction, shape_id = trip_lookup[trip_id]
            
            # Get start time (first stop) and end time (last stop)
            first_stop = trip_stops[0]  # [stop_id, sequence, time]
            last_stop = trip_stops[-1]
            
            trips.append({
                'id': trip_id,
                'headsign': headsign,
                'direction': direction,
                'shapeId': shape_id,
                'start': first_stop[2],  # departure time in minutes
                'end': last_stop[2]      # arrival time in minutes
            })
        
        # Add route data with metadata
        route_metadata = routes_metadata.get(route_id, {'type': 3, 'shortName': route_id})
        all_routes[route_id] = {
            'trips': trips,
            'type': route_metadata['type'],
            'shortName': route_metadata['shortName']
        }
        
        # Load and merge shapes for this route
        shapes_file = OUTPUT_DIR / 'shapes' / f'{route_id}.json'
        if shapes_file.exists():
            with open(shapes_file, 'r', encoding='utf-8') as f:
                route_shapes = json.load(f)
                all_shapes.update(route_shapes)
    
    # Write combined file
    combined_data = {
        'routes': all_routes,
        'shapes': all_shapes
    }
    
    write_json(OUTPUT_DIR / 'all_active_trips.json', combined_data)
    print(f"    ✓ Wrote all_active_trips.json ({len(all_routes)} routes, {len(all_shapes)} shapes)")


def generate_manifest():
    """Generate manifest.json with metadata about all chunks."""
    print("📋 Generating manifest...")
    
    manifest = {
        'version': '',
        'generated': '',
        'files': {
            'initial': 'initial.json',
            'all_active_trips': 'all_active_trips.json',
            'routes': [],
            'stops': [],
            'timetables': [],
            'shapes': [],
            'route_stops': [],
            'stop_timetables': [],
            'route_active_trips': []
        }
    }
    
    # Get feed info
    feed_info_raw = read_csv("feed_info.txt")
    if feed_info_raw:
        manifest['version'] = feed_info_raw[0].get('feed_version', '')
        manifest['feedStart'] = feed_info_raw[0].get('feed_start_date', '')
        manifest['feedEnd'] = feed_info_raw[0].get('feed_end_date', '')
    
    # List all generated files
    for subdir in ['routes', 'stops', 'timetables', 'shapes', 'route_stops', 'stop_timetables', 'route_active_trips']:
        dir_path = OUTPUT_DIR / subdir
        if dir_path.exists():
            files = sorted([f.name for f in dir_path.glob('*.json')])
            manifest['files'][subdir] = files
    
    write_json(OUTPUT_DIR / 'manifest.json', manifest)
    print(f"  ✓ Wrote manifest.json")


def calculate_stats():
    """Calculate and display size statistics."""
    print("\n📊 Output Statistics:")
    
    total_size = 0
    file_counts = {'initial': 0, 'routes': 0, 'stops': 0, 'timetables': 0, 'shapes': 0, 'manifest': 0}
    
    # Initial file
    initial_file = OUTPUT_DIR / 'initial.json'
    if initial_file.exists():
        size = initial_file.stat().st_size
        total_size += size
        file_counts['initial'] = 1
        print(f"  initial.json: {size:,} bytes ({size/1024:.1f} KB)")
    
    # All active trips file
    all_active_file = OUTPUT_DIR / 'all_active_trips.json'
    if all_active_file.exists():
        size = all_active_file.stat().st_size
        total_size += size
        file_counts['all_active_trips'] = 1
        print(f"  all_active_trips.json: {size:,} bytes ({size/1024:.1f} KB)")
    
    # Subdirectories
    for subdir in ['routes', 'stops', 'timetables', 'shapes', 'route_stops', 'stop_timetables', 'route_active_trips']:
        dir_path = OUTPUT_DIR / subdir
        if dir_path.exists():
            subdir_size = sum(f.stat().st_size for f in dir_path.glob('*.json'))
            file_count = len(list(dir_path.glob('*.json')))
            total_size += subdir_size
            file_counts[subdir] = file_count
            avg_size = subdir_size / file_count if file_count > 0 else 0
            print(f"  {subdir}/: {subdir_size:,} bytes ({subdir_size/1024:.1f} KB) - {file_count} files (avg {avg_size/1024:.1f} KB)")
    
    # Manifest
    manifest_file = OUTPUT_DIR / 'manifest.json'
    if manifest_file.exists():
        size = manifest_file.stat().st_size
        total_size += size
        file_counts['manifest'] = 1
    
    print(f"\n  Total: {total_size:,} bytes ({total_size/1024:.1f} KB = {total_size/1024/1024:.2f} MB)")
    print(f"  Total files: {sum(file_counts.values())}")
    
    # Compare to input
    input_size = sum(f.stat().st_size for f in DATA_DIR.glob('*.txt'))
    compression_ratio = (1 - total_size / input_size) * 100
    print(f"\n  Input size: {input_size:,} bytes ({input_size/1024/1024:.1f} MB)")
    print(f"  Compression: {compression_ratio:.1f}% reduction")


def main():
    """Main processing pipeline."""
    print("🚀 GTFS Data Processor for ZET Zagreb\n")
    
    # Step 1: Initial bundle
    process_initial_bundle()
    
    # Step 2: Shapes
    process_shapes()
    
    # Step 3: Trips
    trip_lookup = process_trips()
    
    # Step 4: Stop times (streaming)
    timetables_by_route = process_stop_times(trip_lookup)
    
    # Step 5: Route stops index (B2 optimization)
    generate_route_stops_index(timetables_by_route)
    
    # Step 6: Stop timetables index (A2 optimization)
    generate_stop_timetables_index(timetables_by_route, trip_lookup)
    
    # Step 7: Route active trips index (B1 optimization)
    generate_route_active_trips_index(timetables_by_route, trip_lookup)
    
    # Step 8: All active trips index (show all vehicles feature)
    generate_all_active_trips_index(timetables_by_route, trip_lookup)
    
    # Step 9: Manifest
    generate_manifest()
    
    # Step 10: Stats
    calculate_stats()
    
    print("\n✅ Done! Output in ./public/data/")


if __name__ == '__main__':
    main()
