import { cp, mkdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';

const workspace = resolve(import.meta.dirname, '..');
const destination = resolve(workspace, '.firebase', 'hosting');

await rm(destination, { force: true, recursive: true });
await mkdir(destination, { recursive: true });
await cp(resolve(workspace, 'apps', 'website', 'out'), destination, {
  recursive: true,
});
await cp(
  resolve(workspace, 'apps', 'admin', 'out'),
  resolve(destination, 'admin'),
  { recursive: true },
);

console.info(`Firebase Hosting bundle prepared at ${destination}`);
