import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { App } from './app/App';

// Создаём общий клиент для всех запросов React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false, // отключить автоматические ретраи при ошибках
      refetchOnWindowFocus: false, // не перезапрашивать при фокусе окна
      staleTime: 30_000, // данные считаются свежими 30 секунд
    },
  },
});

const container = document.getElementById('root');
if (!container) {
  throw new Error('Не удалось найти корневой элемент приложения');
}

createRoot(container).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
);
