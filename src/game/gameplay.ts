/**
 * Состояния игры: aim → fly → resolve → win/lose
 */

import type { Vec3 } from '../core/math';
import { Vec3Utils } from '../core/math';
import type { Ball, EnvForces } from '../core/physics';
import { Ball as BallImpl } from '../core/physics';
import type { Level } from './level';
import type { GoalZone } from './goals';
import { GoalZone as GoalZoneImpl } from './goals';
import type { Materials } from './materials';
import { destroySphere } from '../core/destruct';
import type { Fluid } from '../core/fluid/fluid';

export enum GameState {
  AIM = 'aim',
  FLY = 'fly',
  RESOLVE = 'resolve',
  WIN = 'win',
  LOSE = 'lose',
}

export class Gameplay {
  state: GameState = GameState.AIM;
  ball: Ball | null = null;
  level: Level | null = null;
  goal: GoalZone | null = null;
  materials: Materials;
  aimDirection: Vec3 = { x: 1, y: 0, z: 0 };
  aimPower: number = 0;
  destroyedCount: number = 0;
  timeElapsed: number = 0;
  lastDirtyChunks: Set<number> = new Set();

  constructor(materials: Materials) {
    this.materials = materials;
  }

  loadLevel(level: Level): void {
    this.level = level;
    this.goal = new GoalZoneImpl(level.goalPos, level.goalRadius);
    this.state = GameState.AIM;
    this.destroyedCount = 0;
    this.timeElapsed = 0;
    this.ball = null;
  }

  startAim(direction: Vec3): void {
    if (this.state !== GameState.AIM || !this.level) return;
    this.aimDirection = Vec3Utils.normalize(direction);
    this.aimPower = 0;
  }

  updateAimPower(power: number): void {
    if (this.state !== GameState.AIM) return;
    this.aimPower = Math.max(0, Math.min(1, power));
  }

  launch(): void {
    if (this.state !== GameState.AIM || !this.level) return;

    const maxSpeed = 30;
    const velocity = Vec3Utils.mul(this.aimDirection, this.aimPower * maxSpeed);
    this.ball = new BallImpl(this.level.startPos, 0.5, 1.0);
    this.ball.vel = velocity;

    this.state = GameState.FLY;
  }

  step(dt: number, fluid: Fluid | null): void {
    if (this.state !== GameState.FLY || !this.ball || !this.level) return;

    this.timeElapsed += dt;

    // Подготавливаем силы окружения
    const envForces: EnvForces = {
      gravity: { x: 0, y: -9.81, z: 0 },
    };

    if (fluid) {
      const gridPos = this.level.grid.worldToGrid(this.ball.pos);
      const fluidVel = fluid.getVelocityAt(Math.floor(gridPos.x), Math.floor(gridPos.z));
      const submerged = fluid.getSubmergedFraction(this.ball.pos, this.ball.radius);

      envForces.fluidVelocity = fluidVel;
      envForces.fluidDrag = 5.0;
      envForces.buoyancy = 2.0;
      envForces.submergedFraction = submerged;
    }

    // Шаг физики
    const collision = this.ball.step(dt, envForces, this.level.grid, this.level.portals, this.materials);

    // Проверка разрушения
    if (collision.hit && collision.material !== undefined) {
      const velocity = Vec3Utils.length(this.ball.vel);
      const damage = this.materials.calculateDamage(this.ball.mass, velocity, collision.material);

      if (this.materials.shouldDestroy(damage, collision.material)) {
        const baseRadius = 0.6;
        const destructionRadius = this.materials.getDestructionRadius(baseRadius, collision.material);
        const matMask = [1, 2, 3]; // стекло, дерево, камень

        const dirty = destroySphere(
          this.level.grid,
          this.ball.pos,
          destructionRadius,
          matMask
        );

        dirty.chunks.forEach((chunk) => this.lastDirtyChunks.add(chunk));
        this.destroyedCount += dirty.chunks.size * 100; // примерная оценка
      }
    }

    // Проверка финиша
    if (this.goal && this.goal.checkBallInside(this.ball.pos, this.ball.radius)) {
      this.state = GameState.WIN;
      return;
    }

    // Проверка проигрыша (шар упал слишком низко)
    if (this.ball.pos.y < -10) {
      this.state = GameState.LOSE;
      return;
    }

    // Таймаут
    if (this.timeElapsed > 60) {
      this.state = GameState.LOSE;
    }
  }

  restart(): void {
    if (!this.level) return;
    const level = this.level;
    this.level = null;
    this.loadLevel(level);
  }

  getAndClearDirtyChunks(): Set<number> {
    const chunks = new Set(this.lastDirtyChunks);
    this.lastDirtyChunks.clear();
    return chunks;
  }
}

