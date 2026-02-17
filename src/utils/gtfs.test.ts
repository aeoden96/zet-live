import { describe, it, expect } from 'vitest';
import { clusterParentStops } from './gtfs';

describe('clusterParentStops', () => {
  it('groups nearby parent stops into clusters', () => {
    const parents = [
      { id: 'p1', code: '', name: 'A', lat: 0, lon: 0, locationType: 1, parentStation: null },
      { id: 'p2', code: '', name: 'B', lat: 0.0005, lon: 0.0005, locationType: 1, parentStation: null },
      { id: 'p3', code: '', name: 'C', lat: 1, lon: 1, locationType: 1, parentStation: null },
    ];

    const groups = clusterParentStops(parents as any, 100);
    expect(groups.length).toBe(2);

    const g0 = groups.find(g => g.childIds.includes('p1'));
    const g1 = groups.find(g => g.childIds.includes('p3'));

    expect(g0).toBeDefined();
    expect(g1).toBeDefined();
    expect(g0!.count).toBe(2);
    expect(g1!.count).toBe(1);
  });
});
