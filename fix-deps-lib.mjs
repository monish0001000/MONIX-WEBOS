import fs from 'fs';
import path from 'path';

function fixPackageJson(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');
  const pkg = JSON.parse(content);
  
  if (pkg.dependencies) {
    for (const key in pkg.dependencies) {
      if (pkg.dependencies[key].startsWith('catalog:') || pkg.dependencies[key].startsWith('workspace:')) {
        pkg.dependencies[key] = '*';
      }
    }
  }
  
  if (pkg.devDependencies) {
    for (const key in pkg.devDependencies) {
      if (pkg.devDependencies[key].startsWith('catalog:') || pkg.devDependencies[key].startsWith('workspace:')) {
        pkg.devDependencies[key] = '*';
      }
    }
  }
  
  fs.writeFileSync(filePath, JSON.stringify(pkg, null, 2));
}

['lib/api-client-react', 'lib/api-spec', 'lib/api-zod', 'lib/db'].forEach(dir => {
  fixPackageJson(path.join(process.cwd(), dir, 'package.json'));
});
console.log('Fixed package.json catalog/workspace versions for lib');
