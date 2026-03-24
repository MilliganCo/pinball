/**
 * Физика шара: интегратор, столкновения
 */

import type { Vec3 } from './math';
import { Vec3Utils } from './math';
import type { Grid3D } from './grid3d';
import { sdfBall, gradSdf } from './sdf';
import type { PortalPair } from './portals';
import { tryTeleport } from './portals';
import type { Materials } from '../game/materials';

export interface EnvForces {
  gravity: Vec3;
  fluidVelocity?: Vec3;
  fluidDrag?: number;
  buoyancy?: number;
  submergedFraction?: number;
}

export interface CollisionInfo {
  hit: boolean;
  normal?: Vec3;
  material?: number;
}

export class Ball {
  pos: Vec3;
  vel: Vec3;
  radius: number;
  mass: number;

  constructor(pos: Vec3, radius: number, mass: number) {
    this.pos = Vec3Utils.clone(pos);
    this.vel = Vec3Utils.create(0, 0, 0);
    this.radius = radius;
    this.mass = mass;
  }

  step(
    dt: number,
    env: EnvForces,
    grid: Grid3D,
    portals: PortalPair[],
    materials: Materials
  ): CollisionInfo {
    // Применяем силы
    let acc = Vec3Utils.clone(env.gravity);

    // Силы от жидкости
    if (env.fluidVelocity && env.submergedFraction && env.submergedFraction > 0) {
      const fluidRel = Vec3Utils.sub(env.fluidVelocity, this.vel);
      const dragForce = Vec3Utils.mul(fluidRel, (env.fluidDrag || 0) * env.submergedFraction);
      acc = Vec3Utils.add(acc, dragForce);

      if (env.buoyancy) {
        const buoyancyForce = Vec3Utils.mul({ x: 0, y: 1, z: 0 }, env.buoyancy * env.submergedFraction);
        acc = Vec3Utils.add(acc, buoyancyForce);
      }
    }

    // Semi-implicit Euler
    this.vel = Vec3Utils.add(this.vel, Vec3Utils.mul(acc, dt));
    const nextPos = Vec3Utils.add(this.pos, Vec3Utils.mul(this.vel, dt));

    // Проверка порталов (CCD)
    for (const pair of portals) {
      const teleport = tryTeleport(this.pos, nextPos, this.vel, pair.a, pair.b);
      if (teleport) {
        this.pos = teleport.x;
        this.vel = teleport.v;
        return { hit: false };
      }
    }

    // Столкновение с вокселями
    const sdfDist = sdfBall(grid, nextPos, this.radius);
    if (sdfDist < this.radius) {
      const normal = Vec3Utils.normalize(gradSdf(grid, nextPos, this.radius));
      const penetration = this.radius - sdfDist;

      // Коррекция позиции
      this.pos = Vec3Utils.add(nextPos, Vec3Utils.mul(normal, penetration));

      // Определяем материал в точке контакта
      const gridPos = grid.worldToGrid(this.pos);
      const contactMat = grid.get(Math.floor(gridPos.x), Math.floor(gridPos.y), Math.floor(gridPos.z));
      const matProps = materials.getProperties(contactMat);

      // Отскок
      const vn = Vec3Utils.dot(this.vel, normal);
      if (vn < 0) {
        const restitution = matProps.restitution;
        this.vel = Vec3Utils.sub(this.vel, Vec3Utils.mul(normal, (1 + restitution) * vn));
      }

      // Трение
      const mu = 0.1;
      this.vel = Vec3Utils.mul(this.vel, 1 - mu * dt);

      return {
        hit: true,
        normal,
        material: contactMat,
      };
    }

    this.pos = nextPos;
    return { hit: false };
  }
}

