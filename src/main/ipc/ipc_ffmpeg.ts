import AdmZip from 'adm-zip';
import is from 'electron-is';
import fse from 'fs-extra';
import http from 'http';
import { getFfmpegPath } from '../recorder/helper';

function getDownloadUrl(): string {
  if (is.macOS()) {
    return 'http://47.105.58.181:3001/ffmpeg/ffmpeg-7.1.1.zip';
  }
  return 'http://47.105.58.181:3001/ffmpeg/ffmpeg-master-latest-win64-gpl-shared.zip';
}

const ipcMainApiOfFfmpeg = {
  checkFfmpeg: async (): Promise<string> => {
    const ffmpegPath = getFfmpegPath();
    console.log('ffmpegPath', ffmpegPath);

    return fse.existsSync(ffmpegPath) ? ffmpegPath : '';
  },
  installFfmpeg: async (): Promise<void> => {
    const url = getDownloadUrl();

    return new Promise((resolve, reject) => {
      const file = fse.createWriteStream('./ffmpeg.zip');
      http
        .get(url, (response) => {
          response.pipe(file);
          file.on('finish', () => {
            file.close();
            // 解压到当前目录
            const zip = new AdmZip('./ffmpeg.zip');

            zip.extractAllTo('./ffmpeg/', true); // true 表示覆盖已有文件
            resolve(undefined);
          });
        })
        .on('error', (err) => {
          fse.unlink('./ffmpeg.zip', () => reject(err)); // 删除无效文件
          reject(err);
        });
    });
  },
};

export { ipcMainApiOfFfmpeg };
