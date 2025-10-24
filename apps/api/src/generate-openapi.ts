import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { createOpenApiDocument } from './openapi';

async function generateOpenApiSpec() {
  const spec = createOpenApiDocument();

  const outputDir = path.resolve(__dirname, '../../..', 'packages/types/src');
  await mkdir(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, 'openapi.json');
  await writeFile(outputPath, JSON.stringify(spec, null, 2), 'utf8');
  console.log(`OpenAPI specification generated at ${outputPath}`);
}

generateOpenApiSpec().catch((error) => {
  console.error('Failed to generate OpenAPI specification', error);
  process.exitCode = 1;
});
