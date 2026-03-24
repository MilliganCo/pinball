/**
 * Signed Distance Field для вокселей
 */

import type { Vec3 } from './math';
import { Vec3Utils } from './math';
import type { Grid3D } from './grid3d';

const EPSILON = 1e-6;

export function sdfBall(grid: Grid3D, p: Vec3, radius: number): number {
  const gridPos = grid.worldToGrid(p);
  const gx = Math.floor(gridPos.x);
  const gy = Math.floor(gridPos.y);
  const gz = Math.floor(gridPos.z);

  let minDist = Infinity;

  // Проверяем 6 соседей + текущую ячейку
  const offsets = [
    [0, 0, 0],
    [1, 0, 0],
    [-1, 0, 0],
    [0, 1, 0],
    [0, -1, 0],
    [0, 0, 1],
    [0, 0, -1],
  ];

  for (const [dx, dy, dz] of offsets) {
    const mat = grid.get(gx + dx, gy + dy, gz + dz);
    if (mat === 0) continue; // воздух

    const cellCenter = grid.gridToWorld({
      x: gx + dx,
      y: gy + dy,
      z: gz + dz,
    });

    const dist = Vec3Utils.distance(p, cellCenter) - grid.cell * 0.5;
    minDist = Math.min(minDist, dist);
  }

  return minDist === Infinity ? radius + 1 : minDist;
}

export function gradSdf(grid: Grid3D, p: Vec3, radius: number): Vec3 {
  const h = grid.cell * 0.1;
  const dx = sdfBall(grid, { x: p.x + h, y: p.y, z: p.z }, radius) - sdfBall(grid, { x: p.x - h, y: p.y, z: p.z }, radius);
  const dy = sdfBall(grid, { x: p.x, y: p.y + h, z: p.z }, radius) - sdfBall(grid, { x: p.x, y: p.y - h, z: p.z }, radius);
  const dz = sdfBall(grid, { x: p.x, y: p.y, z: p.z + h }, radius) - sdfBall(grid, { x: p.x, y: p.y, z: p.z - h }, radius);

  const grad = Vec3Utils.create(dx, dy, dz);
  const len = Vec3Utils.length(grad);
  if (len < EPSILON) {
    return { x: 0, y: 1, z: 0 }; // fallback
  }
  return Vec3Utils.mul(grad, 1 / (2 * h));
}

export function sampleSdf(grid: Grid3D, p: Vec3): number {
  const gridPos = grid.worldToGrid(p);
  const mat = grid.get(Math.floor(gridPos.x), Math.floor(gridPos.y), Math.floor(gridPos.z));
  return mat === 0 ? 1 : -1; // упрощённая версия для быстрой проверки
}

