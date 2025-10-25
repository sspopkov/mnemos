import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { createServer } from '../server';

async function generateOpenApi() {
  const server = createServer({ logger: false });

  await server.ready();
  const specification = server.swagger();
  const outputPath = resolve(__dirname, '../../openapi.json');

  await writeFile(outputPath, JSON.stringify(specification, null, 2), 'utf-8');

  await server.close();
}

generateOpenApi().catch((error) => {
  console.error('Failed to generate OpenAPI specification', error);
  process.exit(1);
});
