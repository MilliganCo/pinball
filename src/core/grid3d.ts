/**
 * 3D сетка вокселей с чанками
 */

import type { Vec3, Aabb } from './math';
import { Vec3Utils } from './math';

export interface DirtyRanges {
  chunks: Set<number>;
}

export class Grid3D {
  readonly nx: number;
  readonly ny: number;
  readonly nz: number;
  readonly cell: number;
  readonly chunk: number;
  readonly chunksX: number;
  readonly chunksY: number;
  readonly chunksZ: number;
  readonly totalChunks: number;

  data: Uint8Array; // материал по вокселю

  constructor(nx: number, ny: number, nz: number, cell: number, chunkSize: number) {
    this.nx = nx;
    this.ny = ny;
    this.nz = nz;
    this.cell = cell;
    this.chunk = chunkSize;
    this.chunksX = Math.ceil(nx / chunkSize);
    this.chunksY = Math.ceil(ny / chunkSize);
    this.chunksZ = Math.ceil(nz / chunkSize);
    this.totalChunks = this.chunksX * this.chunksY * this.chunksZ;
    this.data = new Uint8Array(nx * ny * nz);
  }

  idx(x: number, y: number, z: number): number {
    if (x < 0 || x >= this.nx || y < 0 || y >= this.ny || z < 0 || z >= this.nz) {
      return -1;
    }
    return x + this.nx * (y + this.ny * z);
  }

  get(x: number, y: number, z: number): number {
    const i = this.idx(x, y, z);
    return i >= 0 ? this.data[i] : 0;
  }

  set(x: number, y: number, z: number, mat: number): void {
    const i = this.idx(x, y, z);
    if (i >= 0) {
      this.data[i] = mat;
    }
  }

  worldToGrid(world: Vec3): Vec3 {
    return {
      x: Math.floor(world.x / this.cell),
      y: Math.floor(world.y / this.cell),
      z: Math.floor(world.z / this.cell),
    };
  }

  gridToWorld(grid: Vec3): Vec3 {
    return {
      x: grid.x * this.cell + this.cell * 0.5,
      y: grid.y * this.cell + this.cell * 0.5,
      z: grid.z * this.cell + this.cell * 0.5,
    };
  }

  chunkIdx(gx: number, gy: number, gz: number): number {
    const cx = Math.floor(gx / this.chunk);
    const cy = Math.floor(gy / this.chunk);
    const cz = Math.floor(gz / this.chunk);
    if (cx < 0 || cx >= this.chunksX || cy < 0 || cy >= this.chunksY || cz < 0 || cz >= this.chunksZ) {
      return -1;
    }
    return cx + this.chunksX * (cy + this.chunksY * cz);
  }

  chunkIdxFromWorld(world: Vec3): number {
    const grid = this.worldToGrid(world);
    return this.chunkIdx(grid.x, grid.y, grid.z);
  }

  aabbOfSphere(cx: number, cy: number, cz: number, r: number): Aabb {
    const grid = this.worldToGrid({ x: cx, y: cy, z: cz });
    const radiusGrid = Math.ceil(r / this.cell);
    return {
      min: {
        x: Math.max(0, grid.x - radiusGrid),
        y: Math.max(0, grid.y - radiusGrid),
        z: Math.max(0, grid.z - radiusGrid),
      },
      max: {
        x: Math.min(this.nx - 1, grid.x + radiusGrid),
        y: Math.min(this.ny - 1, grid.y + radiusGrid),
        z: Math.min(this.nz - 1, grid.z + radiusGrid),
      },
    };
  }

  fillBox(
    minX: number,
    minY: number,
    minZ: number,
    maxX: number,
    maxY: number,
    maxZ: number,
    mat: number
  ): void {
    for (let z = minZ; z <= maxZ; z++) {
      for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
          this.set(x, y, z, mat);
        }
      }
    }
  }

  markDirtyChunks(aabb: Aabb, dirty: Set<number>): void {
    const minChunk = this.chunkIdx(aabb.min.x, aabb.min.y, aabb.min.z);
    const maxChunk = this.chunkIdx(aabb.max.x, aabb.max.y, aabb.max.z);

    const minCx = Math.floor(aabb.min.x / this.chunk);
    const maxCx = Math.floor(aabb.max.x / this.chunk);
    const minCy = Math.floor(aabb.min.y / this.chunk);
    const maxCy = Math.floor(aabb.max.y / this.chunk);
    const minCz = Math.floor(aabb.min.z / this.chunk);
    const maxCz = Math.floor(aabb.max.z / this.chunk);

    for (let cz = minCz; cz <= maxCz; cz++) {
      for (let cy = minCy; cy <= maxCy; cy++) {
        for (let cx = minCx; cx <= maxCx; cx++) {
          const idx = cx + this.chunksX * (cy + this.chunksY * cz);
          if (idx >= 0 && idx < this.totalChunks) {
            dirty.add(idx);
          }
        }
      }
    }
  }
}

