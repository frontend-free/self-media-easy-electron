import AdmZip from 'adm-zip';
import { exec } from 'child_process';
import is from 'electron-is';
import fse from 'fs-extra';
import http from 'http';
import { promisify } from 'util';
import { getFfmpegPath } from '../recorder/helper';
const execAsync = promisify(exec);

function getDownloadUrl(): string {
  if (is.macOS()) {
    return 'http://47.105.58.181:3001/ffmpeg/ffmpeg-7.1.1.zip';
  }
  return 'http://47.105.58.181:3001/ffmpeg/ffmpeg-master-latest-win64-gpl-shared.zip';
}

async function download({ url, filePath }: { url: string; filePath: string }): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fse.createWriteStream(filePath);
    http
      .get(url, (response) => {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve(undefined);
        });
      })
      .on('error', (err) => {
        fse.unlink('./ffmpeg.zip', () => reject(err)); // 删除无效文件
        reject(err);
      });
  });
}

const ipcMainApiOfFfmpeg = {
  checkFfmpeg: async (): Promise<string> => {
    const ffmpegPath = getFfmpegPath();
    console.log('ffmpegPath', ffmpegPath);

    return fse.existsSync(ffmpegPath) ? ffmpegPath : '';
  },
  installFfmpeg: async (): Promise<void> => {
    const url = getDownloadUrl();

    await download({ url, filePath: './ffmpeg.zip' });

    if (is.macOS()) {
      await execAsync('unzip -o ./ffmpeg.zip -d ./ffmpeg/');
    } else {
      const zip = new AdmZip('./ffmpeg.zip');

      zip.extractAllTo('./ffmpeg/', true);
    }
  },
};

export { ipcMainApiOfFfmpeg };
