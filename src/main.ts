/**
 * Точка входа приложения
 */

import { App } from './app/App';

const container = document.getElementById('app');
if (!container) {
  throw new Error('Контейнер #app не найден');
}

const app = new App(container);

// Cleanup при закрытии
window.addEventListener('beforeunload', () => {
  app.dispose();
});

