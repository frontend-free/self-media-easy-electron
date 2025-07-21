import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import { getFfmpegPath } from '../recorder/helper';

function getFontPath(): string {
  // 开发环境
  if (process.env.NODE_ENV === 'development') {
    return path.resolve(__dirname, '../../resources/fonts/SourceHanSansSC-Medium-2.otf');
  }
  // 生产环境（打包后）
  return path.resolve(process.resourcesPath, 'fonts/SourceHanSansSC-Medium-2.otf');
}

async function videoStick({
  input,
  output,
  texts,
}: {
  input: string;
  output: string;
  texts: string[];
}): Promise<void> {
  const ffmpegPath = getFfmpegPath();
  ffmpeg.setFfmpegPath(ffmpegPath);

  const top = 80;
  const left = 20;
  const fontSize = 30;
  function getOptions(index: number): object {
    return {
      x: left,
      y: top + index * (fontSize + 10),
      fontfile: getFontPath(),
      fontsize: fontSize,
      fontcolor: 'white',
      borderw: 1,
      bordercolor: 'black',
    };
  }

  return new Promise((resolve, reject) => {
    ffmpeg(input)
      .videoFilters(
        texts.map((text, index) => ({
          filter: 'drawtext',
          options: {
            ...getOptions(index),
            text,
          },
        })),
      )
      .on('start', (commandLine) => console.log(`videoStick start: ${commandLine}`))
      .on('end', () => {
        console.log('videoStick end');
        resolve();
      })
      .on('error', (err) => {
        console.error(`videoStick error: ${err.message}`);
        reject(err);
      })
      .save(output);
  });
}

export { videoStick };
