import fs from 'fs';
import https from 'https';
import path from 'path';
import extract from 'extract-zip';

async function main() {
  const url = 'https://github.com/monish0001000/monix-web-os/archive/refs/heads/master.zip';
  const dest = path.join(process.cwd(), 'repo4.zip');
  const extractedDir = path.join(process.cwd(), 'repo4_extracted');

  const file = fs.createWriteStream(dest);

  https.get(url, (response) => {
    if (response.statusCode === 302 || response.statusCode === 301) {
      https.get(response.headers.location, (res) => {
        res.pipe(file);
        file.on('finish', async () => {
          file.close();
          console.log('Downloaded.');
          await extract(dest, { dir: extractedDir });
          console.log('Extracted.');
          
          // Now safely copy everything over
          fs.cpSync(path.join(extractedDir, 'monix-web-os-version1'), process.cwd(), { recursive: true, force: true });
          console.log('Copied files safely!');
        });
      });
    } else {
      console.error("Failed", response.statusCode);
    }
  });
}
main();
