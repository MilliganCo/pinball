/**
 * Загрузка и валидация уровня
 */

import type { Vec3 } from '../core/math';
import type { Grid3D } from '../core/grid3d';
import { Grid3D as Grid3DImpl } from '../core/grid3d';
import type { PortalPair } from '../core/portals';
import { createPortal } from '../core/portals';
import type { Reservoir } from '../core/fluid/fluid';

export interface LevelData {
  seed: number;
  grid: {
    size: [number, number, number];
    chunk: number;
    cell: number;
  };
  materials: {
    air: number;
    glass: number;
    wood: number;
    stone: number;
    metal: number;
  };
  voxels: Array<{
    box: [number, number, number, number, number, number];
    mat: string;
  }>;
  reservoirs: Array<{
    rect: [number, number, number, number, number, number];
    h: number;
  }>;
  portals: Array<{
    a: { pos: [number, number, number]; n: [number, number, number]; r: number };
    b: { pos: [number, number, number]; n: [number, number, number]; r: number };
  }>;
  start: { pos: [number, number, number] };
  goal: { pos: [number, number, number]; r: number };
}

export class Level {
  data: LevelData;
  grid: Grid3D;
  portals: PortalPair[];
  reservoirs: Reservoir[];
  startPos: Vec3;
  goalPos: Vec3;
  goalRadius: number;

  constructor(data: LevelData) {
    this.data = data;
    const [nx, ny, nz] = data.grid.size;
    this.grid = new Grid3DImpl(nx, ny, nz, data.grid.cell, data.grid.chunk);

    // Загружаем воксели
    const matMap = data.materials;
    for (const voxel of data.voxels) {
      const [x0, y0, z0, x1, y1, z1] = voxel.box;
      const matId = matMap[voxel.mat as keyof typeof matMap];
      this.grid.fillBox(x0, y0, z0, x1 - 1, y1 - 1, z1 - 1, matId);
    }

    // Создаём порталы
    this.portals = data.portals.map((p) => ({
      a: createPortal(
        { x: p.a.pos[0], y: p.a.pos[1], z: p.a.pos[2] },
        { x: p.a.n[0], y: p.a.n[1], z: p.a.n[2] },
        p.a.r
      ),
      b: createPortal(
        { x: p.b.pos[0], y: p.b.pos[1], z: p.b.pos[2] },
        { x: p.b.n[0], y: p.b.n[1], z: p.b.n[2] },
        p.b.r
      ),
    }));

    // Резервуары
    this.reservoirs = data.reservoirs.map((r) => ({
      rect: r.rect,
      h: r.h,
    }));

    // Старт и финиш
    this.startPos = { x: data.start.pos[0], y: data.start.pos[1], z: data.start.pos[2] };
    this.goalPos = { x: data.goal.pos[0], y: data.goal.pos[1], z: data.goal.pos[2] };
    this.goalRadius = data.goal.r;
  }

  static async load(path: string): Promise<Level> {
    const response = await fetch(path);
    const data: LevelData = await response.json();
    return new Level(data);
  }
}

