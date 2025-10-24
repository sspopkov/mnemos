import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './app/App.tsx';

const container = document.getElementById('root');

if (!container) {
  throw new Error('Не удалось найти корневой элемент приложения');
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
