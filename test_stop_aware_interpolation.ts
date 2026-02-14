/**
 * Manual test for stop-aware vehicle interpolation
 * Run with: npx tsx test_stop_aware_interpolation.ts
 */

import { getStopAwareProgress } from './src/utils/vehicles';

console.log('Testing stop-aware interpolation...\n');

// Example stopTimes from a real trip: [[time, progress], ...]
const stopTimes: [number, number][] = [
  [238, 0.0],      // First stop
  [239, 0.057644],
  [242, 0.150166],
  [243, 0.192697],
  [245, 0.236611],
  [247, 0.286048],
  [250, 0.352826],
  [252, 0.396195],
  [254, 0.443191],
  [256, 0.491549],
  [258, 0.541406],
  [260, 0.602294],
  [262, 0.671044],
  [264, 0.722389],
  [266, 0.771688],
  [268, 0.805912],
  [271, 0.836451],
  [273, 0.861207],
  [275, 0.860977],
  [277, 0.929161],
  [279, 1.0]       // Last stop
];

// Test cases
const testCases = [
  { time: 237, expected: 'Should be at first stop (before trip)' },
  { time: 238, expected: 'Should be at first stop exactly (0.0)' },
  { time: 238.5, expected: 'Should be halfway between stop 1 and 2' },
  { time: 239, expected: 'Should be at second stop (0.057644)' },
  { time: 240.5, expected: 'Should be interpolated between stops 2 and 3' },
  { time: 250, expected: 'Should be at middle stop (0.352826)' },
  { time: 260, expected: 'Should be at stop with progress 0.602294' },
  { time: 279, expected: 'Should be at last stop (1.0)' },
  { time: 280, expected: 'Should be at last stop (after trip)' },
];

console.log('Stop times:');
stopTimes.forEach(([time, progress], i) => {
  console.log(`  ${i + 1}. Time ${time} min → Progress ${progress.toFixed(6)}`);
});

console.log('\nTest results:');
testCases.forEach(({ time, expected }) => {
  const progress = getStopAwareProgress(stopTimes, time);
  console.log(`  Time ${time.toString().padEnd(5)} → Progress ${progress.toFixed(6)} (${expected})`);
});

// Verify monotonic between stops
console.log('\nVerifying monotonic interpolation between stops 7-8:');
const stop7_time = 247;  // progress 0.286048
const stop8_time = 250;  // progress 0.352826

for (let t = stop7_time; t <= stop8_time; t += 0.5) {
  const progress = getStopAwareProgress(stopTimes, t);
  console.log(`  Time ${t.toFixed(1)} → Progress ${progress.toFixed(6)}`);
}

console.log('\n✓ Test complete!');
