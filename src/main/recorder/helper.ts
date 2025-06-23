import is from 'electron-is';
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

function getFfmpegPath(): string {
  if (is.macOS()) {
    return path.resolve('./ffmpeg');
  }
  return path.resolve('./ffmpeg/bin/ffmpeg.exe');
}

export { ffmpegOutputOptions, getFfmpegPath, inputOptionsArgs };
