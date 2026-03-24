/**
 * Типы вокселей и их свойства
 */

export interface MaterialProperties {
  density: number;
  strength: number;
  restitution: number;
  destructionRadiusMultiplier: number;
  destructible: boolean;
}

export class Materials {
  private materials: Map<number, MaterialProperties> = new Map();

  constructor() {
    // Воздух
    this.materials.set(0, {
      density: 0,
      strength: 0,
      restitution: 0,
      destructionRadiusMultiplier: 0,
      destructible: false,
    });

    // Стекло
    this.materials.set(1, {
      density: 0.25,
      strength: 1,
      restitution: 0.3,
      destructionRadiusMultiplier: 1.3,
      destructible: true,
    });

    // Дерево
    this.materials.set(2, {
      density: 0.6,
      strength: 3,
      restitution: 0.4,
      destructionRadiusMultiplier: 1.0,
      destructible: true,
    });

    // Камень
    this.materials.set(3, {
      density: 1.0,
      strength: 6,
      restitution: 0.2,
      destructionRadiusMultiplier: 0.7,
      destructible: true,
    });

    // Металл
    this.materials.set(4, {
      density: 1.2,
      strength: 10,
      restitution: 0.05,
      destructionRadiusMultiplier: 0.4,
      destructible: false, // не разрушается в MVP
    });
  }

  getProperties(matId: number): MaterialProperties {
    return this.materials.get(matId) || this.materials.get(0)!;
  }

  calculateDamage(ballMass: number, velocity: number, material: number): number {
    const props = this.getProperties(material);
    return 0.1 * ballMass * velocity; // упрощённая формула
  }

  shouldDestroy(damage: number, material: number): boolean {
    const props = this.getProperties(material);
    if (!props.destructible) return false;
    return damage >= props.strength;
  }

  getDestructionRadius(baseRadius: number, material: number): number {
    const props = this.getProperties(material);
    return baseRadius * props.destructionRadiusMultiplier;
  }
}

