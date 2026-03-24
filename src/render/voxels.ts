/**
 * InstancedMesh менеджер для вокселей
 */

import * as THREE from 'three';
import type { Grid3D } from '../core/grid3d';
import type { Materials } from '../game/materials';

const MATERIAL_COLORS: Record<number, number> = {
  0: 0x000000, // воздух (не рендерится)
  1: 0x88ccff, // стекло
  2: 0x8b4513, // дерево
  3: 0x808080, // камень
  4: 0xc0c0c0, // металл
};

export class VoxelRenderer {
  private grid: Grid3D;
  private materials: Materials;
  private meshes: Map<number, THREE.InstancedMesh> = new Map();
  private instanceMatrices: Map<number, Float32Array> = new Map();
  private instanceCounts: Map<number, number> = new Map();
  private dirtyChunks: Set<number> = new Set();

  constructor(grid: Grid3D, materials: Materials) {
    this.grid = grid;
    this.materials = materials;
    this.initializeMeshes();
  }

  private initializeMeshes(): void {
    // Создаём InstancedMesh для каждого материала
    const geometry = new THREE.BoxGeometry(
      this.grid.cell * 0.95,
      this.grid.cell * 0.95,
      this.grid.cell * 0.95
    );

    for (let matId = 1; matId <= 4; matId++) {
      const color = MATERIAL_COLORS[matId] || 0xffffff;
      const material = new THREE.MeshStandardMaterial({ color });
      if (matId === 1) {
        // Стекло прозрачное
        material.transparent = true;
        material.opacity = 0.7;
      }

      const maxInstances = 100000;
      const mesh = new THREE.InstancedMesh(geometry, material, maxInstances);
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      this.meshes.set(matId, mesh);
      this.instanceMatrices.set(matId, new Float32Array(maxInstances * 16));
      this.instanceCounts.set(matId, 0);
    }
  }

  rebuildAll(): void {
    // Полная перестройка (для начальной загрузки)
    for (let matId = 1; matId <= 4; matId++) {
      this.instanceCounts.set(matId, 0);
    }

    const matrix = new THREE.Matrix4();
    for (let z = 0; z < this.grid.nz; z++) {
      for (let y = 0; y < this.grid.ny; y++) {
        for (let x = 0; x < this.grid.nx; x++) {
          const mat = this.grid.get(x, y, z);
          if (mat === 0) continue;

          const count = this.instanceCounts.get(mat)!;
          const worldPos = this.grid.gridToWorld({ x, y, z });
          matrix.makeTranslation(worldPos.x, worldPos.y, worldPos.z);
          const matrices = this.instanceMatrices.get(mat)!;
          matrix.toArray(matrices, count * 16);
          this.instanceCounts.set(mat, count + 1);
        }
      }
    }

    // Обновляем матрицы
    for (const [matId, mesh] of this.meshes) {
      const count = this.instanceCounts.get(matId)!;
      const matrices = this.instanceMatrices.get(matId)!;
      // Обновляем матрицы инстансов
      for (let i = 0; i < count; i++) {
        const matrix = new THREE.Matrix4();
        matrix.fromArray(matrices, i * 16);
        mesh.setMatrixAt(i, matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
      mesh.count = count;
    }
  }

  markDirty(chunks: Set<number>): void {
    chunks.forEach((chunk) => this.dirtyChunks.add(chunk));
  }

  updateDirty(): void {
    if (this.dirtyChunks.size === 0) return;

    // Пересчитываем затронутые чанки
    const chunkSize = this.grid.chunk;
    const chunksX = this.grid.chunksX;
    const chunksY = this.grid.chunksY;

    // Сбрасываем счётчики для затронутых материалов
    const affectedMaterials = new Set<number>();

    for (const chunkIdx of this.dirtyChunks) {
      const cz = Math.floor(chunkIdx / (chunksX * chunksY));
      const cy = Math.floor((chunkIdx % (chunksX * chunksY)) / chunksX);
      const cx = chunkIdx % chunksX;

      const x0 = cx * chunkSize;
      const y0 = cy * chunkSize;
      const z0 = cz * chunkSize;
      const x1 = Math.min(x0 + chunkSize, this.grid.nx);
      const y1 = Math.min(y0 + chunkSize, this.grid.ny);
      const z1 = Math.min(z0 + chunkSize, this.grid.nz);

      for (let z = z0; z < z1; z++) {
        for (let y = y0; y < y1; y++) {
          for (let x = x0; x < x1; x++) {
            const mat = this.grid.get(x, y, z);
            if (mat > 0) affectedMaterials.add(mat);
          }
        }
      }
    }

    // Пересобираем все меши (упрощённая версия)
    // В продакшене здесь нужно инкрементальное обновление
    this.rebuildAll();
    this.dirtyChunks.clear();
  }

  addToScene(scene: THREE.Scene): void {
    for (const mesh of this.meshes.values()) {
      scene.add(mesh);
    }
  }

  dispose(): void {
    for (const mesh of this.meshes.values()) {
      mesh.geometry.dispose();
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((m) => m.dispose());
      } else {
        mesh.material.dispose();
      }
    }
  }
}

