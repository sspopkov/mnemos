import { defineConfig } from 'orval';

export default defineConfig({
  api: {
    input: './swagger.json',
    output: {
      target: './api/index.ts',
      client: 'fetch',
      clean: true,
    },
  },
});
