import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import { getFfmpegPath } from '../recorder/helper';

function videoStick({
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

  const top = 50;
  function getOptions(index: number): object {
    return {
      x: '(w-text_w)/2', // 水平居中
      y: top + index * (50 + 20),
      fontfile: path.resolve(desktopPath, './SourceHanSansSC-Medium-2.otf'),
      fontsize: index <= 1 ? 50 : 30,
      fontcolor: index === 0 ? 'yellow' : 'white',
      borderw: 2,
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

const desktopPath = '/Users/liyatang/Desktop/test';
videoStick({
  input: path.resolve(desktopPath, './test.mp4'),
  output: path.resolve(desktopPath, './output.mp4'),
  texts: ['深港驾校', '12344457876', '深圳市宝安区留仙二路'],
});

export { videoStick };
