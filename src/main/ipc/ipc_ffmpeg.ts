import AdmZip from 'adm-zip';
import is from 'electron-is';
import fse from 'fs-extra';
import https from 'https';
import path from 'path';
import { getFfmpegPath } from '../recorder/helper';

async function downloadAndUnzip({
  url,
  savePath,
}: {
  url: string;
  savePath: string;
}): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fse.createWriteStream(savePath);
    https
      .get(url, (response) => {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          // 解压到当前目录
          const zip = new AdmZip(savePath);
          zip.extractAllTo(path.dirname(savePath), true); // true 表示覆盖已有文件
          resolve(undefined);
        });
      })
      .on('error', (err) => {
        fse.unlink(savePath, () => reject(err)); // 删除无效文件
        reject(err);
      });
  });
}

function getDownloadUrl(): string {
  if (is.macOS()) {
    return 'https://evermeet.cx/pub/ffmpeg/ffmpeg-7.1.1.zip';
  }
  return 'https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl-shared.zip';
}

const ipcMainApiOfFfmpeg = {
  checkFfmpeg: async (): Promise<string> => {
    const ffmpegPath = getFfmpegPath();
    console.log('ffmpegPath', ffmpegPath);
    return fse.existsSync(ffmpegPath) ? ffmpegPath : '';
  },
  installFfmpeg: async (): Promise<void> => {
    const downloadUrl = getDownloadUrl();
    console.log('downloadUrl', downloadUrl);
    await downloadAndUnzip({
      url: downloadUrl,
      savePath: getFfmpegPath(),
    });
  },
};

export { ipcMainApiOfFfmpeg };
