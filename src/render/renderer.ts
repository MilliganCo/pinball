/**
 * Сцена, камеры, свет
 */

import * as THREE from 'three';
import type { Vec3 } from '../core/math';

export class Renderer {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  controls: { enabled: boolean } = { enabled: true };

  constructor(container: HTMLElement) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb);

    // Камера
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(20, 15, 20);
    this.camera.lookAt(0, 0, 0);

    // Рендерер
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(this.renderer.domElement);

    // Свет
    const ambientLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 50, 50);
    directionalLight.castShadow = false;
    this.scene.add(directionalLight);

    // Обработка изменения размера
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  setCameraTarget(target: Vec3, distance: number = 20): void {
    const angle = Math.atan2(target.x, target.z);
    const height = Math.max(5, target.y + 5);
    this.camera.position.set(
      target.x + Math.sin(angle) * distance,
      height,
      target.z + Math.cos(angle) * distance
    );
    this.camera.lookAt(target.x, target.y, target.z);
  }

  followBall(ballPos: Vec3, offset: Vec3 = { x: 0, y: 8, z: 12 }): void {
    this.camera.position.set(
      ballPos.x + offset.x,
      ballPos.y + offset.y,
      ballPos.z + offset.z
    );
    this.camera.lookAt(ballPos.x, ballPos.y, ballPos.z);
  }

  render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  dispose(): void {
    this.renderer.dispose();
  }
}

