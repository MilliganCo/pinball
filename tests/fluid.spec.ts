/**
 * Тесты жидкости
 */

import { describe, it, expect } from 'vitest';
import { Fluid } from '../src/core/fluid/fluid';

describe('Fluid', () => {
  it('должен создавать поле жидкости', () => {
    const fluid = new Fluid({
      width: 64,
      height: 64,
      cellSize: 1.0,
      gravity: 9.81,
      damping: 0.99,
    });

    expect(fluid.getWidth()).toBe(64);
    expect(fluid.getHeight()).toBe(64);
  });

  it('должен заполнять резервуар', () => {
    const fluid = new Fluid({
      width: 64,
      height: 64,
      cellSize: 1.0,
      gravity: 9.81,
      damping: 0.99,
    });

    fluid.fillReservoir({
      rect: [10, 0, 10, 20, 5, 20],
      h: 0.5,
    });

    const h = fluid.getHeightAt(20, 20);
    expect(h).toBeCloseTo(0.5, 1);
  });

  it('должен вычислять долю погружения шара', () => {
    const fluid = new Fluid({
      width: 64,
      height: 64,
      cellSize: 1.0,
      gravity: 9.81,
      damping: 0.99,
    });

    fluid.setHeightAt(32, 32, 1.0);

    const fraction = fluid.getSubmergedFraction({ x: 32, y: 0.5, z: 32 }, 0.5);
    expect(fraction).toBeGreaterThan(0);
    expect(fraction).toBeLessThanOrEqual(1);
  });
});

