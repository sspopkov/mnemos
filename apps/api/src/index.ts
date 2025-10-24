import { startServer } from './app';

startServer().catch((error) => {
  console.error(error, 'Failed to start API server');
  process.exit(1);
});
