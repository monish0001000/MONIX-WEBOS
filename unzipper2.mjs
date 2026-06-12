import extract from 'extract-zip';
import path from 'path';

async function main() {
  try {
    await extract(path.join(process.cwd(), 'repo2.zip'), { dir: path.join(process.cwd(), 'repo_extracted') });
    console.log('Extraction complete');
  } catch (err) {
    console.error(err);
  }
}

main();
