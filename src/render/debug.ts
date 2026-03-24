/**
 * Дебаг хелперы: оси, статистика
 */

import * as THREE from 'three';
import Stats from 'stats.js';

export class DebugHelpers {
  private stats: Stats;
  private axesHelper: THREE.AxesHelper | null = null;

  constructor() {
    this.stats = new Stats();
    this.stats.showPanel(0);
    document.body.appendChild(this.stats.dom);
  }

  beginFrame(): void {
    this.stats.begin();
  }

  endFrame(): void {
    this.stats.end();
  }

  addAxesHelper(scene: THREE.Scene, size: number = 5): void {
    if (this.axesHelper) {
      scene.remove(this.axesHelper);
    }
    this.axesHelper = new THREE.AxesHelper(size);
    scene.add(this.axesHelper);
  }

  addGridHelper(scene: THREE.Scene, size: number = 100, divisions: number = 100): void {
    const gridHelper = new THREE.GridHelper(size, divisions);
    scene.add(gridHelper);
  }

  dispose(): void {
    if (this.stats.dom.parentNode) {
      this.stats.dom.parentNode.removeChild(this.stats.dom);
    }
  }
}

