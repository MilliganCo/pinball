/**
 * Тесты разрушения
 */

import { describe, it, expect } from 'vitest';
import { Grid3D } from '../src/core/grid3d';
import { destroySphere } from '../src/core/destruct';

describe('Destruction', () => {
  it('должен удалять воксели в сфере', () => {
    const grid = new Grid3D(32, 32, 32, 1.0, 8);
    grid.fillBox(10, 10, 10, 20, 20, 20, 2); // дерево

    const before = grid.get(15, 15, 15);
    expect(before).toBe(2);

    const dirty = destroySphere(grid, { x: 15, y: 15, z: 15 }, 2.0, [2]);

    const after = grid.get(15, 15, 15);
    expect(after).toBe(0); // воздух
    expect(dirty.chunks.size).toBeGreaterThan(0);
  });

  it('должен помечать только затронутые чанки', () => {
    const grid = new Grid3D(64, 64, 64, 1.0, 16);
    grid.fillBox(20, 20, 20, 30, 30, 30, 3); // камень

    const dirty = destroySphere(grid, { x: 25, y: 25, z: 25 }, 3.0, [3]);
    expect(dirty.chunks.size).toBeGreaterThan(0);
    expect(dirty.chunks.size).toBeLessThan(10);
  });
});

