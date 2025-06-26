import { app } from 'electron';
import is from 'electron-is';
import fse from 'fs-extra';
import path from 'path';

const ffmpegOutputOptions: string[] = [
  '-c copy',
  '-movflags frag_keyframe',
  '-min_frag_duration 60000000',
];
const inputOptionsArgs = [
  '-user_agent',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.86 Safari/537.36',
  /**
   * ffmpeg 在处理抖音提供的某些直播间的流时，它会在 avformat_find_stream_info 阶段花费过多时间，这会让录制的过程推迟很久，从而触发超时。
   * 这里通过降低 avformat_find_stream_info 所需要的字节数量（默认为 5000000）来解决这个问题。
   *
   * Refs:
   * https://github.com/Sunoo/homebridge-camera-ffmpeg/issues/462#issuecomment-617723949
   * https://stackoverflow.com/a/49273163/21858805
   */
  '-probesize',
  (64 * 1024).toString(),
];

function getFfmpegDir(): string {
  const dataPath = app.getPath('userData');
  console.log('dataPath', dataPath);

  return path.resolve(dataPath, 'downloads', './ffmpeg/');
}

function getFfmpegPath(): string {
  const dir = getFfmpegDir();

  if (is.macOS()) {
    return path.resolve(dir, './ffmpeg');
  }

  return path.resolve(dir, './ffmpeg-master-latest-win64-gpl-shared/bin/ffmpeg.exe');
}

function getZipFilePath(): string {
  return path.resolve(getFfmpegDir(), 'ffmpeg.zip');
}

/**
 * 获取下一个可用的递增文件名，如 fileName_1.mp4、fileName_2.mp4
 */
async function getNextFileName({
  outputDir,
  fileName,
}: {
  outputDir: string;
  fileName: string;
}): Promise<string> {
  const parsed = path.parse(fileName);
  const name = parsed.name;
  const ext = parsed.ext || '.mp4';

  // 读取目录下所有文件
  const files = await fse.readdir(outputDir).catch(() => []);
  // 匹配 baseName_数字.ext
  const reg = new RegExp(`^${name}_(\\d+)${ext.replace('.', '.')}$`);
  let maxIndex = 0;
  files.forEach((file) => {
    const match = file.match(reg);
    if (match) {
      const idx = parseInt(match[1], 10);
      if (idx > maxIndex) maxIndex = idx;
    }
  });
  return `${name}第${maxIndex + 1}集${ext}`;
}

export {
  ffmpegOutputOptions,
  getFfmpegDir,
  getFfmpegPath,
  getNextFileName,
  getZipFilePath,
  inputOptionsArgs,
};
