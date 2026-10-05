import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, '..');

export default async function globalSetup() {
  process.env.DATABASE_URL =
    process.env.DATABASE_URL ||
    'postgresql://postgres:postgres@127.0.0.1:5432/marhas_test?schema=public&connection_limit=5';

  execSync('npx prisma migrate deploy', {
    cwd: backendRoot,
    env: process.env,
    stdio: 'inherit'
  });
}
