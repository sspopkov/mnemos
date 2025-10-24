import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { config } from 'dotenv';

// эмулируем __dirname в ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// грузим .env из каталога apps/api/.env
config({ path: resolve(__dirname, '../.env') });