/**
 * Тесты SDF
 */

import { describe, it, expect } from 'vitest';
import { Grid3D } from '../src/core/grid3d';
import { sdfBall, gradSdf } from '../src/core/sdf';

describe('SDF', () => {
  it('должен вычислять расстояние до вокселей', () => {
    const grid = new Grid3D(32, 32, 32, 1.0, 8);
    grid.set(16, 16, 16, 1); // стекло

    const dist = sdfBall(grid, { x: 18, y: 16, z: 16 }, 0.5);
    expect(dist).toBeLessThan(1.0);
    expect(dist).toBeGreaterThan(-1.0);
  });

  it('должен вычислять градиент SDF', () => {
    const grid = new Grid3D(32, 32, 32, 1.0, 8);
    grid.set(16, 16, 16, 1);

    const grad = gradSdf(grid, { x: 18, y: 16, z: 16 }, 0.5);
    expect(grad.x).toBeDefined();
    expect(grad.y).toBeDefined();
    expect(grad.z).toBeDefined();
  });
});

