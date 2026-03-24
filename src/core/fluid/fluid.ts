/**
 * CPU интерфейс для shallow-water жидкости
 */

import type { Vec3 } from '../math';

export interface FluidConfig {
  width: number;
  height: number;
  cellSize: number;
  gravity: number;
  damping: number;
}

export interface Reservoir {
  rect: [number, number, number, number, number, number]; // [x, y, z, w, h, d]
  h: number; // уровень воды
}

export class Fluid {
  private config: FluidConfig;
  private h: Float32Array; // высота
  private u: Float32Array; // скорость x
  private v: Float32Array; // скорость y
  private hNext: Float32Array;
  private uNext: Float32Array;
  private vNext: Float32Array;

  constructor(config: FluidConfig) {
    this.config = config;
    const size = config.width * config.height;
    this.h = new Float32Array(size);
    this.u = new Float32Array(size);
    this.v = new Float32Array(size);
    this.hNext = new Float32Array(size);
    this.uNext = new Float32Array(size);
    this.vNext = new Float32Array(size);
  }

  getWidth(): number {
    return this.config.width;
  }

  getHeight(): number {
    return this.config.height;
  }

  getCellSize(): number {
    return this.config.cellSize;
  }

  idx(x: number, y: number): number {
    if (x < 0 || x >= this.config.width || y < 0 || y >= this.config.height) {
      return -1;
    }
    return y * this.config.width + x;
  }

  getHeightAt(x: number, y: number): number {
    const i = this.idx(x, y);
    return i >= 0 ? this.h[i] : 0;
  }

  setHeightAt(x: number, y: number, h: number): void {
    const i = this.idx(x, y);
    if (i >= 0) {
      this.h[i] = h;
    }
  }

  getVelocityAt(x: number, y: number): Vec3 {
    const i = this.idx(x, y);
    if (i < 0) return { x: 0, y: 0, z: 0 };
    return { x: this.u[i], y: 0, z: this.v[i] };
  }

  fillReservoir(reservoir: Reservoir): void {
    const [rx, ry, rz, rw, rh, rd] = reservoir.rect;
    const cellSize = this.config.cellSize;

    const minX = Math.floor(rx / cellSize);
    const maxX = Math.floor((rx + rw) / cellSize);
    const minY = Math.floor(rz / cellSize);
    const maxY = Math.floor((rz + rd) / cellSize);

    for (let y = minY; y < maxY; y++) {
      for (let x = minX; x < maxX; x++) {
        if (x >= 0 && x < this.config.width && y >= 0 && y < this.config.height) {
          const i = this.idx(x, y);
          if (i >= 0) {
            this.h[i] = reservoir.h;
          }
        }
      }
    }
  }

  step(dt: number): void {
    const { width, height, cellSize, gravity, damping } = this.config;

    // Простой shallow-water шаг (CPU версия, упрощённая)
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = y * width + x;
        const h = this.h[i];
        const u = this.u[i];
        const v = this.v[i];

        // Advection (semi-Lagrangian, упрощённый)
        const prevX = x - u * dt / cellSize;
        const prevY = y - v * dt / cellSize;
        const srcH = this.sampleHeight(prevX, prevY);

        // Pressure gradient (shallow water)
        const hRight = this.getHeightAt(x + 1, y);
        const hLeft = this.getHeightAt(x - 1, y);
        const hUp = this.getHeightAt(x, y + 1);
        const hDown = this.getHeightAt(x, y - 1);

        const px = (hRight - hLeft) / (2 * cellSize);
        const py = (hUp - hDown) / (2 * cellSize);

        const uNew = u - gravity * px * dt;
        const vNew = v - gravity * py * dt;

        this.hNext[i] = srcH;
        this.uNext[i] = uNew * damping;
        this.vNext[i] = vNew * damping;
      }
    }

    // Swap buffers
    const tmp = this.h;
    this.h = this.hNext;
    this.hNext = tmp;

    const tmpU = this.u;
    this.u = this.uNext;
    this.uNext = tmpU;

    const tmpV = this.v;
    this.v = this.vNext;
    this.vNext = tmpV;
  }

  private sampleHeight(x: number, y: number): number {
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const x1 = x0 + 1;
    const y1 = y0 + 1;

    const fx = x - x0;
    const fy = y - y0;

    const h00 = this.getHeightAt(x0, y0);
    const h10 = this.getHeightAt(x1, y0);
    const h01 = this.getHeightAt(x0, y1);
    const h11 = this.getHeightAt(x1, y1);

    const h0 = h00 * (1 - fx) + h10 * fx;
    const h1 = h01 * (1 - fx) + h11 * fx;
    return h0 * (1 - fy) + h1 * fy;
  }

  getSubmergedFraction(worldPos: Vec3, radius: number): number {
    const x = Math.floor(worldPos.x / this.config.cellSize);
    const z = Math.floor(worldPos.z / this.config.cellSize);
    const h = this.getHeightAt(x, z);
    const ballBottom = worldPos.y - radius;
    const waterLevel = h;

    if (ballBottom >= waterLevel) return 0;
    if (worldPos.y + radius <= waterLevel) return 1;

    const submerged = waterLevel - ballBottom;
    return Math.min(1, submerged / (2 * radius));
  }
}

