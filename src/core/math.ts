/**
 * Векторы, кватернионы и математические помощники
 */

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface Vec2 {
  x: number;
  y: number;
}

export interface Aabb {
  min: Vec3;
  max: Vec3;
}

export class Vec3Utils {
  static create(x = 0, y = 0, z = 0): Vec3 {
    return { x, y, z };
  }

  static clone(v: Vec3): Vec3 {
    return { x: v.x, y: v.y, z: v.z };
  }

  static add(a: Vec3, b: Vec3): Vec3 {
    return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
  }

  static sub(a: Vec3, b: Vec3): Vec3 {
    return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
  }

  static mul(v: Vec3, s: number): Vec3 {
    return { x: v.x * s, y: v.y * s, z: v.z * s };
  }

  static dot(a: Vec3, b: Vec3): number {
    return a.x * b.x + a.y * b.y + a.z * b.z;
  }

  static cross(a: Vec3, b: Vec3): Vec3 {
    return {
      x: a.y * b.z - a.z * b.y,
      y: a.z * b.x - a.x * b.z,
      z: a.x * b.y - a.y * b.x,
    };
  }

  static length(v: Vec3): number {
    return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
  }

  static lengthSq(v: Vec3): number {
    return v.x * v.x + v.y * v.y + v.z * v.z;
  }

  static normalize(v: Vec3): Vec3 {
    const len = Vec3Utils.length(v);
    if (len < 1e-9) return { x: 0, y: 0, z: 0 };
    return Vec3Utils.mul(v, 1 / len);
  }

  static distance(a: Vec3, b: Vec3): number {
    return Vec3Utils.length(Vec3Utils.sub(a, b));
  }

  static distanceSq(a: Vec3, b: Vec3): number {
    return Vec3Utils.lengthSq(Vec3Utils.sub(a, b));
  }

  static lerp(a: Vec3, b: Vec3, t: number): Vec3 {
    return {
      x: a.x + (b.x - a.x) * t,
      y: a.y + (b.y - a.y) * t,
      z: a.z + (b.z - a.z) * t,
    };
  }
}

export class Mat3 {
  m: Float32Array;

  constructor() {
    this.m = new Float32Array(9);
    this.identity();
  }

  identity(): Mat3 {
    this.m.fill(0);
    this.m[0] = 1;
    this.m[4] = 1;
    this.m[8] = 1;
    return this;
  }

  multiplyVector3(v: Vec3): Vec3 {
    const m = this.m;
    return {
      x: m[0] * v.x + m[1] * v.y + m[2] * v.z,
      y: m[3] * v.x + m[4] * v.y + m[5] * v.z,
      z: m[6] * v.x + m[7] * v.y + m[8] * v.z,
    };
  }

  static fromBasis(t: Vec3, b: Vec3, n: Vec3): Mat3 {
    const mat = new Mat3();
    const m = mat.m;
    m[0] = t.x;
    m[1] = t.y;
    m[2] = t.z;
    m[3] = b.x;
    m[4] = b.y;
    m[5] = b.z;
    m[6] = n.x;
    m[7] = n.y;
    m[8] = n.z;
    return mat;
  }

  static rotateAlign(n1: Vec3, n2: Vec3): Mat3 {
    const v = Vec3Utils.cross(n1, n2);
    const s = Vec3Utils.length(v);
    const c = Vec3Utils.dot(n1, n2);

    if (s < 1e-9) {
      const mat = new Mat3();
      if (c > 0) {
        mat.identity();
      } else {
        // 180 градусов - нужно выбрать ось поворота
        const t = Math.abs(n1.x) < 0.9 ? { x: 1, y: 0, z: 0 } : { x: 0, y: 1, z: 0 };
        const axis = Vec3Utils.normalize(Vec3Utils.cross(n1, t));
        return Mat3.rotateAxis(axis, Math.PI);
      }
      return mat;
    }

    const axis = Vec3Utils.normalize(v);
    const angle = Math.atan2(s, c);
    return Mat3.rotateAxis(axis, angle);
  }

  static rotateAxis(axis: Vec3, angle: number): Mat3 {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    const t = 1 - c;
    const x = axis.x;
    const y = axis.y;
    const z = axis.z;

    const mat = new Mat3();
    const m = mat.m;
    m[0] = t * x * x + c;
    m[1] = t * x * y - s * z;
    m[2] = t * x * z + s * y;
    m[3] = t * x * y + s * z;
    m[4] = t * y * y + c;
    m[5] = t * y * z - s * x;
    m[6] = t * x * z - s * y;
    m[7] = t * y * z + s * x;
    m[8] = t * z * z + c;
    return mat;
  }
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

