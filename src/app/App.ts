/**
 * Главный класс приложения
 */

import * as THREE from 'three';
import type { Renderer } from '../render/renderer';
import { Renderer as RendererImpl } from '../render/renderer';
import type { VoxelRenderer } from '../render/voxels';
import { VoxelRenderer as VoxelRendererImpl } from '../render/voxels';
import type { DebugHelpers } from '../render/debug';
import { DebugHelpers as DebugHelpersImpl } from '../render/debug';
import type { HUD } from '../render/ui/hud';
import { HUD as HUDImpl } from '../render/ui/hud';
import type { Gameplay } from '../game/gameplay';
import { Gameplay as GameplayImpl, GameState } from '../game/gameplay';
import type { Materials } from '../game/materials';
import { Materials as MaterialsImpl } from '../game/materials';
import type { Level } from '../game/level';
import { Level as LevelImpl } from '../game/level';
import type { Fluid } from '../core/fluid/fluid';
import { Fluid as FluidImpl } from '../core/fluid/fluid';
import { Vec3Utils } from '../core/math';

export class App {
  private renderer: Renderer;
  private voxelRenderer: VoxelRenderer | null = null;
  private debug: DebugHelpers;
  private hud: HUD;
  private gameplay: Gameplay;
  private materials: Materials;
  private fluid: Fluid | null = null;
  private ballMesh: THREE.Mesh | null = null;
  private portalMeshes: THREE.Group | null = null;
  private goalMesh: THREE.Mesh | null = null;

  private isMouseDown = false;
  private mouseStartTime = 0;
  private currentLevelIndex = 0;
  private level: Level | null = null;

  private readonly FIXED_DT = 1 / 120;

  constructor(container: HTMLElement) {
    this.renderer = new RendererImpl(container);
    this.debug = new DebugHelpersImpl();
    this.hud = new HUDImpl();
    this.materials = new MaterialsImpl();
    this.gameplay = new GameplayImpl(this.materials);

    this.setupInput();
    this.loadLevel(0);
    this.animate();
  }

  private async loadLevel(index: number): Promise<void> {
    const levels = ['/assets/levels/level1.json', '/assets/levels/level2.json', '/assets/levels/level3.json'];
    const levelPath = levels[index % levels.length];

    try {
      this.level = await LevelImpl.load(levelPath);
      this.gameplay.loadLevel(this.level);

      // Инициализируем рендерер вокселей
      if (this.voxelRenderer) {
        this.voxelRenderer.dispose();
      }
      this.voxelRenderer = new VoxelRendererImpl(this.level.grid, this.materials);
      this.voxelRenderer.rebuildAll();
      this.voxelRenderer.addToScene(this.renderer.scene);

      // Инициализируем жидкость
      if (this.level.reservoirs.length > 0) {
        this.fluid = new FluidImpl({
          width: 256,
          height: 256,
          cellSize: this.level.grid.cell,
          gravity: 9.81,
          damping: 0.99,
        });

        for (const reservoir of this.level.reservoirs) {
          this.fluid.fillReservoir(reservoir);
        }
      }

      // Создаём меш шара
      this.createBallMesh();

      // Создаём порталы
      this.createPortalMeshes();

      // Создаём финиш
      this.createGoalMesh();

      this.hud.showMessage(`Уровень ${index + 1}`, 2000);
    } catch (error) {
      console.error('Ошибка загрузки уровня:', error);
      this.hud.showMessage('Ошибка загрузки уровня', 3000);
    }
  }

  private createBallMesh(): void {
    if (this.ballMesh) {
      this.renderer.scene.remove(this.ballMesh);
    }

    const geometry = new THREE.SphereGeometry(0.5, 16, 16);
    const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    this.ballMesh = new THREE.Mesh(geometry, material);
    this.renderer.scene.add(this.ballMesh);
  }

  private createPortalMeshes(): void {
    if (this.portalMeshes) {
      this.renderer.scene.remove(this.portalMeshes);
    }

    if (!this.level) return;

    this.portalMeshes = new THREE.Group();

    for (const pair of this.level.portals) {
      // Портал A
      const portalA = this.createPortalMesh(pair.a);
      this.portalMeshes.add(portalA);

      // Портал B
      const portalB = this.createPortalMesh(pair.b);
      this.portalMeshes.add(portalB);
    }

    this.renderer.scene.add(this.portalMeshes);
  }

