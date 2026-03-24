/**
 * Порталы: трансформации вход/выход
 */

import type { Vec3 } from './math';
import { Vec3Utils, Mat3 } from './math';

export interface Portal {
  p: Vec3; // центр
  n: Vec3; // нормаль (внутрь)
  t: Vec3; // тангент
  b: Vec3; // бинормаль
  r: number; // радиус
}

export interface PortalPair {
  a: Portal;
  b: Portal;
}

const EPSILON = 0.01;

function isInsideDisk(p: Vec3, portal: Portal): boolean {
  const rel = Vec3Utils.sub(p, portal.p);
  const distToPlane = Vec3Utils.dot(rel, portal.n);
  if (Math.abs(distToPlane) > EPSILON) return false;

  const distToCenter = Vec3Utils.length(Vec3Utils.sub(rel, Vec3Utils.mul(portal.n, distToPlane)));
  return distToCenter <= portal.r;
}

function intersectSegmentDisk(
  p0: Vec3,
  p1: Vec3,
  portal: Portal
): { t: number; hit: boolean } {
  const d = Vec3Utils.sub(p1, p0);
  const w = Vec3Utils.sub(p0, portal.p);
  const dn = Vec3Utils.dot(d, portal.n);
  const wn = Vec3Utils.dot(w, portal.n);

  if (Math.abs(dn) < 1e-9) {
    // параллельно плоскости
    if (Math.abs(wn) > EPSILON) return { t: -1, hit: false };
    const t = 0;
    const hitPoint = Vec3Utils.add(p0, Vec3Utils.mul(d, t));
    return { t, hit: isInsideDisk(hitPoint, portal) };
  }

  const t = -wn / dn;
  if (t < 0 || t > 1) return { t: -1, hit: false };

  const hitPoint = Vec3Utils.add(p0, Vec3Utils.mul(d, t));
  return { t, hit: isInsideDisk(hitPoint, portal) };
}

export function tryTeleport(
  prev: Vec3,
  next: Vec3,
  v: Vec3,
  A: Portal,
  B: Portal
): { x: Vec3; v: Vec3 } | null {
  // Проверяем пересечение с диском портала A
  const prevSide = Vec3Utils.dot(Vec3Utils.sub(prev, A.p), A.n);
  const nextSide = Vec3Utils.dot(Vec3Utils.sub(next, A.p), A.n);

  // Должны перейти через плоскость (с положительной стороны на отрицательную)
  if (prevSide <= 0 || nextSide >= 0) return null;

  const intersect = intersectSegmentDisk(prev, next, A);
  if (!intersect.hit) return null;

  // Локальные координаты относительно портала A
  const pRel = Vec3Utils.sub(next, A.p);

  // Строим матрицу поворота от базиса A к базису B
  const R = Mat3.fromBasis(
    Vec3Utils.normalize(A.t),
    Vec3Utils.normalize(A.b),
    Vec3Utils.normalize(A.n)
  );
  const RInv = Mat3.fromBasis(
    Vec3Utils.normalize(B.t),
    Vec3Utils.normalize(B.b),
    Vec3Utils.normalize(B.n)
  );

  // Трансформируем локальный вектор
  const pLocal = R.multiplyVector3(pRel);
  const pOut = Vec3Utils.add(B.p, RInv.multiplyVector3(pLocal));
  const vOut = RInv.multiplyVector3(R.multiplyVector3(v));

  // Небольшой отступ от портала B
  const offset = Vec3Utils.mul(B.n, EPSILON);
  return {
    x: Vec3Utils.add(pOut, offset),
    v: vOut,
  };
}

export function createPortal(
  pos: Vec3,
  normal: Vec3,
  radius: number
): Portal {
  const n = Vec3Utils.normalize(normal);
  let t: Vec3;
  let b: Vec3;

  // Выбираем ортогональный базис
  if (Math.abs(n.y) < 0.9) {
    t = Vec3Utils.normalize(Vec3Utils.cross(n, { x: 0, y: 1, z: 0 }));
  } else {
    t = Vec3Utils.normalize(Vec3Utils.cross(n, { x: 1, y: 0, z: 0 }));
  }
  b = Vec3Utils.normalize(Vec3Utils.cross(n, t));

  return { p: pos, n, t, b, r: radius };
}

