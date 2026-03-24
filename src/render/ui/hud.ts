/**
 * HUD: сила выстрела, индикаторы
 */

import type { Vec3 } from '../../core/math';

export class HUD {
  private container: HTMLElement;
  private powerBar: HTMLElement;
  private powerLabel: HTMLElement;
  private statsContainer: HTMLElement;
  private destroyedLabel: HTMLElement;
  private speedLabel: HTMLElement;
  private timeLabel: HTMLElement;
  private aimArrow: HTMLElement;

  constructor() {
    this.container = document.createElement('div');
    this.container.id = 'hud';
    this.container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      font-family: 'Arial', sans-serif;
      color: white;
      z-index: 1000;
    `;

    // Индикатор силы
    const powerContainer = document.createElement('div');
    powerContainer.style.cssText = `
      position: absolute;
      bottom: 50px;
      left: 50%;
      transform: translateX(-50%);
      width: 300px;
      pointer-events: auto;
    `;

    this.powerLabel = document.createElement('div');
    this.powerLabel.textContent = 'Сила выстрела';
    this.powerLabel.style.cssText = 'text-align: center; margin-bottom: 10px; font-size: 18px;';

    this.powerBar = document.createElement('div');
    this.powerBar.style.cssText = `
      width: 100%;
      height: 30px;
      background: rgba(0,0,0,0.5);
      border: 2px solid white;
      border-radius: 5px;
      overflow: hidden;
    `;

    const powerFill = document.createElement('div');
    powerFill.id = 'power-fill';
    powerFill.style.cssText = `
      height: 100%;
      width: 0%;
      background: linear-gradient(90deg, #00ff00, #ffff00, #ff0000);
      transition: width 0.1s;
    `;

    this.powerBar.appendChild(powerFill);
    powerContainer.appendChild(this.powerLabel);
    powerContainer.appendChild(this.powerBar);

    // Стрелка прицела
    this.aimArrow = document.createElement('div');
    this.aimArrow.id = 'aim-arrow';
    this.aimArrow.style.cssText = `
      position: absolute;
      bottom: 120px;
      left: 50%;
      transform: translateX(-50%);
      width: 100px;
      height: 100px;
      pointer-events: none;
      opacity: 0;
    `;

    // Статистика
    this.statsContainer = document.createElement('div');
    this.statsContainer.style.cssText = `
      position: absolute;
      top: 20px;
      right: 20px;
      background: rgba(0,0,0,0.7);
      padding: 15px;
      border-radius: 5px;
      min-width: 200px;
    `;

    this.destroyedLabel = document.createElement('div');
    this.destroyedLabel.textContent = 'Разрушено: 0';
    this.destroyedLabel.style.cssText = 'margin-bottom: 10px;';

    this.speedLabel = document.createElement('div');
    this.speedLabel.textContent = 'Скорость: 0 м/с';
    this.speedLabel.style.cssText = 'margin-bottom: 10px;';

    this.timeLabel = document.createElement('div');
    this.timeLabel.textContent = 'Время: 0.0 с';

    this.statsContainer.appendChild(this.destroyedLabel);
    this.statsContainer.appendChild(this.speedLabel);
    this.statsContainer.appendChild(this.timeLabel);

    this.container.appendChild(powerContainer);
    this.container.appendChild(this.aimArrow);
    this.container.appendChild(this.statsContainer);
    document.body.appendChild(this.container);
  }

  updatePower(power: number): void {
    const fill = document.getElementById('power-fill');
    if (fill) {
      fill.style.width = `${power * 100}%`;
    }
  }

  updateAimArrow(direction: Vec3, visible: boolean): void {
    if (!visible) {
      this.aimArrow.style.opacity = '0';
      return;
    }

    const angle = Math.atan2(direction.x, direction.z) * (180 / Math.PI);
    this.aimArrow.style.opacity = '1';
    this.aimArrow.style.transform = `translateX(-50%) rotate(${angle}deg)`;
    this.aimArrow.innerHTML = '→';
    this.aimArrow.style.fontSize = '60px';
    this.aimArrow.style.textAlign = 'center';
  }

  updateStats(destroyed: number, speed: number, time: number): void {
    this.destroyedLabel.textContent = `Разрушено: ${destroyed}`;
    this.speedLabel.textContent = `Скорость: ${speed.toFixed(1)} м/с`;
    this.timeLabel.textContent = `Время: ${time.toFixed(1)} с`;
  }

  showMessage(text: string, duration: number = 3000): void {
    const msg = document.createElement('div');
    msg.textContent = text;
    msg.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0,0,0,0.9);
      padding: 30px 60px;
      border-radius: 10px;
      font-size: 32px;
      font-weight: bold;
      text-align: center;
    `;
    this.container.appendChild(msg);

    setTimeout(() => {
      if (msg.parentNode) {
        msg.parentNode.removeChild(msg);
      }
    }, duration);
  }

  dispose(): void {
    if (this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
}

