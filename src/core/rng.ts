/**
 * Генератор случайных чисел (seed-based)
 */

export class RNG {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  nextInt(max: number): number {
    return Math.floor(this.next() * max);
  }

  nextFloat(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  setSeed(seed: number): void {
    this.seed = seed;
  }

  getSeed(): number {
    return this.seed;
  }
}

