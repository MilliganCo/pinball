/**
 * Зона финиша
 */

import type { Vec3 } from '../core/math';
import { Vec3Utils } from '../core/math';

export class GoalZone {
  pos: Vec3;
  radius: number;

  constructor(pos: Vec3, radius: number) {
    this.pos = pos;
    this.radius = radius;
  }

  checkBallInside(ballPos: Vec3, ballRadius: number): boolean {
    const dist = Vec3Utils.distance(ballPos, this.pos);
    return dist + ballRadius <= this.radius;
  }
}

