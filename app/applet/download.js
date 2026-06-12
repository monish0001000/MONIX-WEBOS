import fs from 'fs';
import https from 'https';
import path from 'path';

const url = 'https://github.com/monish0001000/monix-web-os/archive/refs/heads/main.zip';
const dest = path.join(process.cwd(), 'repo.zip');

const file = fs.createWriteStream(dest);

https.get(url, (response) => {
  if (response.statusCode === 302 || response.statusCode === 301) {
    https.get(response.headers.location, (res) => {
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log('Downloaded. Need to unzip.');
      });
    });
  } else {
    response.pipe(file);
    file.on('finish', () => {
      file.close();
      console.log('Downloaded.');
    });
  }
}).on('error', (err) => {
  fs.unlink(dest, () => {});
  console.error(err.message);
});
