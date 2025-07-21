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

  const left = 20;
  const fontSize = 30;
  function getOptions(index: number): object {
    return {
      x: left,
      y: `(h-th)/2-70+${index * (fontSize + 10)}`,
      fontfile: 'simhei',
      fontsize: fontSize,
      fontcolor: '#FFFFFF@0.7',
      // borderw: 1,
      // bordercolor: 'black',
    };
  }

  const logoFilter = {
    filter: 'drawtext',
    options: {
      x: `w-tw-10`,
      y: `h-th-80`,
      fontfile: 'simhei',
      fontsize: 30,
      fontcolor: '#FFFFFF@0.8',
      text: '驾K先锋',
    },
  };

  return new Promise((resolve, reject) => {
    const filters = texts.map((text, index) => ({
      filter: 'drawtext',
      options: {
        ...getOptions(index),
        text,
      },
    }));
    ffmpeg(input)
      .videoFilters([...filters, logoFilter])
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
