/**
 * Операции разрушения вокселей
 */

import type { Vec3, Aabb } from './math';
import { Vec3Utils } from './math';
import type { Grid3D, DirtyRanges } from './grid3d';

export function destroySphere(
  grid: Grid3D,
  center: Vec3,
  r: number,
  matMask: number[]
): DirtyRanges {
  const aabb = grid.aabbOfSphere(center.x, center.y, center.z, r);
  const dirty = new Set<number>();

  const rSq = r * r;
  const gridPos = grid.worldToGrid(center);

  for (let z = aabb.min.z; z <= aabb.max.z; z++) {
    for (let y = aabb.min.y; y <= aabb.max.y; y++) {
      for (let x = aabb.min.x; x <= aabb.max.x; x++) {
        const cellCenter = grid.gridToWorld({ x, y, z });
        const distSq = Vec3Utils.distanceSq(center, cellCenter);

        if (distSq <= rSq) {
          const mat = grid.get(x, y, z);
          if (matMask.includes(mat)) {
            grid.set(x, y, z, 0); // воздух
            const chunkIdx = grid.chunkIdx(x, y, z);
            if (chunkIdx >= 0) {
              dirty.add(chunkIdx);
            }
          }
        }
      }
    }
  }

  // Помечаем соседние чанки тоже (для границ)
  const extendedAabb: Aabb = {
    min: {
      x: Math.max(0, aabb.min.x - 1),
      y: Math.max(0, aabb.min.y - 1),
      z: Math.max(0, aabb.min.z - 1),
    },
    max: {
      x: Math.min(grid.nx - 1, aabb.max.x + 1),
      y: Math.min(grid.ny - 1, aabb.max.y + 1),
      z: Math.min(grid.nz - 1, aabb.max.z + 1),
    },
  };
  grid.markDirtyChunks(extendedAabb, dirty);

  return { chunks: dirty };
}

