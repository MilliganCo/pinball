/**
 * Тесты порталов
 */

import { describe, it, expect } from 'vitest';
import { createPortal, tryTeleport } from '../src/core/portals';
import { Vec3Utils } from '../src/core/math';

describe('Portals', () => {
  it('должен создавать портал с правильной ориентацией', () => {
    const portal = createPortal({ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }, 1.0);
    expect(portal.r).toBe(1.0);
    expect(Vec3Utils.length(portal.n)).toBeCloseTo(1.0, 5);
  });

  it('должен телепортировать шар через портал', () => {
    const A = createPortal({ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }, 2.0);
    const B = createPortal({ x: 10, y: 0, z: 0 }, { x: -1, y: 0, z: 0 }, 2.0);

    const prev = { x: -2, y: 0, z: 0 };
    const next = { x: 1, y: 0, z: 0 };
    const vel = { x: 10, y: 0, z: 0 };

    const result = tryTeleport(prev, next, vel, A, B);

    expect(result).not.toBeNull();
    if (result) {
      expect(result.x.x).toBeCloseTo(9, 1);
      expect(Vec3Utils.length(result.v)).toBeCloseTo(Vec3Utils.length(vel), 1);
    }
  });

  it('должен сохранять угол при телепортации', () => {
    const A = createPortal({ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }, 2.0);
    const B = createPortal({ x: 0, y: 10, z: 0 }, { x: 0, y: -1, z: 0 }, 2.0);

    const prev = { x: -2, y: 0, z: 0 };
    const next = { x: 1, y: 0, z: 0 };
    const vel = { x: 10, y: 5, z: 0 };

    const result = tryTeleport(prev, next, vel, A, B);

    expect(result).not.toBeNull();
    if (result) {
      const speedBefore = Vec3Utils.length(vel);
      const speedAfter = Vec3Utils.length(result.v);
      expect(speedAfter).toBeCloseTo(speedBefore, 1);
    }
  });
});