  private createPortalMesh(portal: { p: { x: number; y: number; z: number }; n: { x: number; y: number; z: number }; r: number }): THREE.Group {
    const group = new THREE.Group();
    const geometry = new THREE.RingGeometry(portal.r * 0.8, portal.r, 32);
    const material = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.6,
    });
    const mesh = new THREE.Mesh(geometry, material);

    // Ориентируем диск по нормали
    const normal = new THREE.Vector3(portal.n.x, portal.n.y, portal.n.z).normalize();
    mesh.lookAt(
      portal.p.x + normal.x,
      portal.p.y + normal.y,
      portal.p.z + normal.z
    );
    mesh.position.set(portal.p.x, portal.p.y, portal.p.z);

    group.add(mesh);
    return group;
  }

  private createGoalMesh(): void {
    if (this.goalMesh) {
      this.renderer.scene.remove(this.goalMesh);
    }

    if (!this.level) return;

    const geometry = new THREE.ConeGeometry(this.level.goalRadius, 2, 32);
    const material = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      transparent: true,
      opacity: 0.5,
    });
    this.goalMesh = new THREE.Mesh(geometry, material);
    this.goalMesh.position.set(
      this.level.goalPos.x,
      this.level.goalPos.y,
      this.level.goalPos.z
    );
    this.renderer.scene.add(this.goalMesh);
  }

  private setupInput(): void {
    // Мышь
    window.addEventListener('mousedown', (e) => {
      if (e.button === 0 && this.gameplay.state === GameState.AIM) {
        this.isMouseDown = true;
        this.mouseStartTime = Date.now();
        const direction = this.getAimDirection(e);
        this.gameplay.startAim(direction);
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (this.isMouseDown && this.gameplay.state === GameState.AIM) {
        const direction = this.getAimDirection(e);
        this.gameplay.startAim(direction);
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0 && this.isMouseDown) {
        this.isMouseDown = false;
        if (this.gameplay.state === GameState.AIM) {
          this.gameplay.launch();
        }
      }
    });

    // Клавиатура
    window.addEventListener('keydown', (e) => {
      if (e.key === 'r' || e.key === 'R') {
        this.gameplay.restart();
        if (this.level) {
          this.voxelRenderer?.rebuildAll();
        }
      } else if (e.key === 'n' || e.key === 'N') {
        this.currentLevelIndex++;
        this.loadLevel(this.currentLevelIndex);
      }
    });
  }

  private getAimDirection(e: MouseEvent): { x: number; y: number; z: number } {
    // Простая проекция направления прицела на горизонтальную плоскость
    const rect = this.renderer.renderer.domElement.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const z = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    return Vec3Utils.normalize({ x, y: 0, z: -z });
  }

  private animate = (): void => {
    requestAnimationFrame(this.animate);

    this.debug.beginFrame();

    // Обновляем силу прицела
    if (this.isMouseDown && this.gameplay.state === GameState.AIM) {
      const holdTime = (Date.now() - this.mouseStartTime) / 1000;
      const power = Math.min(1, holdTime / 2); // максимум за 2 секунды
      this.gameplay.updateAimPower(power);
      this.hud.updatePower(power);
      this.hud.updateAimArrow(this.gameplay.aimDirection, true);
    } else if (this.gameplay.state === GameState.AIM) {
      this.hud.updateAimArrow(this.gameplay.aimDirection, true);
    } else {
      this.hud.updateAimArrow({ x: 0, y: 0, z: 0 }, false);
    }

    // Шаг физики
    if (this.gameplay.state === GameState.FLY) {
      this.gameplay.step(this.FIXED_DT, this.fluid || null);

      // Обновляем меш шара
      if (this.gameplay.ball && this.ballMesh) {
        this.ballMesh.position.set(
          this.gameplay.ball.pos.x,
          this.gameplay.ball.pos.y,
          this.gameplay.ball.pos.z
        );

        // Камера следует за шаром
        this.renderer.followBall(this.gameplay.ball.pos);

        // Обновляем статистику
        const speed = Vec3Utils.length(this.gameplay.ball.vel);
        this.hud.updateStats(
          this.gameplay.destroyedCount,
          speed,
          this.gameplay.timeElapsed
        );
      }

      // Обновляем воксели если нужно
      if (this.voxelRenderer) {
        const dirtyChunks = this.gameplay.getAndClearDirtyChunks();
        if (dirtyChunks.size > 0) {
          this.voxelRenderer.markDirty(dirtyChunks);
          this.voxelRenderer.updateDirty();
        }
      }

      // Обновляем жидкость
      if (this.fluid) {
        this.fluid.step(this.FIXED_DT);
      }
    }

    // Проверка состояния игры
    if (this.gameplay.state === GameState.WIN) {
      this.hud.showMessage('Победа!', 5000);
      setTimeout(() => {
        this.currentLevelIndex++;
        this.loadLevel(this.currentLevelIndex);
      }, 3000);
    } else if (this.gameplay.state === GameState.LOSE) {
      this.hud.showMessage('Поражение! Нажмите R для рестарта', 5000);
    }

    this.renderer.render();
    this.debug.endFrame();
  };

  dispose(): void {
    this.hud.dispose();
    this.debug.dispose();
    if (this.voxelRenderer) {
      this.voxelRenderer.dispose();
    }
    this.renderer.dispose();
  }
}

