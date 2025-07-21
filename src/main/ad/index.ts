import ffmpeg from 'fluent-ffmpeg';
import { getFfmpegPath } from '../recorder/helper';

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
      fontfile: 'simhei',
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
