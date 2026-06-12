import fs from 'fs';
import path from 'path';

const srcDir = path.join(process.cwd(), 'repo_extracted', 'monix-web-os-version1');
const destDir = process.cwd();

// Delete existing conflicting files
const toDelete = ['src', 'index.html', 'vite.config.ts', 'tsconfig.json', 'package.json', 'package-lock.json', '.gitignore'];
for (const item of toDelete) {
  fs.rmSync(path.join(destDir, item), { recursive: true, force: true });
}

// Move files from repo
const files = fs.readdirSync(srcDir);
for (const file of files) {
  fs.renameSync(path.join(srcDir, file), path.join(destDir, file));
}
console.log('Moved files to root');
